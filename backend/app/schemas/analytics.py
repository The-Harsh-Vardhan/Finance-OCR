from pydantic import BaseModel
from typing import Dict, List, Optional

class CategorySummary(BaseModel):
    category: str
    total_amount: float
    percentage: float
    transaction_count: int

class CropSummary(BaseModel):
    crop: str
    total_expense: float
    total_income: float
    net_profit: float
    cost_per_acre: Optional[float] = None

class AnalyticsSummaryResponse(BaseModel):
    total_notebooks: int
    total_transactions: int
    verified_transactions: int
    unverified_transactions: int
    total_expenses: float
    total_income: float
    net_profit_loss: float
    category_breakdown: List[CategorySummary]
    crop_breakdown: List[CropSummary]
