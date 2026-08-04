# Ponytail Codebase Audit Report (v1)

**Audit Scope**: Whole-repository scan for over-engineering, dead code, hand-rolled stdlib patterns, and unnecessary abstractions across `frontend/`, `backend/`, and `api/`.

---

## Completed Audit Cuts (Applied in Commits `5b787d4` & `Current`)

- `native:` **`google-generativeai` package**. Removed deprecated package in favor of standard `google-genai` SDK. [`backend/requirements.txt:L13`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/requirements.txt)
- `delete:` **`api-client.js` 7KB wrapper layer**. Inlined type-safe `req()` helper directly into [`api.ts`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/services/api.ts). [`frontend/src/services/api-client.js`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/services/api-client.js)
- `shrink:` **Regex Base64 Data URL parser**. Replaced regex replace with standard `.split(',').pop()`. [`frontend/api/ocr.ts:L111`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/api/ocr.ts#L111)
- `yagni:` **Legacy static CORS origins helper logic**. Simplified `_parse_cors_origins` to single list comprehension. [`backend/app/core/config.py:L14`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/core/config.py#L14)
- `shrink:` **Compact `UNIT_MAP` dictionary**. Reduced dictionary boilerplate in [`llm_parser.py:L51`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/llm_parser.py#L51).
- `shrink:` **Extracted `_get_notebook()` helper**. Eliminated repetitive database query & 404 exception handling in [`notebooks.py:L43`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/api/v1/endpoints/notebooks.py#L43).

---

## Status

**Lean already. Ship.**

---

`net: -282 lines, -1 dep applied.`
