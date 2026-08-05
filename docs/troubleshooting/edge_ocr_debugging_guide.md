# 🛠️ Comprehensive Edge OCR Troubleshooting & Debugging Guide

This document captures all root causes, diagnostic steps, and resolutions for Vercel Edge OCR and Gemini LLM Vision issues in GramIQ Finance OCR.

---

## Table of Contents
1. [Authentication & Environment Variable Issues](#1-authentication--environment-variable-issues)
2. [Vercel 504 Gateway & Edge Timeout Errors](#2-vercel-504-gateway--edge-timeout-errors)
3. [Vertex AI vs Google AI Studio REST Schema Differences](#3-vertex-ai-vs-google-ai-studio-rest-schema-differences)
4. [LLM Response Parsing & Truncated JSON Repair](#4-llm-response-parsing--truncated-json-repair)
5. [Frontend & Backend Contract Alignment](#5-frontend--backend-contract-alignment)

---

## 1. Authentication & Environment Variable Issues

### Symptom: `400 INVALID_ARGUMENT (API_KEY_INVALID)`
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "INVALID_ARGUMENT",
    "reason": "API_KEY_INVALID"
  }
}
```

#### Causes & Fixes:
1. **OAuth Token Passed as API Key**: Google AI Studio API keys always start with `AIzaSy...`. OAuth access tokens start with `AQ.Ab8...` and cannot be passed to `x-goog-api-key`.
   - **Fix**: Remove `AQ...` token and generate a key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. **Multi-line `.env` Parsing Failure**: Multi-line raw JSON inside `.env` files breaks line-by-line `.env` parsers (e.g. `dotenv`), setting `GCP_SERVICE_ACCOUNT_JSON="{"`.
   - **Fix**: Collapse the JSON string to a single line:
     ```env
     GCP_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
     ```
   - **Alternative (Safest)**: Base64-encode the JSON file:
     ```powershell
     [Convert]::ToBase64String([System.IO.File]::ReadAllBytes('service_account.json'))
     ```
     Our code automatically decodes Base64 in `api/ocr.ts` via `atob()`.

---

## 2. Vercel 504 Gateway & Edge Timeout Errors

### Symptom: `HTTP 504 Edge OCR Error` or `The operation was aborted due to timeout`

#### Causes & Fixes:
1. **Short Fetch Timeout Ceiling**: Setting individual `fetch` timeouts too short (e.g. 6 seconds) cuts off Gemini Vision LLM processing mid-run on complex handwritten pages.
   - **Fix**: Set `AbortSignal.timeout(18000)` (18 seconds) for vision OCR generation calls.
2. **Unbounded Generation Budget**: Without `maxOutputTokens: 4096`, Gemini models may enter extended reasoning loops.
   - **Fix**: Specify `maxOutputTokens: 4096` in `generationConfig`.
3. **Cumulative Execution Budgeting**: Sequentially iterating through multiple failing model endpoints burns Vercel's 25-second Edge function limit.
   - **Fix**: Calculate dynamic remaining budget before starting subsequent requests:
     ```ts
     const elapsed = Date.now() - startTime;
     if (elapsed > 16000) break; // Exit loop if under 2s remaining
     const remainingBudget = Math.max(3000, 18000 - elapsed);
     ```

---

## 3. Vertex AI vs Google AI Studio REST Schema Differences

### Symptom: Vertex AI times out without outputting text or fails with schema errors

#### Root Cause:
- **Google AI Studio REST API (`generativelanguage.googleapis.com`)** uses `snake_case`:
  `inline_data`, `mime_type`, `response_mime_type`, `max_output_tokens`.
- **GCP Vertex AI REST API (`aiplatform.googleapis.com`)** strictly enforces `camelCase`:
  `inlineData`, `mimeType`, `responseMimeType`, `maxOutputTokens`.

If `inline_data` is sent to Vertex AI, GCP ignores the unrecognized field. Gemini receives **0 image bytes** and stalls trying to analyze an empty image.

#### Resolution:
Format the JSON payload conditionally based on the target engine:

```ts
const isVertex = ep.name.startsWith('Vertex');
const body = JSON.stringify({
  contents: [
    {
      role: 'user',
      parts: [
        { text: promptText },
        isVertex
          ? { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
          : { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
      ],
    },
  ],
  generationConfig: isVertex
    ? { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 4096 }
    : { response_mime_type: 'application/json', temperature: 0.1, max_output_tokens: 4096 },
});
```

---

## 4. LLM Response Parsing & Truncated JSON Repair

### Symptom: `Expected double-quoted property name in JSON` or `Vercel Edge OCR finished with 0 records`

#### Causes & Fixes:
1. **Deprecated Models**: `gemini-2.0-flash` returns HTTP 404 NOT_FOUND. Replace with `gemini-2.5-flash`.
2. **Nested Object Wrapping**: LLMs often wrap outputs in `{ "transactions": [...] }` or `{ "records": [...] }` instead of returning a root array `[...]`.
   - **Fix**: Implement unwrapping logic checking keys `transactions`, `data`, `records`, `items`, `entries`.
3. **Truncated JSON Recovery**: Truncated outputs leave open brackets `[` or `{`.
   - **Fix**: Implement automatic bracket-balancing repair in `parseResilientJson()` before parsing.

---

## 5. Frontend & Backend Contract Alignment

### Symptom: `Vercel Edge OCR returned no extracted transactions`

#### Cause:
Field naming mismatch between backend response payload and frontend state consumer.
- Backend API returned `{ data: [...] }`.
- Frontend looked for `edgeResult.transactions`.

#### Fix:
Return both properties in backend response and check both in frontend:

**Backend (`api/ocr.ts`):**
```ts
return new Response(
  JSON.stringify({
    success: true,
    engine: fulfilledEndpoint?.name,
    count: transactions.length,
    data: transactions,
    transactions: transactions,
  }),
  { status: 200 }
);
```

**Frontend (`App.tsx`):**
```ts
const extractedTxs = edgeResult?.transactions || edgeResult?.data;
if (extractedTxs && Array.isArray(extractedTxs)) {
  setTransactions(extractedTxs);
}
```

---

## 6. SOTA System Prompt Optimization & Indic Disambiguation Rules

### Common Issues Solved by SOTA Prompt Architecture:

1. **Hallucinated Expenses from Phone/Vehicle Numbers**:
   - **Problem**: 10-digit mobile numbers (e.g. `9822112233`) or vehicle numbers (e.g. `MH-31-1234`) written on margins were being parsed as `₹9.8B` amounts.
   - **Fix**: Added explicit exclusion rule: *"Do NOT parse 10-digit mobile phone numbers, vehicle numbers, or bank account numbers as amounts."*

2. **Duplicated Totals from Page Summary Rows**:
   - **Problem**: Notebook summary lines like *"एकूण / Total: ₹14,500"* or *"बाकी / Balance: ₹3,200"* were being extracted as individual expenses, doubling the total expense sum.
   - **Fix**: Added rule: *"Exclude page summary rows ('एकूण', 'Total', 'सर्व एकूण') and running balance rows ('बाकी', 'Balance', 'शिल्लक')."*

3. **Devanagari Numeral Misreads**:
   - **Problem**: Devanagari numerals (`२५००`, `१२००`) were misread or lost.
   - **Fix**: Explicit conversion rule in STEP 1: *"Convert Devanagari numerals (०-९) to Western digits (0-9)."*

4. **Regional Indic Unit Variations**:
   - **Problem**: Regional terms like `पोती`, `कट्टा`, `एकड`, `दिवस` remained un-standardized.
   - **Fix**: Prompt instructions + `UNIT_MAPPINGS` post-processing dictionary standardizes units to `bags`, `acres`, `days`, `quintal`, `liters`.

5. **In-Context Few-Shot Exemplar**:
   - **Fix**: Included an embedded few-shot input/output JSON example directly inside `SYSTEM_PROMPT` to maintain 0% schema format drift across all Gemini Flash models.

