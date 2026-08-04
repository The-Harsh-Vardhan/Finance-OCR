# 🛡️ GramIQ Finance OCR Production Guardrails & Safeguards

**Document Version:** `v1.0.0`  
**Target System:** GramIQ Bahi-Khata Ledger Digitization Backend & API Gateway  
**Target Audience:** Backend Engineers, Mobile Developers, QA, and DevOps Teams  

---

## 1. Overview & Core Philosophy

GramIQ Finance OCR processes handwritten Indian agricultural ledger pages (Bahi-Khata) containing mixed Indic languages (Hindi, Marathi, Gujarati, Punjabi, Hinglish), informal numerical notation, and custom crop/input terminology. 

To ensure **zero data loss**, **financial accuracy**, and **safe human-in-the-loop verification**, the system enforces strict operational guardrails across four boundaries:
1. **Input Validation & Image Quality Gate**
2. **AI Vision & Pipeline Processing Guardrails**
3. **Database & Data Integrity Safeguards**
4. **API Security & Network Rate Limits**

---

## 2. Input Validation & Image Quality Gate

### 2.1 Allowed Image Formats & Size Limits
- **Allowed MIME Types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`.
- **Max File Size:** `15 MB` per upload.
- **Min Dimensions:** `600px x 600px` (Images below 600px fail OCR character segmentation).
- **Client-Side Compression:** Mobile apps (Android/iOS) MUST compress ledger images to max `1600px` long edge and JPEG quality `85%` before uploading.

### 2.2 OpenCV Image Quality Score Gate
Before invoking expensive multimodal LLM calls (Gemini 2.5 Flash / Pro), the backend executes OpenCV pre-validation:
- **Blur Detection (Laplacian Variance):** If variance < `100.0`, flag image as blurry (`quality_score < 0.5`).
- **Brightness / Contrast Gate:** Mean pixel brightness must be between `40` and `220` (0-255 scale).
- **Abstention Flag:** If quality score < `0.35`, processing aborts immediately with status `Failed` and detail:
  > *"Image is too blurry or low contrast. Please capture a clear, well-lit photo of the ledger page."*

---

## 3. Pipeline & AI Guardrails

### 3.1 Unverified Transaction Lock
- Once a farmer or field agent verifies transactions for a notebook (`Transaction.verified = true`), re-running `/notebooks/process/{id}` is **STRICTLY BLOCKED** (returns `409 Conflict`).
- Prevents accidental overwriting of human-verified farm accounting data.

### 3.2 Indic Category Normalization
- All OCR extracted line items MUST map to standard agricultural categories:
  `Seeds`, `Fertilizers`, `Pesticides`, `Labor`, `Equipment & Fuel`, `Irrigation`, `Crop Sales`, `Government Subsidy`, `Miscellaneous`.
- If an extracted Indic term is unknown (e.g. `युरिया`, `मजुरी`), the system queries the `FarmKnowledgeBase` lookup table to resolve canonical category and subcategory automatically.

### 3.3 Financial Amount & Unit Guardrails
- **Amount Boundary:** Any transaction with amount > `₹10,000,000` (1 Crore) is flagged with `confidence_level: "Low"` for mandatory human review.
- **Negative Amounts:** Amounts cannot be negative. Type (`Income` vs `Expense`) determines financial directional sign.
- **Zero-Amount Fallback:** If amount parsing fails, set `amount: 0.0` and flag `verified: false`.

---

## 4. Database Integrity & Security

### 4.1 Row Level Security (RLS)
- PostgreSQL / Supabase tables (`public.notebooks`, `public.transactions`) enforce RLS policies allowing authenticated API services write access while restricting cross-tenant data exposure.

### 4.2 Cascading Deletion Safety
- Deleting a notebook record automatically cascades deletion to its child transaction records (`ON DELETE CASCADE`).

---

## 5. Security & Rate Limiting

### 5.1 API Rate Limits
- `/notebooks/upload`: Max `10 uploads / minute / IP`.
- `/notebooks/process/{id}`: Max `5 concurrent background pipeline executions / farmer_id`.
- `/analytics/summary`: Max `60 requests / minute`.

### 5.2 CORS Configuration
- Production backends must restrict `CORS_ORIGINS` to trusted mobile app schemes (`http://localhost`, `capacitor://`, `https://your-domain.com`).
