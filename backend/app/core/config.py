import os
from dotenv import load_dotenv

# Load .env file explicitly
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=env_path)


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "GramIQ AI Ledger Digitization")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finance_ocr.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", 15))
    CONFIDENCE_AUTO_APPROVE_THRESHOLD: float = float(os.getenv("CONFIDENCE_AUTO_APPROVE_THRESHOLD", 0.80))
    GEMINI_MODELS: list[str] = _split_csv(
        os.getenv("GEMINI_MODELS", "gemini-flash-latest,gemini-flash-lite-latest,gemini-2.0-flash,gemini-2.0-flash-lite,gemini-2.5-pro")
    )
    SAMPLE_IMAGE_DIR: str = os.getenv(
        "SAMPLE_IMAGE_DIR",
        r"C:\Users\harsh\OneDrive - Indian Institute of Information Technology, Nagpur\IIIT Nagpur\Summers 2026\GramIQ Internship\Task 13 - Image to Farm Finance Feature\Old Accounting Method",
    )
    TESSERACT_CMD: str = os.getenv(
        "TESSERACT_CMD",
        r"C:\Program Files\PDF24\tesseract\tesseract.exe",
    )
    TESSDATA_DIR: str = os.getenv("TESSDATA_DIR", os.path.join(BASE_DIR, "tessdata"))

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
