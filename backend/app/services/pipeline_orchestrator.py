import os
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.notebook import Notebook, NotebookStatus
from app.models.transaction import Transaction
from app.services.image_processor import ImageProcessor
from app.services.llm_parser import LLMParserService
from app.services.validation_engine import ValidationEngine

class PipelineOrchestrator:
    """
    Orchestrates the AI Document Intelligence pipeline and stores all intermediate stage data.
    """

    @classmethod
    def process_notebook(cls, db: Session, notebook_id: str, crop_hint: str = None) -> Dict[str, Any]:
        notebook = db.query(Notebook).filter(Notebook.id == notebook_id).first()
        if not notebook:
            raise ValueError(f"Notebook with ID {notebook_id} not found")

        notebook.status = NotebookStatus.PROCESSING
        db.commit()

        try:
            # Stage 1 & 2: Image Quality Gate & OpenCV Enhancement
            enhanced_filename = f"enhanced_{os.path.basename(notebook.image_path)}"
            enhanced_path = os.path.join(os.path.dirname(notebook.image_path), enhanced_filename)

            quality_res = ImageProcessor.enhance_image(notebook.image_path, enhanced_path)
            notebook.quality_score = quality_res["blur_score"]
            notebook.enhanced_image_path = enhanced_path
            notebook.quality_metrics = json.dumps(quality_res)

            # Stage 3: Sequential 3-Step AI Vision Parsing (OCR -> Translate -> Categorize)
            raw_transactions = LLMParserService.parse_notebook_image(enhanced_path, crop_hint)

            # Clear any existing unverified transactions for safe re-processing
            db.query(Transaction).filter(
                Transaction.notebook_id == notebook_id,
                Transaction.verified == False
            ).delete()

            extracted_records = []
            intermediate_ocr_list = []
            intermediate_translation_list = []
            low_conf_count = 0

            # Stage 4: Validation Engine & Data Enrichment
            for raw_tx in raw_transactions:
                enriched_tx = ValidationEngine.validate_and_enrich(raw_tx, crop_hint)

                # Record Intermediate Stage 1 (Raw OCR)
                intermediate_ocr_list.append({
                    "ocr_text": enriched_tx["ocr_text"],
                    "raw_date": enriched_tx["raw_date"],
                    "raw_amount": enriched_tx["amount"]
                })

                # Record Intermediate Stage 2 (Translation Before & After)
                intermediate_translation_list.append({
                    "before_translation_indic": enriched_tx["ocr_text"],
                    "after_translation_english": enriched_tx["description_en"],
                    "canonical_description": enriched_tx["description"]
                })

                tx_record = Transaction(
                    notebook_id=notebook_id,
                    transaction_date=enriched_tx["transaction_date"],
                    raw_date=enriched_tx["raw_date"],
                    ocr_text=enriched_tx["ocr_text"],
                    description_en=enriched_tx["description_en"],
                    description=enriched_tx["description"],
                    category=enriched_tx["category"],
                    subcategory=enriched_tx["subcategory"],
                    crop=enriched_tx["crop"],
                    type=enriched_tx["type"],
                    amount=enriched_tx["amount"],
                    unit=enriched_tx["unit"],
                    confidence=enriched_tx["confidence"],
                    confidence_level=enriched_tx["confidence_level"],
                    verified=enriched_tx["verified"]
                )
                if not enriched_tx["verified"]:
                    low_conf_count += 1
                db.add(tx_record)
                extracted_records.append(enriched_tx)

            # Save All Intermediate Stage Data to Notebook DB Record
            notebook.intermediate_ocr_data = json.dumps(intermediate_ocr_list, ensure_ascii=False)
            notebook.intermediate_translation_data = json.dumps(intermediate_translation_list, ensure_ascii=False)
            notebook.final_output_data = json.dumps(extracted_records, ensure_ascii=False)

            # Update Notebook Status
            if low_conf_count > 0:
                notebook.status = NotebookStatus.REVIEW
            else:
                notebook.status = NotebookStatus.COMPLETE

            db.commit()
            db.refresh(notebook)

            return {
                "notebook_id": notebook.id,
                "status": notebook.status.value,
                "quality_score": notebook.quality_score,
                "quality_metrics": quality_res,
                "total_extracted": len(extracted_records),
                "review_required": low_conf_count > 0,
                "intermediate_data": {
                    "step1_raw_ocr": intermediate_ocr_list,
                    "step2_translations": intermediate_translation_list,
                    "step3_final_output": extracted_records
                },
                "transactions": extracted_records
            }

        except Exception as e:
            db.rollback()
            notebook.status = NotebookStatus.FAILED
            notebook.error_message = str(e)
            db.commit()
            raise e
