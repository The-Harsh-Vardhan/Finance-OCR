# Implementation Plan: Finance OCR Modern React Frontend (Inspired by ReasonSQL)

Build a high-performance, dark futuristic glassmorphic React + TypeScript + Tailwind CSS web frontend for **Finance OCR** (GramIQ AI Ledger Digitization Platform). Inspired by the aesthetic and interactive architecture of `ReasonSQL/frontend-next`, it will feature glowing gradients, an animated 8-stage pipeline visualization, interactive transaction verification, real-time analytics, and an Indic financial dictionary.

## User Review Required

> [!IMPORTANT]
> - **Framework Selection**: We will create a modern **Vite + React 19 + TypeScript + Tailwind CSS** application inside `frontend/` (replacing the legacy Streamlit UI while keeping a backup if desired).
> - **Design Aesthetics**: Adopts ReasonSQL's signature dark glassmorphic design (`#0c1222` canvas, `--bg-card` blur, cyan/emerald gradient orbs, animated pipeline diagram, interactive status badges, clean typography, responsive layout).
> - **API Integration**: Connects directly to the FastAPI backend running at `http://127.0.0.1:8000` (or `NEXT_PUBLIC_API_URL` / configurable via UI setting).

## Proposed Architecture & Component Design

### 1. Technology Stack & Dependencies
- **Core**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom Glassmorphism CSS variables (`globals.css` matching ReasonSQL aesthetic)
- **Icons**: Lucide React (`lucide-react`)
- **Charts**: Recharts (`recharts`) for P&L, expense category breakdowns, crop profitability, and confidence distributions
- **UI Components**: Toast notifications, Modal dialogs, Processing diagram, Interactive transaction editor

---

### 2. Frontend Structure (`frontend/src`)

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css               # ReasonSQL glassmorphic dark theme tokens & animations
│   ├── types/                  # API data interfaces (Notebook, Transaction, Analytics, PipelineStage)
│   ├── services/               # API client for FastAPI backend (/api/v1/notebooks, /transactions, /analytics)
│   ├── components/
│   │   ├── Header.tsx          # Glassmorphic nav header + server health indicator
│   │   ├── PipelineDiagram.tsx # Animated 8-stage OCR digitization pipeline visualization
│   │   ├── UploadStudio.tsx    # Drag-and-drop upload, sample images, crop hint selector
│   │   ├── TransactionTable.tsx# Interactive inline-editable transaction ledger with batch verify & export
│   │   ├── IntermediateModal.tsx# Deep-dive OCR quality, raw text, NER entities, fraud checks modal
│   │   ├── AnalyticsDashboard.tsx# Recharts P&L summary, Category Expense Pie, Crop Net Profit charts
│   │   ├── KnowledgeExplorer.tsx# Agricultural & Indic financial terms dictionary search
│   │   ├── SystemStatus.tsx    # System diagnostics, backend latency & API status
│   │   └── Toast.tsx           # Floating notification system
```

---

## Key Features & Visual Design Elements

### A. Dark Glassmorphic Design System (`index.css`)
- Cyan-to-Emerald glowing radial background orbs (`bg-orbs` animation).
- Subtle 50px grid background pattern (`bg-grid-pattern`).
- Glassmorphism backdrop-blur cards with glowing hover state (`glass-card`, `glass-card-interactive`).
- Custom scrollbars, glowing status pills, step badges (`badge-cyan`, `badge-emerald`, `badge-amber`).

### B. Animated 8-Stage Pipeline Visualizer (`PipelineDiagram.tsx`)
- Displays real-time progress across all 8 backend processing stages:
  1. 📷 Image Preprocessing & Contrast Enhancement
  2. 📝 Verbatim OCR Text Extraction (Tesseract / Indic OCR)
  3. 🌐 Indic Language Normalization (Hindi/Gujarati/Marathi transliteration)
  4. 🏷️ Named Entity Recognition (Dates, Amounts, Parties, Items)
  5. ⚖️ Financial Validation & Math Reconciliation
  6. 🛡️ Anomaly & Fraud Detection
  7. 📊 Double-Entry Accounting Conversion (Debit / Credit)
  8. ✅ Final Audit Verification
- Live stage execution status (idle, running, completed, warning).

### C. Interactive Ledger & Batch Verifier (`TransactionTable.tsx`)
- Inline editing of transaction fields (Date, Description, Amount, Category, Crop, Type).
- Confidence scores with color coding (>85% Green, 60-85% Amber, <60% Red).
- One-click batch verification and API sync (`POST /api/v1/transactions/verify`).
- Instant CSV export of verified transactions.

### D. Financial Analytics & Farm P&L (`AnalyticsDashboard.tsx`)
- Summary KPI Cards: Total Income (₹), Total Expense (₹), Net Farm P&L (₹), Total Notebooks Digitized, Audit Accuracy.
- Recharts visualizations: Expense breakdown pie chart, Crop profitability bar chart, Income vs Expense bar comparison.

### E. Indic Financial Dictionary (`KnowledgeExplorer.tsx`)
- Quick lookup for regional Bahi-Khata terms, crop names, units (Kattah, Quintal, Bora, Khad, Beej).

---

## Verification Plan

### Automated Build & Lint Verification
- Run `npm run build` in `frontend/` to confirm zero TypeScript compile or bundling errors.

### Manual & Functional Verification
1. Start FastAPI backend (`uvicorn main:app --reload` on port 8000).
2. Start React dev server (`npm run dev`) and test in browser.
3. Test notebook upload with sample handwritten Bahi-Khata images.
4. Verify 8-stage pipeline visualization updates correctly.
5. Verify transaction editing, batch verification, CSV export, and analytics chart loading.
