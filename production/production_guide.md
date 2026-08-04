# 📘 GramIQ Agricultural AI: Finance OCR Production Integration Guide

**Document Version:** `v2.0.0` (GramIQ Bahi-Khata Farm Ledger AI Engine)  
**Target Location:** `production/production_guide.md`  
**Target Audience:** Backend Engineers, Mobile Developers (Android Kotlin / WebViews), AI/ML Engineers, Database Administrators, and WhatsApp Bot Integration Teams  

---

## 📑 Table of Contents

1. [System Architecture & Data Flow](#1-system-architecture--data-flow)
   - [1.1 Production API Endpoints Matrix](#11-production-api-endpoints-matrix)
   - [1.2 Sequential 3-Step AI Vision Pipeline Architecture](#12-sequential-3-step-ai-vision-pipeline-architecture)
2. [PostgreSQL Database Schema & Migration](#2-postgresql-database-schema--migration)
3. [Environment Configuration & Secrets (`.env`)](#3-environment-configuration--secrets-env)
4. [Backend Implementation & API Contracts](#4-backend-implementation--api-contracts)
   - [4.1 Notebook Upload (`POST /api/v1/notebooks/upload`)](#41-notebook-upload-post-apiv1notebooksupload)
   - [4.2 3-Step Pipeline Trigger (`POST /api/v1/notebooks/process/{id}`)](#42-3-step-pipeline-trigger-post-apiv1notebooksprocessid)
   - [4.3 Human-in-the-Loop Batch Verification (`POST /api/v1/transactions/verify`)](#43-human-in-the-loop-batch-verification-post-apiv1transactionsverify)
   - [4.4 Farm Finance Analytics Summary (`GET /api/v1/analytics/summary`)](#44-farm-finance-analytics-summary-get-apiv1analyticssummary)
   - [4.5 Indic Agricultural Knowledge Base (`GET /api/v1/knowledge-base/search`)](#45-indic-agricultural-knowledge-base-get-apiv1knowledge-basesearch)
5. [Android Mobile App Integration (Kotlin & JavaScript SDK)](#5-android-mobile-app-integration-kotlin--javascript-sdk)
   - [5.1 Client-Side Image Compression & Pre-Validation](#51-client-side-image-compression--pre-validation)
   - [5.2 Retrofit 2 API Interfaces & Data Classes](#52-retrofit-2-api-interfaces--data-classes)
   - [5.3 JavaScript / TypeScript WebViews SDK Client](#53-javascript--typescript-webviews-sdk-client)
6. [WhatsApp Bot Integration (Meta Cloud API & Twilio)](#6-whatsapp-bot-integration-meta-cloud-api--twilio)
   - [6.1 Media & Webhook Handler](#61-media--webhook-handler)
   - [6.2 Itemized Receipt & P&L Message Formatter](#62-itemized-receipt--pl-message-formatter)
7. [Comprehensive Edge Cases & Production Guardrails](#7-comprehensive-edge-cases--production-guardrails)
8. [Verification & Testing Playbook (Postman & cURL)](#8-verification--testing-playbook-postman--curl)
9. [Comprehensive Troubleshooting Matrix](#9-comprehensive-troubleshooting-matrix)
10. [Deployment & Containerization Command Reference](#10-deployment--containerization-command-reference)
11. [Performance Benchmarks & SLA Limits](#11-performance-benchmarks--sla-limits)

---

## 1. System Architecture & Data Flow

The GramIQ Finance OCR platform digitizes handwritten Indian farm notebooks (Bahi-Khata) containing Indic scripts (Hindi, Marathi, Gujarati, Punjabi, Hinglish) and extracts structured financial transactions into an accounting database.

```text
               ┌────────────────────────┐      ┌────────────────────────┐
               │   Android Mobile App   │      │   WhatsApp Bot User    │
               │  (Retrofit / WebViews) │      │   (Meta / Twilio API)  │
               └───────────┬────────────┘      └───────────┬────────────┘
                           │                               │
                           └───────────────┬───────────────┘
                                           │
                                  [HTTPS / REST API]
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │   FastAPI Backend / API Gateway       │
                       │   (Python Uvicorn / Async Tasks)      │
                       └───────────────────┬───────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         │                                                                   │
         ▼                                                                   ▼
┌─────────────────────────────────────────┐               ┌─────────────────────────────────┐
│ Sequential 3-Step AI Vision Pipeline    │               │ PostgreSQL / Supabase Database  │
│ (OCR -> Translate -> Categorize)        │               │ (Notebooks, Transactions, P&L)  │
└─────────────────────────────────────────┘               └─────────────────────────────────┘
```

---

### 1.1 Production API Endpoints Matrix

| Endpoint Route | HTTP Method | Content-Type | Primary Purpose |
|---|---|---|---|
| `/` | `GET` | `application/json` | System health check & database connectivity test. |
| `/api/v1/notebooks/upload` | `POST` | `multipart/form-data` | Uploads handwritten ledger photo and registers notebook record. |
| `/api/v1/notebooks/process/{id}` | `POST` | `application/json` | Triggers 3-step AI vision OCR digitization pipeline. |
| `/api/v1/notebooks` | `GET` | `application/json` | Lists all digitized notebooks for a farmer. |
| `/api/v1/notebooks/{id}` | `GET` | `application/json` | Gets detailed notebook record and status. |
| `/api/v1/notebooks/{id}/transactions` | `GET` | `application/json` | Fetches extracted line-item transactions for a notebook. |
| `/api/v1/notebooks/{id}/intermediate-data` | `GET/PUT` | `application/json` | Human-in-the-loop view/update of raw OCR text and translations. |
| `/api/v1/transactions/verify` | `POST` | `application/json` | Accepts farmer edits/reviews and marks transactions as verified. |
| `/api/v1/analytics/summary` | `GET` | `application/json` | Computes farm income, expenses, category breakdown, and crop P&L. |
| `/api/v1/knowledge-base/search` | `GET` | `application/json` | Queries Indic agricultural term mappings (e.g. `मजुरी`, `बियाणे`). |

---

### 1.2 Sequential 3-Step AI Vision Pipeline Architecture

The backend executes a **Sequential 3-Step AI Vision Pipeline** with full intermediate stage tracking:

1. **Step 1: Verbatim Raw Indic OCR Extraction (`step1_raw_ocr`):** 
   Multimodal Vision engine extracts raw, verbatim handwritten text directly from the ledger image in its original Indic script (e.g. Marathi, Hindi, Gujarati, Punjabi). Preserves raw dates, line breaks, and informal shorthand notations.
2. **Step 2: Indic-to-English Translation (`step2_translations`):** 
   Translates Indic financial descriptions into English (`description_en`), creating side-by-side before/after records for auditability and verification.
3. **Step 3: Entity Resolution, Categorization & Final Structured Output (`step3_final_output`):** 
   Normalizes informal agricultural terminology to canonical categories (`Fertilizers`, `Labor`, `Seeds`, `Crop Sales`, etc.) using the `FarmKnowledgeBase`, parses numeric amounts and units (`₹`, `quintal`), assigns confidence levels (`High`, `Medium`, `Low`), and persists structured transaction objects to PostgreSQL.

---

## 2. PostgreSQL Database Schema & Migration

All notebooks and transactions are stored in PostgreSQL / Supabase:

```sql
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Notebooks Table
CREATE TABLE IF NOT EXISTS public.notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id TEXT NOT NULL DEFAULT 'FARMER_DEFAULT',
    original_filename TEXT NOT NULL,
    image_path TEXT NOT NULL,
    enhanced_image_path TEXT,
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'Uploaded',
    quality_score DOUBLE PRECISION,
    error_message TEXT,
    quality_metrics JSONB,
    intermediate_ocr_data JSONB,
    intermediate_translation_data JSONB,
    final_output_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
    transaction_date DATE,
    raw_date TEXT,
    ocr_text TEXT,
    description_en TEXT,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    crop TEXT,
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    unit TEXT DEFAULT '₹',
    confidence DOUBLE PRECISION DEFAULT 0.95,
    confidence_level TEXT DEFAULT 'High',
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notebooks_farmer ON public.notebooks(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_notebook ON public.transactions(notebook_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_crop ON public.transactions(crop);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
```

---

## 3. Environment Configuration & Secrets (`.env`)

```env
# Server Configuration
PORT=8000
ENVIRONMENT=production
PROJECT_NAME="GramIQ Finance OCR API"
API_V1_STR="/api/v1"

# Database Connection (Supabase / PostgreSQL)
DATABASE_URL=postgresql://postgres.xxx:your_password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Google Gemini Vision API Key
GEMINI_API_KEY=AIzaSy...YOUR_PRODUCTION_GEMINI_API_KEY

# Upload Limits & File Storage
MAX_UPLOAD_SIZE_MB=15
UPLOAD_DIR="./uploads"

# WhatsApp Bot Integration Credentials
BOT_PORT=3001
WHATSAPP_VERIFY_TOKEN=gramiq_whatsapp_verify_token_2026
WHATSAPP_ACCESS_TOKEN=EAAG...YOUR_PERMANENT_META_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

---

## 4. Backend Implementation & API Contracts

### 4.1 Notebook Upload (`POST /api/v1/notebooks/upload`)

**Request (Multipart Form Data):**
- `farmer_id`: `"FARMER_MH_401"`
- `file`: `[Binary Image Data (JPEG/PNG)]`

**Response (`201 Created`):**
```json
{
  "id": "e4a7b2c9-8d1e-4f3a-9b5c-7d8e9f0a1b2c",
  "farmer_id": "FARMER_MH_401",
  "original_filename": "bahi_khata_page.jpg",
  "image_path": "uploads/e4a7b2c9-8d1e-4f3a-9b5c-7d8e9f0a1b2c.jpg",
  "status": "Uploaded",
  "created_at": "2026-08-04T12:00:00Z"
}
```

---

### 4.2 3-Step Pipeline Trigger (`POST /api/v1/notebooks/process/{id}`)

**Request Body:**
```json
{
  "crop_hint": "Soybean"
}
```

**Response (`202 Accepted`):**
```json
{
  "notebook_id": "e4a7b2c9-8d1e-4f3a-9b5c-7d8e9f0a1b2c",
  "status": "Processing",
  "message": "Pipeline started in background"
}
```

---

### 4.3 Human-in-the-Loop Batch Verification (`POST /api/v1/transactions/verify`)

**Request Body:**
```json
{
  "notebook_id": "e4a7b2c9-8d1e-4f3a-9b5c-7d8e9f0a1b2c",
  "transactions": [
    {
      "id": "f1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "description": "युरिया खत खरेदी (Urea Fertilizer)",
      "category": "Fertilizers",
      "crop": "Soybean",
      "type": "Expense",
      "amount": 1450.0,
      "unit": "₹",
      "verified": true
    }
  ]
}
```

---

### 4.4 Farm Finance Analytics Summary (`GET /api/v1/analytics/summary`)

**Response (`200 OK`):**
```json
{
  "total_notebooks": 12,
  "total_transactions": 84,
  "verified_transactions": 78,
  "unverified_transactions": 6,
  "total_expenses": 45200.0,
  "total_income": 128000.0,
  "net_profit_loss": 82800.0,
  "category_breakdown": [
    {
      "category": "Fertilizers",
      "total_amount": 18500.0,
      "percentage": 40.93,
      "transaction_count": 14
    },
    {
      "category": "Labor",
      "total_amount": 15000.0,
      "percentage": 33.19,
      "transaction_count": 22
    }
  ],
  "crop_breakdown": [
    {
      "crop": "Soybean",
      "total_expense": 25000.0,
      "total_income": 85000.0,
      "net_profit": 60000.0
    }
  ]
}
```

---

## 5. Android Mobile App Integration

Android native apps integrate via Retrofit 2 or WebViews SDK:

### 5.1 Pre-Upload Image Compression
Android apps MUST compress images using [`ImageCompressor.kt`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/android-kotlin/ImageCompressor.kt):
```kotlin
val compressedFile = ImageCompressor.compressAndSaveImage(context, rawImageFile)
```

### 5.2 Retrofit API Call
```kotlin
val requestFile = RequestBody.create("image/jpeg".toMediaTypeOrNull(), compressedFile)
val body = MultipartBody.Part.createFormData("file", compressedFile.name, requestFile)
val farmerIdBody = RequestBody.create("text/plain".toMediaTypeOrNull(), "FARMER_MH_401")

val response = apiService.uploadNotebook(farmerIdBody, body)
```

---

## 6. WhatsApp Bot Integration

The WhatsApp Bot server in `production/whatsapp-bot/` handles incoming media via Meta Cloud API / Twilio webhooks, forwards photos to the GramIQ OCR backend, polls pipeline status, and replies with structured transaction summaries.

---

## 7. Comprehensive Edge Cases & Production Guardrails

1. **Unverified Lock Guard:** Modifying or re-processing notebooks with `verified: true` is locked to prevent data corruption.
2. **Quality Gate:** Blur variance < `100.0` or extreme dark/bright lighting aborts processing cleanly before API billing.
3. **Indic Entity Fallback:** Unknown agricultural dialect words default to `Miscellaneous` category with `confidence_level: "Low"` for human review.

---

## 8. Verification & Testing Playbook

- **Postman Collection:** Import `production/GramIQ_Finance_OCR_APIs.postman_collection.json`.
- **Node.js Syntax Check:** `node --check production/javascript-api/api-client.js`
- **Python Syntax Check:** `python -m py_compile production/backend-integration/client.py`

---

## 9. Comprehensive Troubleshooting Matrix

| Issue / Symptom | Possible Cause | Production Resolution |
|---|---|---|
| `413 Payload Too Large` | Uploaded image > 15MB. | Use `ImageCompressor.kt` or client-side canvas resize. |
| `409 Conflict` | Reprocessing verified notebook. | Unverify notebook transactions before re-running pipeline. |
| `500 Gemini Vision Timeout` | API quota or latency spike. | System retries background processing automatically up to 3 times. |

---

## 10. Deployment & Containerization Command Reference

```bash
# Build and run entire production stack
cd production/backend-integration
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 11. Performance Benchmarks & SLA Limits

- **Notebook Upload:** `< 500 ms`
- **3-Step AI Vision Pipeline Processing:** `< 3.5 seconds`
- **Database Query Latency:** `< 50 ms`
