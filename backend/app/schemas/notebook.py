from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime

class NotebookBase(BaseModel):
    farmer_id: str = "FARMER_DEFAULT"

class NotebookCreate(NotebookBase):
    pass

class NotebookResponse(NotebookBase):
    id: str
    original_filename: str
    image_path: str
    enhanced_image_path: Optional[str] = None
    upload_time: datetime
    status: str
    quality_score: Optional[float] = None
    error_message: Optional[str] = None
    quality_metrics: Optional[str] = None
    intermediate_ocr_data: Optional[str] = None
    intermediate_translation_data: Optional[str] = None
    final_output_data: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ProcessNotebookRequest(BaseModel):
    crop_hint: Optional[str] = None
    force_reprocess: bool = False

class IntermediateDataResponse(BaseModel):
    notebook_id: str
    status: str
    original_image_path: str
    enhanced_image_path: Optional[str] = None
    quality_metrics: Optional[Dict[str, Any]] = None
    step1_raw_ocr: List[Dict[str, Any]] = []
    step2_translations: List[Dict[str, Any]] = []
    step3_final_output: List[Dict[str, Any]] = []
