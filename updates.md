# 📢 Technical Update: Bill Header Date Extraction & Inheritance Fix

**Date**: August 5, 2026  
**Module**: AI Document Intelligence / OCR Pipeline (`api/ocr.ts`, `production/new/ocr.ts`, `backend/app/services/llm_parser.py`)  
**Status**: 🟢 Deployed to Dev / Ready for Review  

---

## 📌 Problem Overview

When processing printed or handwritten agricultural shop bills, vouchers, and receipts (e.g., **बारस्कर कृषि सेवा केन्द्र**), transaction rows were being extracted without dates (`"date": null`).

### Root Cause:
1. **Header Date vs Line Items**: Receipts feature the date **once at the header level** next to labels like `दिनांक 22/06/25`, while individual product rows (*Electron*, *Parquat*, *Apsa 80*, etc.) do not repeat the date.
2. **Missing Inheritance Instruction**: The AI system prompt was previously optimized for line-by-line Bahi-Khata entries (where every line starts with a date like `15/6 - Ramesh...`). It lacked rules to scan header metadata and propagate the bill date to all extracted rows.
3. **2-Digit Year Parsing**: Dates written with two-digit years (e.g., `22/06/25`) were not being consistently normalized into standard ISO `YYYY-MM-DD` (`2025-06-22`) format.

---

## 🛠️ Changes Implemented

### 1. Updated AI System Prompts ([api/ocr.ts](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/api/ocr.ts) & [production/new/ocr.ts](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/new/ocr.ts))
- **Header Date Detection & Propagation**: Instructed Gemini vision models to explicitly look for header date markers (`दिनांक`, `दि.`, `तारीख`, `Date:`, `Dt.`) and assign that date to all extracted line items on the bill.
- **Date Normalization**: Standardized 2-digit years (e.g., `22/06/25` $\rightarrow$ `2025-06-22` for `date`, preserving `raw_date: "22/06/25"`).
- **Printed Bill Exemplar**: Added a shop invoice few-shot example to guide Gemini on tabular bill formats.

### 2. Python Fallback OCR Regex Enhancements ([backend/app/services/llm_parser.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/llm_parser.py))
- Added `HEADER_DATE_RE` regex scan (`(?:दिनांक|दि\.|तारीख|Date|Dt\.?)\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})`).
- Ensured Tesseract local OCR fallback populates missing row dates with the document header date.

---

## 📁 Modified Files

| File Path | Description |
|-----------|-------------|
| [`api/ocr.ts`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/api/ocr.ts) | Vercel Edge API endpoint prompt & exemplar update |
| [`production/new/ocr.ts`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/production/new/ocr.ts) | Staging/Production Edge function update |
| [`backend/app/services/llm_parser.py`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/llm_parser.py) | FastAPI backend Gemini prompt & Tesseract fallback logic |

---

## 📊 Before vs. After Comparison

### Input Image Example:
> **Header**: बारस्कर कृषि सेवा केन्द्र | **दिनांक**: 22/06/25 | **क्रमांक**: 49  
> **Row 1**: (1) Electron 200ml x 1 - 500  
> **Row 2**: (2) Parquat 1lit x 2 - 600  

### ❌ Before (Missing Date):
```json
[
  {
    "line_number": 1,
    "ocr_text": "Electron 200ml x 1 - 500",
    "raw_date": null,
    "date": null,
    "amount": 500
  }
]
```

### ✅ After (Extracted & Inherited Date):
```json
[
  {
    "line_number": 1,
    "ocr_text": "1. Electron 200ml x 1 - 500",
    "raw_date": "22/06/25",
    "date": "2025-06-22",
    "vendor_person": "बारस्कर कृषि सेवा केन्द्र",
    "category": "Pesticide",
    "type": "Expense",
    "amount": 500
  },
  {
    "line_number": 2,
    "ocr_text": "2. Parquat 1lit x 2 - 600",
    "raw_date": "22/06/25",
    "date": "2025-06-22",
    "vendor_person": "बारस्कर कृषि सेवा केन्द्र",
    "category": "Pesticide",
    "type": "Expense",
    "amount": 600
  }
]
```

---

## 💬 Team Notification Template (Copy & Paste for Slack / WhatsApp)

```text
🚀 OCR Update: Fixed missing dates on Shop Bills & Receipts (e.g. Krishi Seva Kendra bills)!

What was fixed:
1. Bills with dates only at the top header (like "दिनांक 22/06/25") now automatically propagate the date to all line items.
2. 2-digit years (e.g., 22/06/25) are now cleanly normalized to ISO format (2025-06-22).
3. Both Vercel Edge functions and FastAPI Tesseract fallbacks have been updated with header date inheritance logic.

Modified files: api/ocr.ts, production/new/ocr.ts, backend/app/services/llm_parser.py
Details & breakdown documented in updates.md.
```
