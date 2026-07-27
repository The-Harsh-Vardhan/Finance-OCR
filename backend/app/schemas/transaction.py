from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_date: Optional[str] = None
    raw_date: Optional[str] = None
    description: str
    category: str
    subcategory: Optional[str] = None
    crop: Optional[str] = None
    type: str = "Expense" # Expense or Income
    amount: float
    unit: Optional[str] = None
    confidence: float = 1.0
    confidence_level: str = "High"
    verified: bool = False
    bounding_box: Optional[str] = None

class TransactionCreate(TransactionBase):
    notebook_id: str

class TransactionUpdate(BaseModel):
    transaction_date: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    crop: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    unit: Optional[str] = None
    verified: Optional[bool] = True

class TransactionResponse(TransactionBase):
    id: str
    notebook_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BatchVerifyRequest(BaseModel):
    notebook_id: str
    transactions: List[TransactionResponse]
