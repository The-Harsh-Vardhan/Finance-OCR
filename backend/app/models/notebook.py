import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, Enum as SQLEnum
import enum
from app.core.database import Base

class NotebookStatus(str, enum.Enum):
    UPLOADED = "Uploaded"
    PROCESSING = "Processing"
    REVIEW = "Review"
    COMPLETE = "Complete"
    FAILED = "Failed"

class Notebook(Base):
    __tablename__ = "notebooks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farmer_id = Column(String, nullable=False, default="FARMER_DEFAULT")
    original_filename = Column(String, nullable=False)
    image_path = Column(String, nullable=False) # Original uploaded image path
    enhanced_image_path = Column(String, nullable=True) # OpenCV enhanced image path
    upload_time = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(NotebookStatus), default=NotebookStatus.UPLOADED)
    quality_score = Column(Float, nullable=True)
    error_message = Column(String, nullable=True)

    # Intermediate Pipeline Data Storage (JSON strings)
    quality_metrics = Column(Text, nullable=True) # Stage 2: OpenCV Quality metrics
    intermediate_ocr_data = Column(Text, nullable=True) # Step 1: Raw OCR text transcripts
    intermediate_translation_data = Column(Text, nullable=True) # Step 2: Translations before and after
    final_output_data = Column(Text, nullable=True) # Step 3 & Final structured output
