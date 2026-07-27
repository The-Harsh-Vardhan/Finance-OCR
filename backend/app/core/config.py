import os
from dotenv import load_dotenv

# Load .env file explicitly
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "GramIQ AI Ledger Digitization")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finance_ocr.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", 15))
    CONFIDENCE_AUTO_APPROVE_THRESHOLD: float = float(os.getenv("CONFIDENCE_AUTO_APPROVE_THRESHOLD", 0.80))

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
