import os
import shutil
import sys
import time
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


def _reset_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    for child in UPLOAD_DIR.iterdir():
        for attempt in range(3):
            try:
                if child.is_dir():
                    shutil.rmtree(child)
                else:
                    child.unlink()
                break
            except PermissionError:
                if attempt == 2:
                    raise
                time.sleep(0.2)


def pytest_sessionstart(session):
    if DB_PATH.exists():
        DB_PATH.unlink()
    _reset_upload_dir()
