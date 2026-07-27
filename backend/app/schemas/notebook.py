from pydantic import BaseModel, ConfigDict
from typing import Optional, List
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

    model_config = ConfigDict(from_attributes=True)

class ProcessNotebookRequest(BaseModel):
    crop_hint: Optional[str] = None
    force_reprocess: bool = False
