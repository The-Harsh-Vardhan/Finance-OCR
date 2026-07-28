import re
from datetime import datetime
from typing import Dict, Any, Tuple
from app.core.config import settings
from app.services.farm_knowledge_base import FarmKnowledgeBase

class ValidationEngine:
    """
    Rule-based Validation and Confidence Scoring Engine.
    Enforces sanity bounds, arithmetic integrity, and confidence classification.
    """

    @staticmethod
    def normalize_date(date_str: str) -> Tuple[str, float]:
        """Normalizes Indic/Indian date formats to YYYY-MM-DD."""
        if not date_str:
            return datetime.now().strftime("%Y-%m-%d"), 0.60

        # Replace Devanagari numerals with ASCII digits
        devanagari_digits = str.maketrans("०१२३४५६७८९", "0123456789")
        clean_str = date_str.translate(devanagari_digits).strip()

        # Try common date formats
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y", "%Y/%m/%d"):
            try:
                dt = datetime.strptime(clean_str, fmt)
                if dt.year < 2000:
                    dt = dt.replace(year=dt.year + 2000)
                # Check for plausible date (not in far future)
                if dt.year <= datetime.now().year + 1:
                    return dt.strftime("%Y-%m-%d"), 0.95
            except ValueError:
                continue

        return datetime.now().strftime("%Y-%m-%d"), 0.50

    @classmethod
    def validate_and_enrich(cls, raw_tx: Dict[str, Any], crop_hint: str = None) -> Dict[str, Any]:
        """
        Enriches and scores a transaction:
        1. Knowledge Base category mapping
        2. Date normalization
        3. Bounds check
        4. Confidence score calculation (High / Medium / Low)
        """
        desc = raw_tx.get("description", "")
        ocr_text = raw_tx.get("ocr_text", desc)
        desc_en = raw_tx.get("description_en") or raw_tx.get("description") or ocr_text
        clean_desc_en = re.sub(r"^[\d\s./:-]+", "", desc_en).strip()
        if not clean_desc_en:
            clean_desc_en = "Farm Item Entry"

        # 1. Resolve Category & Subcategory from Knowledge Base
        kb_cat, kb_subcat = FarmKnowledgeBase.resolve_term(clean_desc_en)
        category = raw_tx.get("category") or kb_cat
        subcategory = raw_tx.get("subcategory") or kb_subcat

        # Determine type (Expense vs Income)
        is_inc = FarmKnowledgeBase.is_income(desc_en or desc, category)
        tx_type = "Income" if is_inc else "Expense"

        # 2. Date Normalization & Score
        normalized_date, date_conf = cls.normalize_date(raw_tx.get("date") or raw_tx.get("raw_date"))

        # 3. Sanity check amount
        amount = float(raw_tx.get("amount", 0.0))
        valid_bounds = FarmKnowledgeBase.validate_amount_bounds(category, amount)
        bounds_conf = 1.0 if valid_bounds else 0.50

        # 4. Composite Confidence Score
        llm_conf = float(raw_tx.get("confidence", 0.90))
        composite_confidence = round(0.4 * llm_conf + 0.3 * date_conf + 0.3 * bounds_conf, 2)

        # Confidence Level
        if composite_confidence >= settings.CONFIDENCE_AUTO_APPROVE_THRESHOLD:
            conf_level = "High"
            auto_verified = True
        elif composite_confidence >= 0.65:
            conf_level = "Medium"
            auto_verified = False
        else:
            conf_level = "Low"
            auto_verified = False

        return {
            "transaction_date": normalized_date,
            "raw_date": raw_tx.get("raw_date", raw_tx.get("date")),
            "ocr_text": ocr_text,
            "description_en": clean_desc_en,
            "description": clean_desc_en,
            "category": category,
            "subcategory": subcategory,
            "crop": raw_tx.get("crop") or crop_hint or "General",
            "type": tx_type,
            "amount": abs(amount),
            "unit": raw_tx.get("unit"),
            "confidence": composite_confidence,
            "confidence_level": conf_level,
            "verified": auto_verified
        }
