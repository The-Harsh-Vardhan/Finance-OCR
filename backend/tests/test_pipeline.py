import pytest
import numpy as np
import cv2
from app.services.image_processor import ImageProcessor
from app.services.farm_knowledge_base import FarmKnowledgeBase
from app.services.validation_engine import ValidationEngine
from app.services.llm_parser import LLMParserService

def test_image_blur_calculation():
    img = np.zeros((400, 400, 3), dtype=np.uint8)
    cv2.putText(img, "Test Text", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    blur_score = ImageProcessor.calculate_blur_score(img)
    assert blur_score > 10.0

def test_farm_knowledge_base_resolution():
    cat1, subcat1 = FarmKnowledgeBase.resolve_term("मजुरी निंदणी ५ दिवस")
    assert cat1 == "Labour"

    cat2, subcat2 = FarmKnowledgeBase.resolve_term("DAP fertilizer 2 bags")
    assert cat2 == "Fertilizer"
    assert subcat2 == "Di-Ammonium Phosphate"

    cat3, subcat3 = FarmKnowledgeBase.resolve_term("कपास बी")
    assert cat3 == "Seeds"

def test_three_step_pipeline_output():
    raw_tx = {
        "ocr_text": "०५/०६/२०२६ कपास बी 3440",
        "description_en": "Cotton seed purchase",
        "description": "कपास बी",
        "date": "2026-06-05",
        "category": "Seeds",
        "amount": 3440.0,
        "confidence": 0.96
    }
    result = ValidationEngine.validate_and_enrich(raw_tx)
    assert result["ocr_text"] == "०५/०६/२०२६ कपास बी 3440"
    assert result["description_en"] == "Cotton seed purchase"
    assert result["category"] == "Seeds"
    assert result["amount"] == 3440.0
    assert result["confidence_level"] == "High"
    assert result["verified"] is True


def test_ocr_text_parser_extracts_real_transactions():
    raw_text = """
    05/06/2026 कपास बी 3440
    14/06/2026 DAP fertilizer 2700
    20/11/2026 कपास बिक्री 56000
    """
    transactions = LLMParserService.parse_ocr_text(raw_text, crop_hint="Cotton")

    assert len(transactions) == 3
    assert transactions[0]["amount"] == 3440.0
    assert transactions[0]["crop"] == "Cotton"
    assert transactions[1]["category"] == "Fertilizer"
    assert transactions[2]["type"] == "Income"
