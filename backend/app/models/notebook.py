import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum
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
    image_path = Column(String, nullable=False)
    enhanced_image_path = Column(String, nullable=True)
    upload_time = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(NotebookStatus), default=NotebookStatus.UPLOADED)
    quality_score = Column(Float, nullable=True)
    error_message = Column(String, nullable=True)
