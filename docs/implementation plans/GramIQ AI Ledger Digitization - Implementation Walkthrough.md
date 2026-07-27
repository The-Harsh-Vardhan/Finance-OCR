# GramIQ AI Ledger Digitization - Implementation Walkthrough

We have successfully built the end-to-end backend REST API service, AI Document Intelligence processing pipeline, and interactive Streamlit demo application for the **GramIQ AI Ledger Digitization System**.

---

## 🏗️ What Was Built

### 1. FastAPI REST Backend Service (`backend/`)
- **Core Config & DB (`app/core/`)**: FastAPI application configuration with `.env` support, SQLAlchemy database ORM engine (`sqlite:///./finance_ocr.db`), and CORS middleware allowing all origins (`*`) for seamless mobile app and web frontend integration.
- **Data Models (`app/models/`)**:
  - `Notebook`: Stores notebook upload metadata, farmer profile ID, original image path, OpenCV enhanced image path, processing status (`Uploaded`, `Processing`, `Review`, `Complete`, `Failed`), quality scores, and error logs.
  - `Transaction`: Stores extracted financial records including `transaction_date`, `description` (multilingual Hindi/Marathi/English), `category` (Fertilizer, Pesticide, Labour, Machinery, Sales, Seeds, Irrigation), `crop`, `type` (`Expense` vs `Income`), `amount` (INR), `confidence`, `confidence_level` (`High`, `Medium`, `Low`), and `verified` status.
  - `KnowledgeItem`: Database repository for regional Indic agricultural terms and aliases.
- **REST Endpoints (`app/api/v1/endpoints/`)**:
  - `POST /api/v1/notebooks/upload`: Multipart image upload.
  - `POST /api/v1/notebooks/process/{id}`: Triggers the 8-stage AI digitization pipeline.
  - `GET /api/v1/notebooks/{id}/transactions`: Retrieves extracted ledger records.
  - `POST /api/v1/transactions/verify`: Bulk verifies and updates farmer-edited transactions.
  - `GET /api/v1/analytics/summary`: Computes farm P&L metrics, category expense distribution, and crop-wise profitability.
  - `GET /api/v1/knowledge-base/search`: Indic agri term lookup.

### 2. Multi-Stage AI Digitization Pipeline (`app/services/`)
- **Stage 1 & 2 (Image Quality & OpenCV Enhancement)**: `ImageProcessor` calculates Laplacian variance blur scores, corrects rotation/skew (`minAreaRect`), removes shadows using morphological top-hat transforms, and performs adaptive contrast thresholding.
- **Stage 3 - 6 (AI Vision Parsing & Multilingual OCR)**: `LLMParserService` invokes Google Gemini 2.5 / 1.5 Vision API with structured JSON output enforcement, backed by an offline heuristic parser when running without an API key.
- **Stage 7 (Farm Knowledge Base & Domain Enrichment)**: `FarmKnowledgeBase` maps Indic terms (मजुरी, निंदणी, बियाणे, DAP, यूरिया, नांगरटी) to standard categories, infers expense vs income, and checks price bounds.
- **Stage 8 (Validation & Composite Confidence Scoring)**: `ValidationEngine` normalizes date formats, checks price bounds, computes composite confidence scores, auto-approves High confidence entries (>= 0.80), and flags Low/Medium entries for human review.

### 3. Interactive Streamlit Frontend UI (`frontend/`)
- **Tab 1: 📸 Scan & Digitise Bahi-Khata**: Upload custom notebook photos or choose from 3 built-in sample ledgers (Hindi Cotton, Marathi Soybean, English Sugarcane). Visualizes OpenCV image enhancement and 8-stage progress.
- **Tab 2: ✍️ Farmer Review & Verification**: Side-by-side view of notebook image vs interactive editable grid with confidence score pill badges (High/Medium/Low) and "Confirm Verification" action.
- **Tab 3: 📊 Farm Ledger Analytics**: Executive financial cards (Total Income, Total Expenses, Net Profit/Loss), Category cost distribution donut chart, and Crop-wise profitability bar chart.
- **Tab 4: 🌾 Farm Knowledge Base Explorer**: Search regional Hindi/Marathi terms and category bounds.

---

## 🧪 Verification & Test Results

### 1. Automated Test Suite
Ran `python -m pytest tests` from `backend/`:
- `test_image_blur_calculation`: PASSED
- `test_farm_knowledge_base_resolution`: PASSED
- `test_validation_engine_scoring`: PASSED
- `test_root_endpoint`: PASSED
- `test_analytics_summary_endpoint`: PASSED
- `test_knowledge_base_search_endpoint`: PASSED

Result: **6 out of 6 tests PASSED cleanly.**

### 2. Sample Ledger Generation
Generated 3 authentic synthetic handwritten Bahi-Khata notebook images:
- `frontend/sample_images/bahi_khata_cotton_hindi.png`
- `frontend/sample_images/bahi_khata_soybean_marathi.png`
- `frontend/sample_images/bahi_khata_sugarcane_english.png`

---

## 🚀 How to Run the Backend and Frontend

### Step 1: Start the FastAPI Backend Server
Open a terminal in the project backend folder:
```bash
cd "c:\D Drive\Projects\Summers 2026\GramIQ Internship\Finance OCR\backend"
python -m uvicorn main:app --reload --port 8000
```
- Open Interactive API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Step 2: Start the Streamlit Demo Application
Open a second terminal in the project frontend folder:
```bash
cd "c:\D Drive\Projects\Summers 2026\GramIQ Internship\Finance OCR\frontend"
python -m streamlit run app.py
```
- Open Demo UI: [http://localhost:8501](http://localhost:8501)
