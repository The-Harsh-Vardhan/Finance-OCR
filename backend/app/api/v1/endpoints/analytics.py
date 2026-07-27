from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.notebook import Notebook
from app.models.transaction import Transaction
from app.schemas.analytics import AnalyticsSummaryResponse, CategorySummary, CropSummary

router = APIRouter()

@router.get("/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary(db: Session = Depends(get_db)):
    """Computes farm finance analytics summary across all digitised transactions."""
    total_notebooks = db.query(Notebook).count()
    total_transactions = db.query(Transaction).count()
    verified_tx = db.query(Transaction).filter(Transaction.verified == True).count()
    unverified_tx = total_transactions - verified_tx

    # Expenses & Income totals
    total_expenses = db.query(func.sum(Transaction.amount)).filter(Transaction.type == "Expense").scalar() or 0.0
    total_income = db.query(func.sum(Transaction.amount)).filter(Transaction.type == "Income").scalar() or 0.0
    net_pnl = total_income - total_expenses

    # Category Breakdown
    cat_rows = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count")
    ).filter(Transaction.type == "Expense").group_by(Transaction.category).all()

    category_breakdown = []
    for cat, total, count in cat_rows:
        pct = round((total / total_expenses * 100), 2) if total_expenses > 0 else 0.0
        category_breakdown.append(CategorySummary(
            category=cat,
            total_amount=round(total, 2),
            percentage=pct,
            transaction_count=count
        ))

    # Crop Breakdown
    crop_names = db.query(Transaction.crop).distinct().all()
    crop_breakdown = []
    for (crop_name,) in crop_names:
        if not crop_name:
            continue
        c_exp = db.query(func.sum(Transaction.amount)).filter(
            Transaction.crop == crop_name, Transaction.type == "Expense"
        ).scalar() or 0.0
        c_inc = db.query(func.sum(Transaction.amount)).filter(
            Transaction.crop == crop_name, Transaction.type == "Income"
        ).scalar() or 0.0

        crop_breakdown.append(CropSummary(
            crop=crop_name,
            total_expense=round(c_exp, 2),
            total_income=round(c_inc, 2),
            net_profit=round(c_inc - c_exp, 2)
        ))

    return AnalyticsSummaryResponse(
        total_notebooks=total_notebooks,
        total_transactions=total_transactions,
        verified_transactions=verified_tx,
        unverified_transactions=unverified_tx,
        total_expenses=round(total_expenses, 2),
        total_income=round(total_income, 2),
        net_profit_loss=round(net_pnl, 2),
        category_breakdown=category_breakdown,
        crop_breakdown=crop_breakdown
    )
