import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.api.v1.router import api_router

# Import all models to register with Base
from app.models.notebook import Notebook
from app.models.transaction import Transaction

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="GramIQ AI Ledger Digitization REST API for Handwritten Indian Farm Notebooks (Bahi-Khata)."
)

@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified successfully.")
    except Exception as e:
        print(f"⚠️ Database initialization warning (continuing startup): {e}")

# CORS configuration for Mobile App & Web Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded and enhanced images as static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Global exception handler to prevent CORS blockage on 500 errors
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error": type(exc).__name__},
        headers={"Access-Control-Allow-Origin": "*"}
    )

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root(db: Session = Depends(get_db)):
    db_status = "Connected"
    db_type = "PostgreSQL (Supabase)" if "postgresql" in settings.DATABASE_URL else "SQLite"
    is_connected = False
    try:
        db.execute(text("SELECT 1"))
        is_connected = True
    except Exception as e:
        db_status = f"Disconnected: {str(e)}"
        is_connected = False

    return {
        "system": settings.PROJECT_NAME,
        "status": "Online",
        "database": {
            "status": db_status,
            "type": db_type,
            "connected": is_connected
        },
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
