from fastapi import APIRouter
from app.api.v1.endpoints import notebooks, transactions, analytics, knowledge_base

api_router = APIRouter()

api_router.include_router(notebooks.router, prefix="/notebooks", tags=["Notebooks"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(knowledge_base.router, prefix="/knowledge-base", tags=["Knowledge Base"])
