import uuid
from sqlalchemy import Column, String, Float
from app.core.database import Base

class KnowledgeItem(Base):
    __tablename__ = "knowledge_base"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alias = Column(String, nullable=False, unique=True, index=True) # Hindi/Marathi/English local product or task term
    canonical_name = Column(String, nullable=False) # Standardized English name
    category = Column(String, nullable=False) # Fertilizer, Labour, Pesticide, Seeds, etc.
    subcategory = Column(String, nullable=True)
    language = Column(String, default="hi") # hi, mr, en
    min_expected_amount = Column(Float, nullable=True) # Sanity bounds
    max_expected_amount = Column(Float, nullable=True)
