import os
from dotenv import load_dotenv

# Load .env file explicitly
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(dotenv_path=env_path)


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_cors_origins(value: str) -> list[str]:
    origins = _split_csv(value)
    if origins:
        return origins
    return ["*"]

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "GramIQ AI Ledger Digitization")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    
    # Supabase PostgreSQL & Connection URL
    raw_db_url: str = (os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL", "sqlite:///./finance_ocr.db")).strip()
    if raw_db_url.startswith("http://") or raw_db_url.startswith("https://"):
        # Guard against HTTP/HTTPS Web URLs passed by mistake into DATABASE_URL
        raw_db_url = "sqlite:///./finance_ocr.db"
    elif raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

    DATABASE_URL: str = raw_db_url
    
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "uploads"))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", 15))
    CONFIDENCE_AUTO_APPROVE_THRESHOLD: float = float(os.getenv("CONFIDENCE_AUTO_APPROVE_THRESHOLD", 0.80))
    GEMINI_MODELS: list[str] = _split_csv(
        os.getenv("GEMINI_MODELS", "gemini-flash-latest,gemini-1.5-flash-latest,gemini-2.0-flash,gemini-2.5-flash,gemini-2.5-pro")
    )
    TESSERACT_CMD: str = os.getenv(
        "TESSERACT_CMD",
        r"C:\Program Files\PDF24\tesseract\tesseract.exe" if os.name == "nt" else "/usr/bin/tesseract"
    )
    TESSDATA_DIR: str = os.getenv(
        "TESSDATA_DIR",
        os.path.join(BASE_DIR, "tessdata") if os.name == "nt" else "/usr/share/tesseract-ocr/4.00/tessdata"
    )
    CORS_ORIGINS: list[str] = _parse_cors_origins(os.getenv("CORS_ORIGINS", ""))

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
