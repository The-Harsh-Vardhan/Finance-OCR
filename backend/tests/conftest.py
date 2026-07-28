import os
import shutil
import sys
from pathlib import Path


TESTS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = TESTS_DIR.parent
TMP_DIR = TESTS_DIR / "tmp"
UPLOAD_DIR = TMP_DIR / "uploads"
DB_PATH = TMP_DIR / "test_finance_ocr.db"

TMP_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(exist_ok=True)

os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH.as_posix()}"
os.environ["UPLOAD_DIR"] = str(UPLOAD_DIR)
os.environ["GEMINI_API_KEY"] = ""
os.environ["TESSDATA_DIR"] = str(BACKEND_DIR / "tessdata")

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def pytest_sessionstart(session):
    if DB_PATH.exists():
        DB_PATH.unlink()
    if UPLOAD_DIR.exists():
        shutil.rmtree(UPLOAD_DIR)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
