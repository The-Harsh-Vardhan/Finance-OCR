import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.notebook import Notebook, NotebookStatus
from app.models.transaction import Transaction
from app.schemas.notebook import NotebookResponse, ProcessNotebookRequest
from app.schemas.transaction import TransactionResponse
from app.services.pipeline_orchestrator import PipelineOrchestrator

router = APIRouter()

@router.post("/upload", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
def upload_notebook(
    farmer_id: str = Form("FARMER_DEFAULT"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts multipart/form-data image upload. Saves file and creates a Notebook record.
    """
    allowed_exts = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format '{ext}'. Allowed: {allowed_exts}"
        )

    notebook_id = str(uuid.uuid4())
    filename = f"{notebook_id}{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    notebook = Notebook(
        id=notebook_id,
        farmer_id=farmer_id,
        original_filename=file.filename,
        image_path=save_path,
        status=NotebookStatus.UPLOADED
    )
    db.add(notebook)
    db.commit()
    db.refresh(notebook)

    return notebook

@router.post("/process/{notebook_id}")
def process_notebook(
    notebook_id: str,
    payload: Optional[ProcessNotebookRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Triggers the 8-stage AI digitization pipeline for a notebook.
    """
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    crop_hint = payload.crop_hint if payload else None
    result = PipelineOrchestrator.process_notebook(db, notebook_id, crop_hint=crop_hint)
    return result

@router.get("", response_model=List[NotebookResponse])
def list_notebooks(db: Session = Depends(get_db)):
    """Lists all uploaded notebooks."""
    return db.query(Notebook).order_by(Notebook.upload_time.desc()).all()

@router.get("/{notebook_id}", response_model=NotebookResponse)
def get_notebook(notebook_id: str, db: Session = Depends(get_db)):
    """Gets details for a single notebook."""
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return notebook

@router.get("/{notebook_id}/transactions", response_model=List[TransactionResponse])
def get_notebook_transactions(notebook_id: str, db: Session = Depends(get_db)):
    """Gets extracted transactions for a given notebook."""
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    return db.query(Transaction).filter(Transaction.notebook_id == notebook_id).order_by(Transaction.created_at.asc()).all()
