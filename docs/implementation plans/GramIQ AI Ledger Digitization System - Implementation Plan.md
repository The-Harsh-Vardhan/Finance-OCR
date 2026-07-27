# GramIQ AI Ledger Digitization System - Implementation Plan

Building the production-ready backend API service and interactive Streamlit demo application for the GramIQ AI Ledger Digitization System based on the Technical Design Document (`GramIQ_AI_Ledger_Digitization_TDD.md`) and Deep Research spec.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions for Approval:**
> 1. **Framework & Stack**: FastAPI (Async Python REST API), SQLAlchemy with SQLite database (zero configuration for immediate local testing, seamlessly upgradable to PostgreSQL for production), OpenCV for image preprocessing, and Streamlit for the demo UI.
> 2. **AI Pipeline Strategy**: Hybrid OCR & AI Vision LLM architecture:
>    - **Primary AI Vision LLM (Gemini 2.5 / 1.5 Pro & Flash)**: Direct multimodal vision parsing for multilingual handwritten farm notebooks (Hindi, Marathi, English).
>    - **Fallback Engine**: Local OpenCV image enhancement + EasyOCR/PyTesseract + Regex/Heuristic NLP parser when running offline or without an API key.
> 3. **Streamlit Interactive UI**: Provides a full end-to-end demo containing:
>    - Notebook Image Capture & Quality Gate Check
>    - 8-stage Digitization Execution & Image Preprocessing visualization (deskew, denoising, adaptive threshold)
>    - Side-by-side Farmer Review & Edit Interface with composite confidence badges
>    - Farm Financial Ledger Analytics (Crop P&L, expense categories, total cultivation cost)
>    - Farm Knowledge Base lookup tool

---

## Open Questions

> [!NOTE]
> 1. **Gemini API Key Setup**: Do you have a `GEMINI_API_KEY` environment variable set or preferred API key to test the vision LLM extraction, or should we also include sample pre-extracted mock responses for seamless offline testing? *(We will implement both live API calls and offline mock fallback).*
> 2. **Mobile App Integration**: Are there specific additional JSON response keys or CORS configurations required for your existing app (Flutter / Native)?

---

## Proposed Changes

### Backend Core & Schemas

#### [NEW] [config.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/core/config.py)
- System settings, API keys (`GEMINI_API_KEY`), database URLs, file upload directories, confidence score thresholds.

#### [NEW] [database.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/core/database.py)
- SQLAlchemy database engine setup, declarative Base, session dependency generator.

#### [NEW] [notebook.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/models/notebook.py)
- SQLAlchemy `Notebook` model storing `id`, `farmer_id`, `image_path`, `upload_time`, `status` (Uploaded, Processing, Review, Complete, Failed), `quality_score`.

#### [NEW] [transaction.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/models/transaction.py)
- SQLAlchemy `Transaction` model storing `id`, `notebook_id`, `transaction_date`, `description`, `category` (Fertilizer, Pesticide, Labour, Machinery, Sales, Irrigation, Seeds), `subcategory`, `crop`, `amount`, `confidence`, `verified`, `bounding_box`.

#### [NEW] [knowledge.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/models/knowledge.py)
- `KnowledgeItem` model storing regional terms (Hindi/Marathi/English aliases, standard category, default price range).

#### [NEW] [schemas](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/schemas/notebook.py)
- Pydantic models for request/response validation (`NotebookCreate`, `NotebookResponse`, `TransactionCreate`, `TransactionUpdate`, `TransactionResponse`, `AnalyticsSummary`).

---

### AI Pipeline & Processing Services

#### [NEW] [image_processor.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/image_processor.py)
- OpenCV image preprocessing pipeline: Blur assessment (Laplacian variance), deskewing (minAreaRect/Hough), non-local means denoising, shadow removal with morphological ops, adaptive thresholding. Generates both quality gate results and enhanced image artifacts.

#### [NEW] [farm_knowledge_base.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/farm_knowledge_base.py)
- Indic agricultural domain knowledge engine: Maps regional names (मजुरी, DAP, यूरिया, निंदणी, बियाणे, ट्रॅक्टर) to standard categories, validates price bounds, resolves crops (Cotton, Soybean, Sugarcane, Wheat).

#### [NEW] [llm_parser.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/llm_parser.py)
- Multimodal Vision LLM & OCR parsing service using Google Gemini 2.5 / 1.5 Pro/Flash Vision API with structured JSON output schema enforcement. Includes fallback local heuristic OCR parser.

#### [NEW] [validation_engine.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/validation_engine.py)
- Rule-based validation layer: Date normalization, running total arithmetic verification, amount sanity checks against Knowledge Base, composite confidence calculation (High/Medium/Low).

#### [NEW] [pipeline_orchestrator.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/pipeline_orchestrator.py)
- End-to-end pipeline execution runner coordinating Quality Gate -> Image Enhancement -> Vision/OCR Parsing -> Farm KB Resolution -> Validation Engine -> DB persistence.

---

### REST API Endpoints

#### [NEW] [notebooks.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/api/v1/endpoints/notebooks.py)
- `POST /api/v1/notebooks/upload`
- `POST /api/v1/notebooks/process`
- `GET /api/v1/notebooks/{id}/transactions`
- `GET /api/v1/notebooks`
- `GET /api/v1/notebooks/{id}`

#### [NEW] [transactions.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/api/v1/endpoints/transactions.py)
- `POST /api/v1/transactions/verify` (accepts verified/edited transactions)
- `PUT /api/v1/transactions/{id}`
- `DELETE /api/v1/transactions/{id}`

#### [NEW] [analytics.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/api/v1/endpoints/analytics.py)
- `GET /api/v1/analytics/summary` (crop-wise expenses, category totals, net income/expenses)

#### [NEW] [knowledge_base.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/api/v1/endpoints/knowledge_base.py)
- `GET /api/v1/knowledge-base/search`

#### [NEW] [main.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/main.py)
- FastAPI application entry point, CORS middleware, static image file serving, database table initialization.

---

### Frontend Streamlit Application & Demo Assets

#### [NEW] [app.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/app.py)
- Modern Streamlit multi-page UI:
  - **Scan & Upload Bahi-Khata Page**: Interactive file uploader, sample image selector, image quality score card, 8-stage progress tracker, enhanced image comparison viewer.
  - **Review & Verification Screen**: Interactive grid editing of extracted transactions, confidence score pill badges (High/Medium/Low), side-by-side original image crop view, bulk verify button.
  - **Farm Finance Analytics Dashboard**: Executive KPIs (Total Income, Total Expense, Net Profit), Crop-wise profitability bar chart, expense breakdown pie chart, downloadable CSV/JSON ledger export.
  - **Farm Knowledge Base Explorer**: Interactive query tool for regional terms & categories.

#### [NEW] [sample_images/](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/sample_images/)
- 3 realistic synthetic handwritten Bahi-Khata ledger images representing:
  1. Mixed Hindi/English Cotton farm ledger (`bahi_khata_cotton_hindi.png`)
  2. Marathi Soybean expense & sales ledger (`bahi_khata_soybean_marathi.png`)
  3. Structured Sugarcane farm notebook page (`bahi_khata_sugarcane_english.png`)

---

## Verification Plan

### Automated Tests
- `pytest` suite for backend API endpoints and service modules:
  - Image quality check unit test
  - OpenCV enhancement test
  - Knowledge Base resolution test
  - Validation rules & confidence score unit test
  - End-to-end FastAPI endpoint integration test (`upload` -> `process` -> `transactions` -> `verify`)

### Manual Verification
- Start FastAPI server on `http://127.0.0.1:8000` and verify OpenAPI docs (`/docs`).
- Start Streamlit app on `http://127.0.0.1:8501`.
- Test uploading and processing all 3 sample Bahi-Khata notebook images.
- Verify side-by-side review UI and test editing transaction amounts, dates, and categories.
- Click "Verify & Save", verify database updates and analytics dashboard recalculations.
