# Graph Report - Finance OCR  (2026-08-04)

## Corpus Check
- 84 files · ~82,389 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 937 nodes · 1095 edges · 55 communities (46 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fdda7ddc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- upload_notebook
- LLMParserService
- compilerOptions
- devDependencies
- transactions.py
- 1.2 Critical Issues
- main.py
- endpoints/analytics.py
- PipelineOrchestrator
- whatsapp-bot/package.json
- vercel.json
- ocr.ts
- frontend/vercel.json
- deploy_to_render
- 1.2 Critical Issues
- GramIQ_AI_Ledger_Digitization_TDD.md
- GramIQ_AI_Ledger_Digitization_TDD_0fc3c8f2.md
- Backend Core & Schemas
- GramIQFinanceClient
- **Comparative Analysis of Meteorological APIs for Precision Agricultural Advisory Systems**
- webhook-server.js
- Component Breakdown
- Comparative Analysis of Meteorological APIs for Precision Agricultural Advisory Systems
- Executive Summary
- GramIQFinanceClient
- 🌾 GramIQ AI Ledger Digitization System
- GramIQBackendClient
- javascript-api/package.json
- Key Features & Visual Design Elements
- GramIQ Finance OCR - Production Integration Suite
- notebooks.py
- 2. Core UI Components Built
- GramIQ AI Ledger Digitization - Implementation Walkthrough
- DatabaseClient
- Key Accomplishments
- GramIQ WhatsApp Bot Production Integration
- gemini-benchmark-comparison.md
- rules/graphify.md
- workflows/graphify.md
- 📘 GramIQ Agricultural AI: Finance OCR Production Integration Guide
- FinanceOcrApiService
- 🛡️ GramIQ Finance OCR Production Guardrails & Safeguards
- 🛠️ Key Capabilities
- Models.kt
- 🧪 GramIQ Finance OCR - Postman API Testing Guide
- schemas/notebook.py
- ImageCompressor
- GramIQ Finance OCR - Enhanced Production Integration Suite Walkthrough
- GramIQFinanceClient
- GramIQ Finance OCR - Frontend Refactoring Walkthrough
- GramIQ Finance OCR - Live JavaScript API Endpoints Verification

## God Nodes (most connected - your core abstractions)
1. `GramIQFinanceClient` - 22 edges
2. `GramIQFinanceClient` - 21 edges
3. `GramIQFinanceClient` - 19 edges
4. `Component Breakdown` - 17 edges
5. `compilerOptions` - 16 edges
6. `LLMParserService` - 15 edges
7. `📘 GramIQ Agricultural AI: Finance OCR Production Integration Guide` - 13 edges
8. `Executive Summary` - 12 edges
9. `GramIQBackendClient` - 11 edges
10. `FarmKnowledgeBase` - 10 edges

## Surprising Connections (you probably didn't know these)
- `PipelineOrchestrator` --uses--> `LLMParserService`  [INFERRED]
  backend/app/services/pipeline_orchestrator.py → backend/app/services/llm_parser.py
- `PipelineOrchestrator` --uses--> `ValidationEngine`  [INFERRED]
  backend/app/services/pipeline_orchestrator.py → backend/app/services/validation_engine.py
- `upload_notebook()` --calls--> `Notebook`  [EXTRACTED]
  backend/app/api/v1/endpoints/notebooks.py → backend/app/models/notebook.py
- `PipelineOrchestrator` --uses--> `NotebookStatus`  [INFERRED]
  backend/app/services/pipeline_orchestrator.py → backend/app/models/notebook.py
- `PipelineOrchestrator` --uses--> `Notebook`  [INFERRED]
  backend/app/services/pipeline_orchestrator.py → backend/app/models/notebook.py

## Import Cycles
- None detected.

## Communities (55 total, 9 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.08
Nodes (36): App(), AnalyticsDashboard(), AnalyticsDashboardProps, COLORS, Header(), HeaderProps, ImageZoomModal(), ImageZoomModalProps (+28 more)

### Community 1 - "upload_notebook"
Cohesion: 0.25
Nodes (9): process_notebook(), post, ProcessNotebookRequest, Accepts multipart/form-data image upload. Saves file and creates a Notebook…, Triggers the 8-stage AI digitization pipeline for a notebook. Returns 202…, upload_notebook(), _validate_upload_file(), BackgroundTasks (+1 more)

### Community 2 - "LLMParserService"
Cohesion: 0.08
Nodes (18): get, Searches Indic agricultural term mappings., search_knowledge_base(), FarmKnowledgeBase, Lookup local Hindi/Marathi/English terms in text to infer Category and…, Determines if the transaction is Income or Expense., Checks if transaction amount falls within realistic sanity bounds., Domain-specific Farm Knowledge Base for Indian agricultural ledgers. Maps local… (+10 more)

### Community 3 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+13 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (36): dependencies, lucide-react, react, react-dom, recharts, @supabase/supabase-js, devDependencies, tailwindcss (+28 more)

### Community 5 - "transactions.py"
Cohesion: 0.16
Nodes (17): batch_verify_transactions(), delete_transaction(), BatchVerifyRequest, delete, post, put, Session, Accepts farmer edits/reviews and marks transactions as verified=True. Updates… (+9 more)

### Community 6 - "1.2 Critical Issues"
Cohesion: 0.05
Nodes (42): 1.1 What It Gets Right, 1.2 Critical Issues, 1.3 What Is Missing for GramIQ Specifically, 1.4 Verified Claims with Sources, 2.1 What It Gets Right, 2.2 Hallucinated and Unverifiable Citations, 2.3 Technical Inaccuracies, 2.4 Professional Writing Issues (+34 more)

### Community 7 - "main.py"
Cohesion: 0.18
Nodes (10): get_db(), global_exception_handler(), lifespan(), get, Session, root(), Exception, exception_handler (+2 more)

### Community 8 - "endpoints/analytics.py"
Cohesion: 0.36
Nodes (8): get_analytics_summary(), get, Session, Computes farm finance analytics summary across all digitised transactions., AnalyticsSummaryResponse, CategorySummary, CropSummary, BaseModel

### Community 9 - "PipelineOrchestrator"
Cohesion: 0.13
Nodes (14): Notebook, NotebookStatus, Base, Base, Transaction, ImageProcessor, Any, Corrects page rotation using minimum area rectangle contour bounds. (+6 more)

### Community 11 - "whatsapp-bot/package.json"
Cohesion: 0.06
Nodes (30): axios, _parse_cors_origins(), Settings, _split_csv(), dotenv, express, form-data, nodemon (+22 more)

### Community 12 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, outputDirectory, rewrites, rootDirectory, $schema

### Community 14 - "frontend/vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, outputDirectory, rewrites

### Community 18 - "1.2 Critical Issues"
Cohesion: 0.05
Nodes (42): 1.1 What It Gets Right, 1.2 Critical Issues, 1.3 What Is Missing for GramIQ Specifically, 1.4 Verified Claims with Sources, 2.1 What It Gets Right, 2.2 Hallucinated and Unverifiable Citations, 2.3 Technical Inaccuracies, 2.4 Professional Writing Issues (+34 more)

### Community 19 - "GramIQ_AI_Ledger_Digitization_TDD.md"
Cohesion: 0.05
Nodes (40): **10\. Conclusion**, **1\. Problem Statement**, **2.1 Core User Journey**, **2.2 Key Design Principles**, **2\. Proposed Solution**, **3.1 High-Level Pipeline**, **3.2 Component Architecture**, **3\. Technical Architecture Overview** (+32 more)

### Community 20 - "GramIQ_AI_Ledger_Digitization_TDD_0fc3c8f2.md"
Cohesion: 0.05
Nodes (40): 10. Conclusion, 1. Problem Statement, 2.1 Core User Journey, 2.2 Key Design Principles, 2. Proposed Solution, 3.1 High-Level Pipeline, 3.2 Component Architecture, 3. Technical Architecture Overview (+32 more)

### Community 21 - "Backend Core & Schemas"
Cohesion: 0.07
Nodes (29): AI Pipeline & Processing Services, Automated Tests, Backend Core & Schemas, Frontend Streamlit Application & Demo Assets, GramIQ AI Ledger Digitization System - Implementation Plan, Manual Verification, [NEW] [analytics.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/api/v1/endpoints/analytics.py), [NEW] [app.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/app.py) (+21 more)

### Community 22 - "GramIQFinanceClient"
Cohesion: 0.07
Nodes (11): AnalyticsSummary, CategorySummary, CropSummary, GramIQClientConfig, GramIQFinanceClient, IntermediateData, KnowledgeBaseItem, KnowledgeBaseSearchResult (+3 more)

### Community 23 - "**Comparative Analysis of Meteorological APIs for Precision Agricultural Advisory Systems**"
Cohesion: 0.08
Nodes (25): **1.1 The Thermodynamics of Pesticide and Herbicide Spraying**, **1.2 Hydrological Efficiency in Irrigation and Watering**, **1.3 Soil Dynamics in Sowing, Seeding, and Germination**, **1.4 Mechanical and Biological Constraints on Harvesting**, **1\. The Physics and Agronomy of Weather-Dependent Field Operations**, **2.1 Spatial Resolution, Grid Systems, and Downscaling**, **2.2 Temporal Resolution and Forecast Horizons**, **2.3 Required Agro-Meteorological Parameters** (+17 more)

### Community 24 - "webhook-server.js"
Cohesion: 0.10
Nodes (16): GramIQFinanceClient, app, axios, client, express, FormData, fs, GramIQFinanceClient (+8 more)

### Community 25 - "Component Breakdown"
Cohesion: 0.08
Nodes (24): Automated Verification, Component Breakdown, Manual Verification, [NEW] [api-client.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/javascript-api/api-client.js), [NEW] [client.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/backend-integration/client.py), [NEW] [db-client.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/postgresql/db-client.js), [NEW] [docker-compose.prod.yml](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/backend-integration/docker-compose.prod.yml), [NEW] [.env.example](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/whatsapp-bot/.env.example) (+16 more)

### Community 26 - "Comparative Analysis of Meteorological APIs for Precision Agricultural Advisory Systems"
Cohesion: 0.08
Nodes (24): 1.1 The Thermodynamics of Pesticide and Herbicide Spraying, 1.2 Hydrological Efficiency in Irrigation and Watering, 1.3 Soil Dynamics in Sowing, Seeding, and Germination, 1.4 Mechanical and Biological Constraints on Harvesting, 1. The Physics and Agronomy of Weather-Dependent Field Operations, 2.1 Spatial Resolution, Grid Systems, and Downscaling, 2.2 Temporal Resolution and Forecast Horizons, 2.3 Required Agro-Meteorological Parameters (+16 more)

### Community 27 - "Executive Summary"
Cohesion: 0.09
Nodes (21): Agricultural Accounting Research, Dataset Survey, Document AI Frameworks, Executive Summary, Future Research Directions, GitHub Repository Survey, Handwritten OCR & HTR, Implementation Roadmap (+13 more)

### Community 29 - "🌾 GramIQ AI Ledger Digitization System"
Cohesion: 0.10
Nodes (19): 📑 API Reference, Backend (`backend/.env`), Backend → Render (Docker), ☁️ Deployment, 🔑 Environment Variables, Frontend (`frontend/.env.local`), Frontend → Vercel, 🌾 GramIQ AI Ledger Digitization System (+11 more)

### Community 30 - "GramIQBackendClient"
Cohesion: 0.16
Nodes (8): GramIQBackendClient, Any, GramIQ Finance OCR - Python Production Integration SDK Client Allows Python…, Production Python client for GramIQ FastAPI backend., Checks API health and database connectivity., Uploads a farm ledger notebook image., Triggers the 3-step AI vision OCR pipeline., Polls notebook status until 'Complete' or 'Failed'.

### Community 31 - "javascript-api/package.json"
Cohesion: 0.12
Nodes (16): author, description, finance-ocr, gramiq, keywords, license, main, name (+8 more)

### Community 32 - "Key Features & Visual Design Elements"
Cohesion: 0.13
Nodes (14): 1. Technology Stack & Dependencies, 2. Frontend Structure (`frontend/src`), A. Dark Glassmorphic Design System (`index.css`), Automated Build & Lint Verification, B. Animated 8-Stage Pipeline Visualizer (`PipelineDiagram.tsx`), C. Interactive Ledger & Batch Verifier (`TransactionTable.tsx`), D. Financial Analytics & Farm P&L (`AnalyticsDashboard.tsx`), E. Indic Financial Dictionary (`KnowledgeExplorer.tsx`) (+6 more)

### Community 33 - "GramIQ Finance OCR - Production Integration Suite"
Cohesion: 0.20
Nodes (9): 📘 1. Master Production Integration Guide, 🛡️ 2. Production Guardrails & Safeguards, 🧪 3. Postman API Testing Suite, 📱 4. Android App Frontend Integration, 💬 5. WhatsApp Bot Webhook, 🗄️ 6. PostgreSQL Database, 🐳 7. Production Docker Compose Stack, GramIQ Finance OCR - Production Integration Suite (+1 more)

### Community 34 - "notebooks.py"
Cohesion: 0.18
Nodes (17): delete_notebook(), get_intermediate_pipeline_data(), get_notebook(), get_notebook_transactions(), list_notebooks(), delete, get, put (+9 more)

### Community 35 - "2. Core UI Components Built"
Cohesion: 0.14
Nodes (13): 1. Dark Glassmorphic Design System (`src/index.css`), 2. Core UI Components Built, A. Glass Header & Navigation (`[Header.tsx](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/Header.tsx)`), B. 8-Stage AI Digitization Pipeline Visualizer (`[PipelineDiagram.tsx](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/PipelineDiagram.tsx)`), C. Upload Studio & Preset Samples (`[UploadStudio.tsx](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/UploadStudio.tsx)`), D. Interactive Ledger Verification Table (`[TransactionTable.tsx](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/TransactionTable.tsx)`), E. Deep-Dive Pipeline Intermediate Inspector (`[IntermediateModal.tsx](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/IntermediateModal.tsx)`), F. Farm P&L Analytics Dashboard (`[AnalyticsDashboard.tsx](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/AnalyticsDashboard.tsx)`) (+5 more)

### Community 36 - "GramIQ AI Ledger Digitization - Implementation Walkthrough"
Cohesion: 0.17
Nodes (11): 1. Automated Test Suite, 1. FastAPI REST Backend Service (`backend/`), 2. Multi-Stage AI Digitization Pipeline (`app/services/`), 2. Sample Ledger Generation, 3. Interactive Streamlit Frontend UI (`frontend/`), GramIQ AI Ledger Digitization - Implementation Walkthrough, 🚀 How to Run the Backend and Frontend, Step 1: Start the FastAPI Backend Server (+3 more)

### Community 38 - "Key Accomplishments"
Cohesion: 0.22
Nodes (8): 1. 🔄 Advisory API Multi-Model Cascade & Resilient Fallback ([frontend/api/advisory.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/frontend/api/advisory.js) & [frontend/app.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/frontend/app.js)), 2. ⚡ Upgraded Advisory Engine & Independent Diagnosis ([frontend/api/advisory.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/frontend/api/advisory.js)), 3. 🛡️ Leaf Image Guardrail Named Rejection Reasons ([frontend/api/validate.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/frontend/api/validate.js)), 4. 🦖 Meta DINOv2 Self-Supervised Visual Feature Retrieval ([ml/staging/main.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/ml/staging/main.py)), 5. 📜 Diagnosis History Log & Supabase API Sync ([frontend/app.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/frontend/app.js) & [frontend/api/feedback.js](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Crop%20Disease%20Detection/frontend/api/feedback.js)), Implementation Walkthrough, Key Accomplishments, Verification Results

### Community 39 - "GramIQ WhatsApp Bot Production Integration"
Cohesion: 0.25
Nodes (7): Configure Variables:, 🚀 Environment & Configuration Setup, GramIQ WhatsApp Bot Production Integration, 📦 Installation & Run, 🌟 Key Features, 🔗 Meta Cloud API Webhook Verification, 📱 Supported WhatsApp User Flow

### Community 43 - "📘 GramIQ Agricultural AI: Finance OCR Production Integration Guide"
Cohesion: 0.09
Nodes (21): 10. Deployment & Containerization Command Reference, 11. Performance Benchmarks & SLA Limits, 1.1 Production API Endpoints Matrix, 1.2 Sequential 3-Step AI Vision Pipeline Architecture, 1. System Architecture & Data Flow, 2. PostgreSQL Database Schema & Migration, 3. Environment Configuration & Secrets (`.env`), 4.1 Notebook Upload (`POST /api/v1/notebooks/upload`) (+13 more)

### Community 44 - "FinanceOcrApiService"
Cohesion: 0.18
Nodes (9): AnalyticsSummaryResponse, MultipartBody, NotebookResponse, FinanceOcrApiService, BatchVerifyRequest, ProcessNotebookRequest, RequestBody, Response (+1 more)

### Community 45 - "🛡️ GramIQ Finance OCR Production Guardrails & Safeguards"
Cohesion: 0.12
Nodes (15): 1. Overview & Core Philosophy, 2.1 Allowed Image Formats & Size Limits, 2.2 OpenCV Image Quality Score Gate, 2. Input Validation & Image Quality Gate, 3.1 Unverified Transaction Lock, 3.2 Indic Category Normalization, 3.3 Financial Amount & Unit Guardrails, 3. Pipeline & AI Guardrails (+7 more)

### Community 46 - "🛠️ Key Capabilities"
Cohesion: 0.22
Nodes (8): 1. Android Frontend JavaScript API SDK (`javascript-api/`), 2. WhatsApp Bot Integration (`whatsapp-bot/`), 3. PostgreSQL Database Integration (`postgresql/`), 4. Backend Microservice Integration (`backend-integration/`), GramIQ Finance OCR - Production Integration Suite Walkthrough, 🛠️ Key Capabilities, 🔍 Validation & Verification, 📦 What Was Built & Created

### Community 47 - "Models.kt"
Cohesion: 0.25
Nodes (7): AnalyticsSummaryResponse, BatchVerifyRequest, CategorySummary, CropSummary, NotebookResponse, ProcessNotebookRequest, TransactionResponse

### Community 48 - "🧪 GramIQ Finance OCR - Postman API Testing Guide"
Cohesion: 0.29
Nodes (6): 1. Import Collection into Postman, 2. Configure Environment Variables, 📋 End-to-End Testing Workflow, 🧪 GramIQ Finance OCR - Postman API Testing Guide, 🚀 Quick Start Guide, 💬 WhatsApp Webhook Testing

### Community 49 - "schemas/notebook.py"
Cohesion: 0.53
Nodes (5): NotebookBase, NotebookCreate, NotebookResponse, ProcessNotebookRequest, BaseModel

### Community 51 - "GramIQ Finance OCR - Enhanced Production Integration Suite Walkthrough"
Cohesion: 0.40
Nodes (4): 📁 Enhanced Production Architecture & File Layout, GramIQ Finance OCR - Enhanced Production Integration Suite Walkthrough, 🌟 Major Enhancements Added, 🔍 Validation & Verification

### Community 53 - "GramIQ Finance OCR - Frontend Refactoring Walkthrough"
Cohesion: 0.50
Nodes (3): GramIQ Finance OCR - Frontend Refactoring Walkthrough, 🛠️ Key Refactoring Changes, 🔍 Validation & Verification

### Community 54 - "GramIQ Finance OCR - Live JavaScript API Endpoints Verification"
Cohesion: 0.50
Nodes (3): GramIQ Finance OCR - Live JavaScript API Endpoints Verification, 🧪 Live Endpoint Verification Results, 🌐 Live Web & Mobile Application Status

## Knowledge Gaps
- **454 isolated node(s):** `Settings`, `config`, `TERM_MAPPINGS`, `name`, `private` (+449 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PipelineOrchestrator` connect `PipelineOrchestrator` to `notebooks.py`, `LLMParserService`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Transaction` connect `PipelineOrchestrator` to `notebooks.py`, `LLMParserService`, `transactions.py`, `main.py`, `endpoints/analytics.py`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `LLMParserService` connect `LLMParserService` to `PipelineOrchestrator`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `Settings`, `config`, `TERM_MAPPINGS` to the rest of the system?**
  _454 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08244897959183674 - nodes in this community are weakly interconnected._
- **Should `LLMParserService` be split into smaller, more focused modules?**
  _Cohesion score 0.08392603129445235 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._