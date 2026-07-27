import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    notebook_id = Column(String, ForeignKey("notebooks.id"), nullable=False)
    transaction_date = Column(String, nullable=True) # Normalized date string YYYY-MM-DD
    raw_date = Column(String, nullable=True) # Original text from OCR
    description = Column(String, nullable=False) # Original OCR description
    category = Column(String, nullable=False) # e.g. Fertilizer, Labour, Pesticide, Machinery, Sales, Seeds, Irrigation
    subcategory = Column(String, nullable=True) # e.g. Insecticide, DAP, Sowing, Harvesting
    crop = Column(String, nullable=True) # Cotton, Soybean, Sugarcane, Wheat, etc.
    type = Column(String, default="Expense") # Expense or Income
    amount = Column(Float, nullable=False, default=0.0) # Amount in INR
    unit = Column(String, nullable=True) # kg, bags, acres, days, hours
    confidence = Column(Float, nullable=False, default=1.0) # Composite score 0.0 - 1.0
    confidence_level = Column(String, default="High") # High, Medium, Low
    verified = Column(Boolean, default=False) # True after farmer review
    bounding_box = Column(String, nullable=True) # Optional JSON string [x1, y1, x2, y2]
    created_at = Column(DateTime, default=datetime.utcnow)
