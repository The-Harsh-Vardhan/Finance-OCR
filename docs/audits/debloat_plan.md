# ✂️ Ponytail Debloat Plan: Finance OCR (AI Studio API Key Focus)

> **Auditor Note**: Since the application is using the **Google AI Studio API Key** directly (linked to GCP Billing), all Workload Identity Federation (WIF) token exchanges, RSA key parsers, Service Account JWT signers, and Render deployment fallbacks are **100% redundant over-engineering (YAGNI)**.

---

## 🔍 Ranked Debloat Findings

1. `delete:` `frontend/api/` directory (`frontend/api/ocr.ts`, `frontend/api/vertex-auth.ts`). Duplicate copy of root `/api` functions never executed by Vercel. **[path: `frontend/api/`]**
2. `delete:` `api/vertex-auth.ts`. 284 lines of Workload Identity Federation (WIF) OIDC token exchange, RSA key signers, and GCP STS handlers. Unnecessary with `GEMINI_API_KEY`. **[path: `api/vertex-auth.ts`]**
3. `delete:` `frontend/app.py`. 16,911 bytes of legacy Python frontend script. React/Vite app in `frontend/src` is the active frontend. **[path: `frontend/app.py`]**
4. `delete:` `render.yaml` & `backend/deploy_render.py`. Scaffolding for Render backend polling, completely obsolete on Vercel Edge Serverless. **[path: `render.yaml`, `backend/deploy_render.py`]**
5. `shrink:` `api/ocr.ts`. Reduce 283 lines of complex Vertex/WIF model location fallback loops to a clean ~45-line AI Studio handler using `generativelanguage.googleapis.com`. **[path: `api/ocr.ts`]**

---

## 🛠️ Detailed Debloat Action Items

### 1. Remove Root `api/vertex-auth.ts` & `frontend/api/` Duplicates
- **Files to Delete**:
  - `api/vertex-auth.ts`
  - `frontend/api/ocr.ts`
  - `frontend/api/vertex-auth.ts`
- **Lines Removed**: ~580 lines.

### 2. Streamline Root `api/ocr.ts` (From 283 lines to ~45 lines)
- **Current Flow**: Generates WIF token -> Tries 9 Vertex AI models across `global` & `us-central1` -> Fallbacks to AI Studio.
- **Debloated Flow**:
  1. Retrieve `apiKey` from `req.body` or `process.env.GEMINI_API_KEY`.
  2. Call `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}` directly.
  3. Parse JSON response and return structured transaction array.

### 3. Remove Legacy Python & Deployment Scaffolding
- **Files to Delete**:
  - `frontend/app.py`
  - `render.yaml`
  - `backend/deploy_render.py`

---

## 📊 Estimated Impact Summary

```text
net: -910 lines of code, -4 unused files, 0 external auth dependencies.
Result: 100% Lean Vercel Edge Serverless OCR powered directly by AI Studio API Key.
```
