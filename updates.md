# 📢 Technical Update: Bill Date Extraction, Category Mismatch & UI Binding Fixes

**Date**: August 5, 2026  
**Module**: AI Document Intelligence & Frontend Ledger Table (`api/ocr.ts`, `production/new/ocr.ts`, `backend/app/services/llm_parser.py`, `frontend/src/components/TransactionTable.tsx`, `farm_knowledge_base.py`)  
**Status**: 🟢 Fixed & Deployed to Dev  

---

## 📌 Problem Overview & Root Cause Analysis

### 1. Missing Bill Header Dates (`dd-mm-yyyy` in UI)
- **Root Cause A**: Shop receipts (e.g., **बारस्कर कृषि सेवा केन्द्र**) feature the date **once at the header** (`दिनांक 22/06/25`), while itemized product rows (*Electron*, *Parquat*, *Apsa 80*, *Straygain*) do not repeat the date. The prompt was missing explicit rules to propagate header dates across table rows.
- **Root Cause B (Property Key Mismatch)**: Backend/Edge endpoints returned `{ "date": "2025-06-22", "raw_date": "22/06/25" }`, but `<TransactionTable />` expected `row.transaction_date`. Because `transaction_date` was `undefined`, `<input type="date">` received `""`.
- **Root Cause C (HTML5 Date Input Standard)**: `<input type="date">` strictly requires `YYYY-MM-DD` (e.g. `2025-06-22`). Non-ISO strings (`22/06/25`) caused browsers to render the empty `dd-mm-yyyy` placeholder.

### 2. Category Mismatches (`Labor (मजदूरी)` Displayed for Pesticides)
- **Root Cause A (HTML `<select>` Default Fallback)**: Gemini returned `"Pesticide"` (singular), but the UI dropdown had `<option value="Pesticides">` (plural). When an HTML `<select value="...">` encounters an unmatched value, browser default behavior is to **select Option #1 in the DOM list**, which was previously `<option value="Labor">Labor (मजदूरी)</option>`.
- **Root Cause B (Unregistered Brand Terms)**: Regional pesticide brand names (`Electron`, `Paraquat`, `Apsa 80`, `Straygain`) were not explicitly defined in the domain dictionary.

---

## 🛠️ Summary of Fixes Applied

### 1. Frontend Table Component ([TransactionTable.tsx](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/TransactionTable.tsx))
- **ISO Date Formatter**: Formats `DD/MM/YYYY` or `DD/MM/YY` (e.g., `22/06/25`) into standard `YYYY-MM-DD` (`2025-06-22`) for HTML5 `<input type="date">`, displaying **`22-06-2025`** cleanly.
- **Non-Specific Default Option**: Moved **`Misc (विविध)`** to **Option #1** in the category dropdown DOM list. Any unmapped or unknown OCR entries will default to non-specific `Misc (विविध)` rather than a specific category like `Labor` or `Pesticides`.
- **Fuzzy Category Mapping**: Added `<select value={...}>` normalization so `"Pesticide"`, `"Pesticides"`, `"insecticide"`, `"herbicide"`, `"fungicide"`, `"spray"`, `"कीटनाशक"` cleanly map to the **Pesticides (कीटनाशक)** dropdown item.
- **Manual Entry Default**: Updated manual entry (`+ Add Manual Entry`) category default from `Labor` to `Misc`.

### 2. Backend Knowledge Base ([farm_knowledge_base.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/farm_knowledge_base.py) & [llm_parser.py](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/llm_parser.py))
- **Header Date Propagation & 2-Digit Year Parsing**: System prompts and Python regex fallbacks now scan for header dates (`दिनांक`, `दि.`, `तारीख`, `Date:`, `Dt.`) and propagate them to item rows while converting 2-digit years (`22/06/25` $\rightarrow$ `2025-06-22`).
- **Brand Term Dictionary**: Expanded `TERM_MAPPINGS` with `electron`, `paraquat`/`parquat`, `apsa`, `straygain`/`stroygain`, `coragen` $\rightarrow$ `("Pesticide", "Insecticide/Herbicide")`.

---

## 🔍 Detailed Code Changes Made to `ocr.ts` (`api/ocr.ts` & `production/new/ocr.ts`)

Yes! Significant improvements were made directly inside **`ocr.ts`**. Here is the exact breakdown of changes:

### Change 1: Added Header Date Extraction & Inheritance Rules to `SYSTEM_PROMPT`
Added Rules #4 and #5 along with a printed bill Few-Shot Exemplar:
```typescript
CRITICAL DISAMBIGUATION RULES:
...
4. HEADER DATE EXTRACTION & INHERITANCE: On bills, receipts, or shop invoices (e.g., 'बारस्कर कृषि सेवा केन्द्र'), extract header-level dates marked by 'दिनांक', 'दि.', 'तारीख', 'Date:', 'Dt.', etc. (e.g., 'दिनांक 22/06/25'). Propagate this bill header date to ALL extracted transaction lines from the bill if individual rows do not specify line dates.
5. DATE NORMALIZATION: Standardize dates into full ISO 'YYYY-MM-DD' format. Convert 2-digit years (e.g. '22/06/25' or '22-06-25') to '2025-06-22'. Keep the verbatim text string in 'raw_date' (e.g. '22/06/25').

Exemplar 2 (Printed Bill with Header Date):
Input: "बारस्कर कृषि सेवा केन्द्र | दिनांक 22/06/25 | क्रमांक 49 | श्रीमान Rahul Verma | (1) Electron 200ml x 1 - 500"
Output: [
  {
    "line_number": 1,
    "ocr_text": "1. Electron 200ml x 1 - 500",
    "description_en": "Purchase of Electron 200ml (1 unit)",
    "description": "Electron 200ml x 1 500",
    "raw_date": "22/06/25",
    "date": "2025-06-22",
    "category": "Pesticide",
    "subcategory": "Insecticide",
    "crop": "General",
    "type": "Expense",
    "vendor_person": "बारस्कर कृषि सेवा केन्द्र",
    "payment_mode": "Cash",
    "quantity": 1,
    "unit_price": 500,
    "amount": 500,
    "unit": "packets",
    "confidence": 0.95
  }
]
```

### Change 2: Expanded `TERM_MAPPINGS` in `ocr.ts` with Agrochemical Brands
Added regional Indian farm bill brand terms directly into `TERM_MAPPINGS`:
```typescript
const TERM_MAPPINGS: Record<string, [string, string]> = {
  ...
  "electron": ["Pesticide", "Insecticide (Electron)"],
  "paraquat": ["Pesticide", "Herbicide (Paraquat)"],
  "parquat": ["Pesticide", "Herbicide (Paraquat)"],
  "apsa": ["Pesticide", "Adjuvant (Apsa 80)"],
  "straygain": ["Pesticide", "Plant Growth Regulator"],
  "stroygain": ["Pesticide", "Plant Growth Regulator"],
  "coragen": ["Pesticide", "Insecticide (Coragen)"],
  "pesticide": ["Pesticide", "General Pesticide"],
  "insecticide": ["Pesticide", "Insecticide"],
  "fungicide": ["Pesticide", "Fungicide"],
  "herbicide": ["Pesticide", "Herbicide"],
  ...
};
```

### Change 3: Post-Processing ISO Date Converter & `transaction_date` Assignment
Updated the post-processing loop in `ocr.ts` to convert slash dates (`22/06/25`) to standard ISO `YYYY-MM-DD` (`2025-06-22`) and populate `item.transaction_date`:
```typescript
// Post-process normalization (Date & Categories & Indic Unit Normalization)
transactions = transactions.map((item: any) => {
  // Normalize & harmonize date fields for frontend (transaction_date property in YYYY-MM-DD format)
  let dStr = item.transaction_date || item.date || item.raw_date || '';
  if (dStr && typeof dStr === 'string') {
    const m = dStr.trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (m) {
      let [, day, month, year] = m;
      if (year.length === 2) year = `20${year}`;
      dStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  item.transaction_date = dStr;
  item.date = dStr;
  ...
```

---

## 📜 Full Updated System Prompt (Copy & Paste Ready)

```text
You are a world-class AI Document Intelligence system specialized in digitizing handwritten and printed Indian farming notebooks (Bahi-Khata), bills, receipts, and invoices.

Process the document image strictly in 3 sequential steps for each entry:
STEP 1 [OCR]: Read and transcribe all handwritten and printed text verbatim top-to-bottom. Convert Devanagari numerals (०-९) to Western digits (0-9). Expand Indic shortcuts ('ता.'/'दिनांक'->Date, 'रु.'/'₹'->Amount, 'ली.'->Liters, 'कि.'->kg). Ignore crossed-out text.
STEP 2 [Translate & Split]: Translate local Indic text (Marathi/Hindi) into clear English. Split multi-item lines into separate transaction objects.
STEP 3 [Categorize & Normalize]: Map 'जमा'/'आवक' to type='Income', and 'नावे'/'उधार'/'खर्च' to type='Expense'. Normalize units ('पोती'/'कट्टा'->'bags', 'एकड'/'गुंठा'->'acres', 'दिवस'/'रोज'->'days', 'क्विंटल'->'quintal'). Extract vendor/person name and payment mode (Cash/Credit/UPI).

CRITICAL DISAMBIGUATION RULES:
1. Return [] if the image is non-financial, blank, or completely unreadable.
2. Do NOT parse 10-digit mobile phone numbers, vehicle numbers (e.g. MH-31-1234), or bank account numbers as amounts.
3. Exclude page summary rows ('एकूण', 'Total', 'सर्व एकूण') and running balance rows ('बाकी', 'Balance', 'शिल्लक').
4. HEADER DATE EXTRACTION & INHERITANCE: On bills, receipts, or shop invoices (e.g., 'बारस्कर कृषि सेवा केन्द्र'), extract header-level dates marked by 'दिनांक', 'दि.', 'तारीख', 'Date:', 'Dt.', etc. (e.g., 'दिनांक 22/06/25'). Propagate this bill header date to ALL extracted transaction lines from the bill if individual rows do not specify line dates.
5. DATE NORMALIZATION: Standardize dates into full ISO 'YYYY-MM-DD' format. Convert 2-digit years (e.g. '22/06/25' or '22-06-25') to '2025-06-22'. Keep the verbatim text string in 'raw_date' (e.g. '22/06/25').

FEW-SHOT EXEMPLARS:
Exemplar 1 (Bahi-Khata Notebook Line):
Input: "15/6 - रमेश मजुरी २ दिवस १०००"
Output: [
  {
    "line_number": 1,
    "ocr_text": "15/6 - रमेश मजुरी २ दिवस १०००",
    "description_en": "Labor payment to Ramesh for 2 days",
    "description": "रमेश मजुरी २ दिवस १०००",
    "raw_date": "15/6",
    "date": "2024-06-15",
    "category": "Labour",
    "subcategory": "Daily Wage",
    "crop": "General",
    "type": "Expense",
    "vendor_person": "Ramesh",
    "payment_mode": "Cash",
    "quantity": 2,
    "unit_price": 500,
    "amount": 1000,
    "unit": "days",
    "confidence": 0.98
  }
]

Exemplar 2 (Printed Bill with Header Date):
Input: "बारस्कर कृषि सेवा केन्द्र | दिनांक 22/06/25 | क्रमांक 49 | श्रीमान Rahul Verma | (1) Electron 200ml x 1 - 500"
Output: [
  {
    "line_number": 1,
    "ocr_text": "1. Electron 200ml x 1 - 500",
    "description_en": "Purchase of Electron 200ml (1 unit)",
    "description": "Electron 200ml x 1 500",
    "raw_date": "22/06/25",
    "date": "2025-06-22",
    "category": "Pesticide",
    "subcategory": "Insecticide",
    "crop": "General",
    "type": "Expense",
    "vendor_person": "बारस्कर कृषि सेवा केन्द्र",
    "payment_mode": "Cash",
    "quantity": 1,
    "unit_price": 500,
    "amount": 500,
    "unit": "packets",
    "confidence": 0.95
  }
]

Return ONLY a raw JSON array of transaction objects:
[
  {
    "line_number": 1,
    "ocr_text": "Verbatim OCR text transcribed from image",
    "description_en": "English translation or normalized interpretation",
    "description": "Original transcription text",
    "raw_date": "Original date string from image",
    "date": "YYYY-MM-DD or DD/MM/YYYY or null if missing",
    "category": "Fertilizer | Pesticide | Labour | Machinery | Sales | Seeds | Irrigation | Transport | Miscellaneous",
    "subcategory": "Subcategory name or null",
    "crop": "Cotton | Soybean | Sugarcane | Wheat | Gram | Paddy | General",
    "type": "Expense | Income",
    "vendor_person": "Person or vendor name or null",
    "payment_mode": "Cash | Credit | UPI | Unknown",
    "quantity": 1,
    "unit_price": 0,
    "amount": 0,
    "unit": "kg | bags | acres | days | hours | quintal | packets | liters | null",
    "confidence": 0.95
  }
]
```

---

## 💬 Team Notification Template (Copy & Paste for Slack / WhatsApp)

```text
🚀 OCR Update: Fixed Bill Date Inheritance, ISO Formatting & Category Mismatches!

What was fixed:
1. Header dates on shop bills (e.g. "दिनांक 22/06/25") now propagate across all product rows and format as ISO YYYY-MM-DD (2025-06-22) for clean UI date input display.
2. Agrochemical brands (Electron, Paraquat, Apsa 80, Straygain) are now recognized as Pesticides in ocr.ts and backend.
3. Dropdown fallback reordered to non-specific 'Misc (विविध)' so unmapped items don't falsely show as Labor.

Modified files:
- api/ocr.ts
- production/new/ocr.ts
- frontend/src/components/TransactionTable.tsx
- backend/app/services/llm_parser.py
- backend/app/services/farm_knowledge_base.py
```
