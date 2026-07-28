import os
import uuid
import shutil
import json
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.notebook import Notebook, NotebookStatus
from app.models.transaction import Transaction
from app.schemas.notebook import NotebookResponse, ProcessNotebookRequest, IntermediateDataResponse
from app.schemas.transaction import TransactionResponse
from app.services.pipeline_orchestrator import PipelineOrchestrator

router = APIRouter()


def _validate_upload_file(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename")

    allowed_exts = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format '{ext}'. Allowed: {allowed_exts}"
        )

    file.file.seek(0, os.SEEK_END)
    file_size_bytes = file.file.tell()
    file.file.seek(0)
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size_bytes > max_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds max size of {settings.MAX_UPLOAD_SIZE_MB} MB"
        )

    return ext

@router.post("/upload", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
def upload_notebook(
    farmer_id: str = Form("FARMER_DEFAULT"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts multipart/form-data image upload. Saves file and creates a Notebook record.
    """
    ext = _validate_upload_file(file)

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

@router.post("/process/{notebook_id}", status_code=status.HTTP_202_ACCEPTED)
def process_notebook(
    notebook_id: str,
    background_tasks: BackgroundTasks,
    payload: Optional[ProcessNotebookRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Triggers the 8-stage AI digitization pipeline for a notebook.
    Returns 202 immediately; the pipeline runs as a background task.
    The frontend polls GET /notebooks/{id} for status updates.
    """
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    has_verified_transactions = db.query(Transaction).filter(
        Transaction.notebook_id == notebook_id,
        Transaction.verified == True
    ).first()
    if has_verified_transactions:
        raise HTTPException(
            status_code=409,
            detail="Notebook already contains verified transactions and cannot be reprocessed safely"
        )

    crop_hint = payload.crop_hint if payload else None
    background_tasks.add_task(PipelineOrchestrator.process_notebook, db, notebook_id, crop_hint)
    return {"notebook_id": notebook_id, "status": "Processing", "message": "Pipeline started in background"}

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

@router.get("/{notebook_id}/intermediate-data", response_model=IntermediateDataResponse)
def get_intermediate_pipeline_data(notebook_id: str, db: Session = Depends(get_db)):
    """
    Returns all intermediate pipeline data:
    - Raw uploaded image & OpenCV enhanced image path
    - OpenCV Quality metrics
    - Step 1: Verbatim Raw OCR Text
    - Step 2: Translation before (original Indic) and after (English)
    - Step 3: Final structured output
    """
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    q_metrics = json.loads(notebook.quality_metrics) if notebook.quality_metrics else {}
    ocr_data = json.loads(notebook.intermediate_ocr_data) if notebook.intermediate_ocr_data else []
    trans_data = json.loads(notebook.intermediate_translation_data) if notebook.intermediate_translation_data else []
    final_data = json.loads(notebook.final_output_data) if notebook.final_output_data else []

    return IntermediateDataResponse(
        notebook_id=notebook.id,
        status=notebook.status.value,
        original_image_path=notebook.image_path,
        enhanced_image_path=notebook.enhanced_image_path,
        quality_metrics=q_metrics,
        step1_raw_ocr=ocr_data,
        step2_translations=trans_data,
        step3_final_output=final_data
    )

@router.put("/{notebook_id}/intermediate-data")
def update_intermediate_pipeline_data(
    notebook_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Updates and tracks intermediate OCR stage data (raw text, translations, corrected entities)
    directly in the database for human-in-the-loop corrections.
    """
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    if "raw_text" in payload or "step1_raw_ocr" in payload:
        raw_ocr = payload.get("step1_raw_ocr") or [{"ocr_text": payload.get("raw_text")}]
        notebook.intermediate_ocr_data = json.dumps(raw_ocr, ensure_ascii=False)

    if "step2_translations" in payload:
        notebook.intermediate_translation_data = json.dumps(payload["step2_translations"], ensure_ascii=False)

    if "quality_metrics" in payload:
        notebook.quality_metrics = json.dumps(payload["quality_metrics"], ensure_ascii=False)

    db.commit()
    db.refresh(notebook)

    return {
        "message": "Intermediate pipeline stage data updated and tracked successfully",
        "notebook_id": notebook.id
    }

@router.delete("/{notebook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notebook(
    notebook_id: str,
    db: Session = Depends(get_db)
):
    """
    Deletes a notebook record and all associated transaction records.
    """
    notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    db.query(Transaction).filter(Transaction.notebook_id == notebook_id).delete()
    db.delete(notebook)
    db.commit()
    return None
