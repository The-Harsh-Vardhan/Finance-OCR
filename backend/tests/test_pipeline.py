import pytest
import os
import numpy as np
import cv2
from app.services.image_processor import ImageProcessor
from app.services.farm_knowledge_base import FarmKnowledgeBase
from app.services.validation_engine import ValidationEngine

def test_image_blur_calculation():
    # Create a sharp image
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

def test_validation_engine_scoring():
    raw_tx = {
        "date": "12/06/2026",
        "description": "DAP खाद 2 बैग",
        "category": "Fertilizer",
        "amount": 2700.0,
        "confidence": 0.95
    }
    result = ValidationEngine.validate_and_enrich(raw_tx)
    assert result["category"] == "Fertilizer"
    assert result["amount"] == 2700.0
    assert result["confidence_level"] == "High"
    assert result["verified"] is True
