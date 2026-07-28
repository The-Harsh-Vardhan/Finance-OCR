FROM python:3.11-slim

# Install system dependencies for OpenCV & Tesseract Indic OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-hin \
    tesseract-ocr-mar \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set Environment Variables for Linux Tesseract
ENV TESSERACT_CMD="/usr/bin/tesseract"
ENV TESSDATA_DIR="/usr/share/tesseract-ocr/4.00/tessdata"
ENV PORT=8000

# Copy application source code
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
