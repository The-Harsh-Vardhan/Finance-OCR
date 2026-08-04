<!-- converted from GramIQ_AI_Ledger_Digitization_TDD.docx -->


GramIQ
AI Ledger Digitization System

Technical Design Document
Version 1.0  •  July 2026


# 1. Problem Statement

India has over 120 million smallholder farming households. A significant portion of these farmers maintain their financial records in handwritten paper notebooks — commonly known as Bahi-Khata. These physical ledgers capture critical data about:

•  Seed purchases and variety names
•  Fertilizer and pesticide expenditure
•  Labour and machinery payments
•  Irrigation and fuel costs
•  Crop sales, dairy income, and loan records
•  Miscellaneous farm expenses

Despite being valuable first-party financial records, these notebooks suffer from four compounding problems:


The consequence is a structural information gap. Farmers cannot compute cost of cultivation, profit margins, or crop-wise profitability from these records without manual effort. Agribusinesses and financial institutions are likewise unable to access verified farm-level data to design relevant products or offer credit.

The GramIQ AI Ledger Digitization System directly addresses this gap by converting handwritten notebook images into structured, machine-readable financial transactions using a multi-stage AI pipeline.

# 2. Proposed Solution

The proposed solution is an end-to-end AI Document Intelligence pipeline embedded within the GramIQ Android application. Rather than a simple OCR tool, the system is designed as a multi-stage intelligence stack that understands agricultural context, handles mixed-language handwriting, and produces structured financial records with high accuracy.

## 2.1 Core User Journey

•  Farmer opens the GramIQ app and taps "Scan Bahi-Khata"
•  Captures one or more notebook pages using the camera
•  The system validates image quality and prompts a retake if needed
•  AI pipeline processes the image: enhances, reads, understands, and structures transactions
•  Only low-confidence entries are shown for farmer review
•  Verified transactions are stored and immediately visible in the farm finance dashboard
•  Analytics, profit summaries, and crop-wise reports are updated automatically

## 2.2 Key Design Principles






# 3. Technical Architecture Overview

The system is structured as a linear processing pipeline where each stage produces an artifact consumed by the next. Stages are independently deployable and can be replaced or upgraded without rebuilding the full pipeline.

## 3.1 High-Level Pipeline

The pipeline flows as follows across eight stages:


## 3.2 Component Architecture

Components are deployed across three tiers:

### Mobile Tier (Flutter)
•  Camera capture module with image quality pre-check
•  Lightweight preview and user review screen
•  Offline queue for uploads in low-connectivity areas

### Backend Tier (FastAPI on Google Cloud)
•  REST API gateway receiving image uploads
•  Celery + Redis task queue for async pipeline execution
•  Orchestration layer calling each pipeline stage sequentially
•  Farm Knowledge Base microservice

### AI / ML Tier
•  OpenCV service for image enhancement
•  PaddleOCR (primary) + TrOCR (fallback) for handwriting recognition
•  PP-Structure or LayoutLMv3 for document layout understanding
•  Gemini 2.5 Pro / GPT-5 for LLM-based parsing, categorisation, and enrichment
•  Validation rules engine with arithmetic and duplicate checks

# 4. Deep Dive: Technical Decisions & Technologies

## 4.1 Image Enhancement — OpenCV

Handwritten notebook photos captured on mobile devices suffer from multiple quality issues that directly degrade OCR accuracy. OpenCV is chosen as the image pre-processing layer because it is battle-tested, runs efficiently on server CPUs, and provides every transformation needed:

•  Deskew — corrects rotated pages using Hough line detection
•  Denoising — applies non-local means denoising (cv2.fastNlMeansDenoising)
•  Shadow removal — normalises uneven illumination with morphological operations
•  Adaptive thresholding — converts grayscale to binary using local contrast (cv2.adaptiveThreshold)
•  Perspective correction — flattens warped or angled notebook captures using homography

A quality gate is applied before enhancement. If the image falls below minimum thresholds for blur (Laplacian variance), resolution (minimum 300×400 px), or coverage, the app returns a prompt asking the farmer to retake the photo. This prevents propagating poor inputs into the expensive AI stages.

## 4.2 Layout Analysis — PP-Structure / LayoutLMv3

Farmer notebooks do not follow a uniform layout. Some use columns, others list items line-by-line, and many mix narrative text with tabular amounts. A dedicated layout analysis step is required to correctly identify transaction regions before OCR is applied.

Two models are recommended:


The output is a region map that tags each bounding box as one of: transaction, total/subtotal, header, or margin-note. Only transaction regions are forwarded to OCR. Totals and subtotals are detected and excluded from transaction extraction, preventing double-counting.

## 4.3 OCR Engine — PaddleOCR + TrOCR

OCR for Indian farmer notebooks presents two challenges that generic OCR systems do not handle well: mixed-script handwriting (Hindi Devanagari + Marathi + English in a single line), and informal abbreviations for agricultural products.

Primary: PaddleOCR
•  Supports Hindi and English out-of-the-box with pre-trained models
•  Faster inference than transformer-based alternatives
•  Outputs text, per-character confidence scores, and bounding boxes
•  Horizontally and vertically oriented text detection

Fallback: TrOCR (Microsoft)
•  Transformer-based encoder-decoder architecture
•  Stronger on irregular, degraded, or cursive handwriting
•  Invoked automatically when PaddleOCR confidence falls below 0.75

Both engines return a standardised JSON structure per text line:
{ "text": "मजुरी", "confidence": 0.98, "bbox": [x1, y1, x2, y2] }

## 4.4 Farm Intelligence Engine — LLM (Gemini 2.5 Pro / GPT-5)

The most differentiated component of the system is the Farm Intelligence Engine — an LLM-powered parsing layer that understands agricultural context, not just text. Raw OCR output is incomplete: the product name "DAP" does not self-evidently map to "Fertilizer > Di-Ammonium Phosphate" without domain knowledge.

Responsibilities of the LLM layer:
•  Parse OCR text into structured date / description / amount triplets
•  Categorise each transaction (Fertilizer, Pesticide, Labour, Machinery, Sales, etc.)
•  Resolve local product names and abbreviations against the Farm Knowledge Base
•  Infer the crop being cultivated from contextual clues in surrounding entries
•  Identify and skip subtotal rows
•  Return a structured JSON array — no free text

Model selection rationale:


The system prompt provided to the LLM embeds the Farm Knowledge Base inline for the relevant crop and region, giving the model access to local spelling variants, product-to-category mappings, and amount sanity ranges. This retrieval-augmented approach keeps the model grounded without requiring fine-tuning.

## 4.5 Farm Knowledge Base

A domain-specific knowledge repository that maps unstructured agricultural references to canonical structured data. It is the backbone that distinguishes this system from a generic document digitisation tool.

Contents:
•  Fertilizer names, aliases, and manufacturer brands (DAP → Di-Ammonium Phosphate → Fertilizer)
•  Pesticide names, active ingredients, and subcategory (Monocrotophos → Insecticide)
•  Seed varieties per crop and region
•  Labour category names in Hindi and Marathi
•  Common vendor names and aggregation aliases
•  Expected amount ranges per category (sanity check bounds)
•  Seasonal crop calendars per district in Maharashtra

The knowledge base is maintained as a structured database table (Product) and served via a FastAPI microservice. It is updated continuously as new product names and regional variants are encountered through farmer interactions on the broader GramIQ platform.

## 4.6 Validation Engine

Before any transaction reaches the review screen, it passes through a rule-based validation layer:

•  Arithmetic validation — running totals on the page must reconcile with extracted amounts
•  Date validation — dates are normalised and checked for plausibility (not in future, within current season)
•  Amount validation — amounts checked against expected ranges from the Farm Knowledge Base
•  Duplicate detection — hash-based comparison against recently uploaded pages for the same farmer
•  Missing field detection — mandatory fields (date, amount, category) are flagged if absent
•  Confidence scoring — each transaction receives a composite score (High / Medium / Low) based on OCR confidence and validation results

Only Low-confidence transactions are surfaced in the farmer review screen. High and Medium confidence transactions are auto-committed to the database, minimising the review burden.

## 4.7 Technology Stack Summary


# 5. API Design

Four REST endpoints expose the pipeline to the mobile application and future integrations:

## POST /api/v1/notebooks/upload
Accepts a multipart image upload. Validates format and file size. Returns a notebook_id for subsequent calls.

Response: { "notebook_id": "uuid", "status": "Uploaded" }

## POST /api/v1/notebooks/process
Triggers the async pipeline for a given notebook_id. Stages run in the Celery queue. Status is polled via GET.

Response: { "notebook_id": "uuid", "status": "Processing" }

## GET /api/v1/notebooks/{id}/transactions
Returns all extracted transactions for the notebook, including confidence scores and verification status. The mobile app uses this to populate the review screen.

## POST /api/v1/transactions/verify
Accepts farmer edits and approvals from the review screen. Updates transaction records to verified = true. Triggers downstream analytics recalculation.

# 6. Database Design

Four core tables store the digitisation artefacts and support downstream analytics:

## 6.1 Notebook

## 6.2 Transaction

# 7. Performance Targets & Security

## 7.1 Performance Targets


## 7.2 Security Controls

•  HTTPS enforced on all API endpoints — no plaintext data transmission
•  JWT-based authentication for all API calls from the mobile app
•  Signed upload URLs — images upload directly to S3 without passing through application servers
•  Encrypted image storage at rest on S3 (AES-256)
•  Role-based access control (RBAC) — farmers see only their own records; agribusiness users see aggregated intelligence only
•  Audit logging — all transactions record which pipeline stage created or modified them
•  GDPR-aligned data handling — consistent with GramIQ's existing compliance framework

# 8. Expected Outcomes

Successful deployment of the AI Ledger Digitization System is projected to produce measurable outcomes across three dimensions:

## 8.1 Farmer-Level Outcomes

•  Farmers who previously tracked finances only in paper notebooks gain instant digital visibility into crop-wise profit and loss
•  Cost of cultivation per acre becomes computable without manual arithmetic
•  Historical season data is preserved and searchable — no information lost when a notebook is damaged or lost
•  Onboarding of existing farmers with years of Bahi-Khata records becomes possible, dramatically enriching GramIQ's data asset

## 8.2 Platform-Level Outcomes

•  Significant uplift in Daily Active Users as digitisation provides immediate, tangible value to farmers
•  First-party farm financial data at scale — the core proprietary asset required for GramIQ's agribusiness intelligence product
•  Improved profitability prediction and crop planning models, trained on verified historical cost data
•  Foundation for BFSI credit scoring — verified farm income and expense records can support farmer credit applications

## 8.3 Business-Level Outcomes


# 9. Future Roadmap

The current TDD defines Phase 1: server-side AI pipeline. The following phases are planned:

## Phase 2 — Voice Corrections
Allow farmers to correct transactions by voice: "Diesel amount is ₹900, not ₹700." The AI voice agent converts speech to a structured correction and updates the record.

## Phase 3 — Multi-page Continuity
Automatically detect that a new upload is a continuation of a previously processed notebook and merge transactions into a single chronological ledger.

## Phase 4 — On-Device OCR
Deploy a lightweight quantised OCR model directly on the Android app for farmers in low-connectivity areas. Transactions are extracted offline and synced when connectivity is restored.

## Phase 5 — Proprietary Farm Document Model
Fine-tune a vision-language model specifically on GramIQ's growing dataset of farmer notebooks. This model will outperform generic models on agricultural handwriting, regional scripts, and product name resolution — creating a defensible AI asset.

## Phase 6 — Financial Intelligence Layer
Automatically generate monthly P&L statements, crop-wise profitability reports, input cost benchmarks, and a financial health score — turning raw notebook data into actionable farm management intelligence.

# 10. Conclusion

The GramIQ AI Ledger Digitization System is a purpose-built, agriculture-domain AI pipeline that solves a problem no general-purpose document intelligence tool can address: reliably converting multilingual, handwritten Indian farm notebooks into structured financial data.

By combining computer vision (OpenCV), document layout analysis (PP-Structure / LayoutLMv3), multilingual handwriting OCR (PaddleOCR + TrOCR), large language model reasoning (Gemini 2.5 Pro / GPT-5), and a domain-specific Farm Knowledge Base, the system achieves transaction accuracy above 95% with minimal farmer effort.

The architecture is modular, scalable on Google Cloud Platform, and designed for continuous improvement. Each notebook processed enriches GramIQ's proprietary farm dataset — compounding the value of the Farm Intelligence Engine over time.

Beyond the immediate utility to individual farmers, the digitised records create the data foundation for GramIQ's higher-value products: agribusiness intelligence, BFSI credit scoring, and predictive crop planning. The Ledger Digitization System is therefore not only a farmer-facing feature — it is a strategic data infrastructure investment that strengthens GramIQ's competitive moat in the Indian agritech landscape.

| Project | GramIQ AI Document Intelligence |
| --- | --- |
| Authors | GramIQ Engineering Team |
| Status | Draft — For Internal Review |
| Version | 1.0 |
| Date | July 2026 |
| Problem | Impact |
| --- | --- |
| Physical & Unstructured | Records cannot be searched, aggregated, or analysed digitally |
| Multilingual Handwriting | Entries mix Hindi, Marathi, and English across the same page |
| Inconsistent Format | Date placement, column layout, and abbreviations vary per farmer |
| No Digital Continuity | Insights from past seasons are unavailable when making new crop decisions |
| Accuracy First | Transaction accuracy above 95% after review is the primary target. The system errs toward human review rather than incorrect auto-confirmation. |
| --- | --- |
| Agriculture-Aware | A domain-specific Farm Knowledge Base maps local names, abbreviations, and regional product aliases to standard categories — going beyond generic OCR. |
| --- | --- |
| Minimal Friction | High-confidence transactions are auto-approved. Farmers only see a review screen for uncertain entries, keeping the experience fast. |
| --- | --- |
| Multilingual | Hindi, Marathi, and English are treated as equal inputs. Mixed-language handwriting on the same page is supported natively. |
| --- | --- |
| Offline Capable | Lightweight on-device OCR is planned for low-connectivity regions in the next phase, ensuring rural usability. |
| --- | --- |
| # | Stage | Output Artifact |
| --- | --- | --- |
| 1 | Image Acquisition | Raw image file (JPG / PNG) |
| 2 | Image Enhancement | Cleaned, deskewed, normalised image |
| 3 | Layout Analysis | Region map with typed bounding boxes |
| 4 | OCR Engine | Text + confidence + bounding box per line |
| 5 | Transaction Segmentation | Raw transaction records (date + text + amount) |
| 6 | Farm Intelligence Engine (LLM) | Categorised, enriched transaction JSON |
| 7 | Validation Engine | Confidence-scored, deduplicated transactions |
| 8 | Review UI + Database | Verified structured records |
| Model | Strength | When to Use |
| --- | --- | --- |
| PP-Structure | Fast, lightweight, good for tabular/column layouts | Default for structured notebooks |
| LayoutLMv3 | Multimodal (text + image), better on freeform pages | Fallback for unstructured entries |
| Model | Strength | Consideration |
| --- | --- | --- |
| Gemini 2.5 Pro | Native multimodal, strong multilingual, GCP integration | Preferred — aligns with GramIQ GCP stack |
| GPT-5 | Superior instruction following, robust JSON mode | Fallback / A-B evaluation partner |
| Layer | Technology | Rationale |
| --- | --- | --- |
| Mobile App | Flutter | Cross-platform; existing GramIQ codebase |
| API Gateway | FastAPI (Python) | High-performance async; native ML library support |
| Task Queue | Celery + Redis | Async pipeline execution; retries and prioritisation |
| Image Processing | OpenCV | Mature, efficient, comprehensive transform library |
| Layout Analysis | PP-Structure / LayoutLMv3 | Purpose-built document layout models |
| OCR (Primary) | PaddleOCR | Multilingual handwriting; fast inference |
| OCR (Fallback) | TrOCR | Stronger on degraded / cursive handwriting |
| LLM / Intelligence | Gemini 2.5 Pro / GPT-5 | Agricultural NLP, JSON mode, RAG-compatible |
| Database | PostgreSQL | Relational integrity for financial records |
| Object Storage | AWS S3 | Durable, encrypted image archive |
| Cloud Platform | Google Cloud Platform | Existing GCP billing; Gemini API integration |
| Monitoring | Prometheus + Grafana | Pipeline latency and accuracy dashboards |
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Primary key |
| farmer_id | UUID | Foreign key to farmer profile |
| image_url | String | Signed S3 URL to original image |
| upload_time | Timestamp | UTC timestamp of upload |
| status | Enum | Uploaded / Processing / Review / Complete / Failed |
| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Primary key |
| notebook_id | UUID | Parent notebook |
| transaction_date | Date | Normalised date |
| description | Text | Raw OCR description |
| category | String | e.g. Fertilizer, Labour, Sale |
| subcategory | String | e.g. Insecticide, Irrigation |
| crop | String | Inferred or farmer-confirmed crop |
| amount | Decimal | Transaction amount in INR |
| confidence | Float | Composite confidence 0.0–1.0 |
| verified | Boolean | True after farmer review |
| Metric | Target | Notes |
| --- | --- | --- |
| Image Upload | < 3 seconds | Mobile to S3 via signed URL |
| OCR Processing | < 5 seconds | Per page |
| AI Parsing (LLM) | < 8 seconds | Per page; cached for repeated products |
| End-to-End Pipeline | < 15 seconds | Upload to review-ready |
| Transaction Accuracy | > 95% | After human review confirmation |
| OCR Character Accuracy | > 90% | Across Hindi, Marathi, English |
| System Availability | 99.9% uptime | Monthly SLA |
| Metric | Projected Impact |
| --- | --- |
| Farmer Retention | Higher — digitisation creates switching cost and ongoing value |
| Data Richness | Depth of farm records increases agribusiness intelligence product value |
| New Revenue Streams | BFSI credit data products become viable once financial records are digitised |
| Differentiation | No competitor offers AI-powered Bahi-Khata digitisation in the Indian agritech market |
| Next Step | Engineering review of this TDD, assignment of stage owners, and sprint planning for Phase 1 pipeline implementation targeting Q3 2026. |
| --- | --- |