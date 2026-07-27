from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notebook import Notebook, NotebookStatus
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionResponse, TransactionUpdate, BatchVerifyRequest

router = APIRouter()

@router.post("/verify")
def batch_verify_transactions(
    payload: BatchVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts farmer edits/reviews and marks transactions as verified=True.
    Updates Notebook status to Complete.
    """
    notebook = db.query(Notebook).filter(Notebook.id == payload.notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    updated_count = 0
    for tx_data in payload.transactions:
        tx = db.query(Transaction).filter(Transaction.id == tx_data.id).first()
        if tx:
            tx.transaction_date = tx_data.transaction_date
            tx.description = tx_data.description
            tx.category = tx_data.category
            tx.subcategory = tx_data.subcategory
            tx.crop = tx_data.crop
            tx.type = tx_data.type
            tx.amount = tx_data.amount
            tx.unit = tx_data.unit
            tx.verified = True
            updated_count += 1

    notebook.status = NotebookStatus.COMPLETE
    db.commit()

    return {
        "message": f"Successfully verified {updated_count} transactions",
        "notebook_id": payload.notebook_id,
        "status": notebook.status.value
    }

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    db: Session = Depends(get_db)
):
    """Updates a single transaction record."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, val in payload.dict(exclude_unset=True).items():
        setattr(tx, key, val)

    db.commit()
    db.refresh(tx)
    return tx

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """Deletes a transaction record."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return None
