import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

# Import all models to register with Base
from app.models.notebook import Notebook
from app.models.transaction import Transaction

# Create DB tables safely
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"⚠️ Database initialization warning: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="GramIQ AI Ledger Digitization REST API for Handwritten Indian Farm Notebooks (Bahi-Khata)."
)

# CORS configuration for Mobile App & Web Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded and enhanced images as static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

@app.get("/")
def root(db: Session = Depends(get_db)):
    db_status = "Connected"
    db_type = "PostgreSQL (Supabase)" if "postgresql" in settings.DATABASE_URL else "SQLite"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"Disconnected: {str(e)}"

    return {
        "system": settings.PROJECT_NAME,
        "status": "Online",
        "database": {
            "status": db_status,
            "type": db_type,
            "connected": "Connected" in db_status
        },
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
