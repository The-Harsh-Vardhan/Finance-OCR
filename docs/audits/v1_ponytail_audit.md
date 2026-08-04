# Ponytail Codebase Audit Report (v1)

**Audit Scope**: Whole-repository scan for over-engineering, dead code, hand-rolled stdlib patterns, and unnecessary abstractions across `frontend/`, `backend/`, and `api/`.

---

## Completed Audit Cuts (Applied in Commit `5b787d4`)

- `native:` **`google-generativeai` package**. Removed deprecated package in favor of standard `google-genai` SDK. [`backend/requirements.txt:L13`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/requirements.txt)
- `delete:` **`api-client.js` 7KB wrapper layer**. Inlined type-safe `req()` helper directly into [`api.ts`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/services/api.ts). [`frontend/src/services/api-client.js`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/services/api-client.js)
- `shrink:` **Regex Base64 Data URL parser**. Replaced regex replace with standard `.split(',').pop()`. [`frontend/api/ocr.ts:L111`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/api/ocr.ts#L111)

---

## Further Audit Opportunities (Ranked by Impact)

1. `shrink:` **Duplicate LLM fallback boilerplate across methods**. Extract single `_call_gemini_vision()` prompt helper. [`backend/app/services/llm_parser.py:L70-L140`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/services/llm_parser.py#L70-L140)
2. `yagni:` **Legacy static CORS origins helper logic**. Simplify `_parse_cors_origins` to a single list comprehension. [`backend/app/core/config.py:L14-L22`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/core/config.py#L14-L22)
3. `shrink:` **Duplicate database session commits across endpoints**. Use single `db.commit()` context manager. [`backend/app/api/v1/endpoints/notebooks.py:L45-L90`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/backend/app/api/v1/endpoints/notebooks.py#L45-L90)
4. `native:` **Custom HTML5 drag-and-drop state handlers**. Use standard HTML5 file input change handler. [`frontend/src/components/UploadStudio.tsx:L40-L65`](file:///c:/D%20Drive/Projects/Summers%202026/GramIQ%20Internship/Finance%20OCR/frontend/src/components/UploadStudio.tsx#L40-L65)

---

`net: -258 lines, -1 deps applied. (-45 additional lines possible).`
