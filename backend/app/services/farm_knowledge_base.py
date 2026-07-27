from typing import Dict, Any, Optional, Tuple

class FarmKnowledgeBase:
    """
    Domain-specific Farm Knowledge Base for Indian agricultural ledgers.
    Maps local terms (Hindi/Marathi/English) to standard categories, crops, and price sanity bounds.
    """

    CATEGORIES = [
        "Fertilizer", "Pesticide", "Labour", "Machinery", "Sales", "Seeds", "Irrigation", "Transport", "Miscellaneous"
    ]

    # Indic & Regional Term Dictionary
    TERM_MAPPINGS = {
        # Labour terms
        "मजुरी": ("Labour", "Daily Wage", "hi"),
        "मजदुरी": ("Labour", "Daily Wage", "hi"),
        "निंदणी": ("Labour", "Weeding", "mr"),
        "खुरपणी": ("Labour", "Weeding", "mr"),
        "कापणी": ("Labour", "Harvesting", "mr"),
        "लागवड": ("Labour", "Sowing/Planting", "mr"),
        "मजूर": ("Labour", "Manual Labour", "hi"),
        "labour": ("Labour", "General Labour", "en"),
        "labor": ("Labour", "General Labour", "en"),
        "wage": ("Labour", "Daily Wage", "en"),
        "harvester": ("Labour", "Harvesting", "en"),

        # Fertilizer terms
        "dap": ("Fertilizer", "Di-Ammonium Phosphate", "en"),
        "डीएपी": ("Fertilizer", "Di-Ammonium Phosphate", "hi"),
        "urea": ("Fertilizer", "Urea", "en"),
        "युरिया": ("Fertilizer", "Urea", "mr"),
        "यूरिया": ("Fertilizer", "Urea", "hi"),
        "10:26:26": ("Fertilizer", "N-P-K Complex", "en"),
        "20:20:0": ("Fertilizer", "Complex Fertilizer", "en"),
        "ssp": ("Fertilizer", "Single Super Phosphate", "en"),
        "potash": ("Fertilizer", "Potash", "en"),
        "खात": ("Fertilizer", "Manure/Fertilizer", "mr"),
        "खाद": ("Fertilizer", "Fertilizer", "hi"),

        # Pesticide terms
        "कीटकनाशक": ("Pesticide", "Insecticide", "mr"),
        "कीटनाशक": ("Pesticide", "Insecticide", "hi"),
        "फवारणी": ("Pesticide", "Spraying", "mr"),
        "coragen": ("Pesticide", "Insecticide (Coragen)", "en"),
        "monocrotophos": ("Pesticide", "Insecticide", "en"),
        "monoceb": ("Pesticide", "Fungicide", "en"),
        "pesticide": ("Pesticide", "General Pesticide", "en"),
        "spray": ("Pesticide", "Spraying Chemical", "en"),

        # Seed terms
        "बियाणे": ("Seeds", "Seeds", "mr"),
        "बीज": ("Seeds", "Seeds", "hi"),
        " बी": ("Seeds", "Seeds", "hi"),
        "बी": ("Seeds", "Seeds", "hi"),
        "seed": ("Seeds", "Seeds", "en"),
        "bt cotton": ("Seeds", "Cotton Seeds", "en"),
        "महाबीज": ("Seeds", "Mahabeej Seeds", "mr"),
        "soybean seed": ("Seeds", "Soybean Seeds", "en"),

        # Machinery / Transport terms
        "ट्रॅक्टर": ("Machinery", "Tractor Service", "mr"),
        "ट्रैक्टर": ("Machinery", "Tractor Service", "hi"),
        "tractor": ("Machinery", "Tractor Service", "en"),
        "नांगरटी": ("Machinery", "Ploughing", "mr"),
        "रोटाव्हेटर": ("Machinery", "Rotavator", "mr"),
        "डिझेल": ("Machinery", "Diesel Fuel", "mr"),
        "डीजल": ("Machinery", "Diesel Fuel", "hi"),
        "diesel": ("Machinery", "Diesel Fuel", "en"),
        "भाडे": ("Transport", "Transport Freight", "mr"),
        "भाडा": ("Transport", "Transport Freight", "hi"),

        # Sales / Income terms
        "विक्री": ("Sales", "Crop Sale", "mr"),
        "बिक्री": ("Sales", "Crop Sale", "hi"),
        "sale": ("Sales", "Produce Sale", "en"),
        "उत्पन्न": ("Sales", "Income", "mr"),
        "व्यापारी": ("Sales", "Trader Sale", "mr"),
        "मंडी": ("Sales", "Mandi Sale", "hi"),

        # Irrigation
        "पाणी": ("Irrigation", "Water Supply", "mr"),
        "पानी": ("Irrigation", "Water Supply", "hi"),
        "मोटार": ("Irrigation", "Motor Repair/Electricity", "mr"),
        "drip": ("Irrigation", "Drip Irrigation", "en"),
    }

    # Category Price Bounds (Sanity checks in INR)
    PRICE_BOUNDS = {
        "Fertilizer": (200.0, 50000.0),
        "Pesticide": (100.0, 35000.0),
        "Labour": (100.0, 80000.0),
        "Machinery": (300.0, 100000.0),
        "Seeds": (200.0, 60000.0),
        "Sales": (500.0, 1000000.0),
        "Irrigation": (100.0, 50000.0),
        "Transport": (100.0, 40000.0),
        "Miscellaneous": (10.0, 100000.0),
    }

    @classmethod
    def resolve_term(cls, text: str) -> Tuple[str, Optional[str]]:
        """
        Lookup local Hindi/Marathi/English terms in text to infer Category and Subcategory.
        """
        text_lower = text.lower()
        for alias, (cat, subcat, lang) in cls.TERM_MAPPINGS.items():
            if alias.lower() in text_lower:
                return cat, subcat
        return "Miscellaneous", None

    @classmethod
    def is_income(cls, text: str, category: str) -> bool:
        """Determines if the transaction is Income or Expense."""
        if category == "Sales":
            return True
        text_lower = text.lower()
        income_words = ["विक्री", "बिक्री", "sale", "उत्पन्न", "मंडी", "sold", "jama", "जमा"]
        return any(w in text_lower for w in income_words)

    @classmethod
    def validate_amount_bounds(cls, category: str, amount: float) -> bool:
        """Checks if transaction amount falls within realistic sanity bounds."""
        bounds = cls.PRICE_BOUNDS.get(category, (10.0, 500000.0))
        return bounds[0] <= amount <= bounds[1]
