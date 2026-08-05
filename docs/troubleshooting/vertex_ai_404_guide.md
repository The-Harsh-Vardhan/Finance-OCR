# 🛠️ Comprehensive Troubleshooting Guide: Resolving Vertex AI 404 NOT_FOUND Errors

This guide provides step-by-step resolution paths for the following error in your Vercel Edge OCR deployment:

```text
AI Vision OCR failed: Vertex AI vercel-wif (gemini-1.5-pro-001): 404 {
  "error": {
    "code": 404,
    "message": "Publisher model `projects/project-e308ba2a-3330-4ec4-b16/locations/us-central1/publishers/google/models/gemini-1.5-pro-001` was not found or your project does not have access to it. Ensure you are using a valid model name and that the model is available in the specified region."
  }
}
```

---

## 🎯 Quick Diagnosis: What Causes This Error?

1. **Missing Google AI Studio API Key**: Neither `GEMINI_API_KEY` in Vercel Environment Variables nor `api_key` in the UI Settings modal was found, forcing the app to attempt Google Cloud Vertex AI via Workload Identity Federation (WIF).
2. **Vertex AI API Disabled in GCP**: Project `project-e308ba2a-3330-4ec4-b16` does not have the **Vertex AI API** (`aiplatform.googleapis.com`) enabled.
3. **Model Garden Access Not Granted**: The specific publisher model (e.g., `gemini-2.0-flash-001` or `gemini-1.5-pro-001`) has not been accepted/enabled under Model Garden for region `us-central1`.
4. **Missing IAM Permissions**: The WIF Service Account lacks the **`roles/aiplatform.user`** (Vertex AI User) permission.

---

## 🚀 Solution Path 1: 10-Second Fix (Use Google AI Studio Key)

*Recommended for 99% of deployments — bypasses GCP IAM & Model Garden configuration entirely.*

1. **Generate a Free API Key**:
   - Go to [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/app/apikey).
   - Click **Create API key**.

2. **Option A: Save in Web App Settings (No Re-deploy Required)**:
   - Open your live site: `https://ledger-ocr-seven.vercel.app/`.
   - Click the **Settings (⚙️)** gear icon in the top header.
   - Paste your API key into the **Google AI Studio API Key** field.
   - Click **Save Credentials**.

3. **Option B: Add to Vercel Environment Variables**:
   - Open [Vercel Dashboard → Project Settings → Environment Variables](https://vercel.com/my-projects-hv/ledger-ocr/settings/environment-variables).
   - Add a new variable:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: `your_api_key_here`
     - **Environments**: Production, Preview, Development.
   - Click **Save**, then trigger a redeploy.

---

## 🏢 Solution Path 2: Google Cloud Vertex AI & WIF Fix

*Follow these steps if you explicitly require enterprise Google Cloud Vertex AI authentication.*

### Step 1: Enable Vertex AI API in GCP Console
1. Open the [GCP API Library for Vertex AI](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=project-e308ba2a-3330-4ec4-b16).
2. Ensure project **`project-e308ba2a-3330-4ec4-b16`** is selected in the top bar.
3. Click the blue **Enable** button.

### Step 2: Accept Model Access in Model Garden
1. Go to [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden?project=project-e308ba2a-3330-4ec4-b16).
2. Search for **Gemini 2.0 Flash** and **Gemini 1.5 Pro**.
3. Click on the model cards and ensure access is enabled for region **`us-central1`**.

### Step 3: Grant IAM Permissions to WIF Pool / Service Account
1. Open [GCP IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=project-e308ba2a-3330-4ec4-b16).
2. Locate your WIF Service Account or Pool Principal (`gramiq-vercel-pool` / `533162648452`).
3. Click **Edit Principal** (pencil icon).
4. Click **Add Another Role** and add:
   - **`Vertex AI User`** (`roles/aiplatform.user`)
5. Click **Save**.

---

## ⚡ Solution Path 3: Verify Endpoint Code Model Fallback

Ensure `api/ocr.ts` maps exact version suffixes for Vertex AI endpoints vs plain model names for Google AI Studio:

```typescript
// AI Studio Models (Direct API Key):
const aiStudioModels = [
  'gemini-2.0-flash-thinking-exp',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

// Vertex AI Models (GCP Publisher Version Suffixes):
const vertexModels = [
  'gemini-2.0-flash-001',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-001',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro-001'
];
```

---

## 📊 Summary Checksheet

| Problem Area | Check Item | Fix Action |
| :--- | :--- | :--- |
| **API Credentials** | `GEMINI_API_KEY` present? | Add key in UI Settings (⚙️) or Vercel Environment Variables. |
| **GCP API Status** | Is `aiplatform.googleapis.com` enabled? | Click **Enable** in GCP API Library. |
| **Model Access** | Are Gemini models active in `us-central1`? | Accept terms in Vertex AI Model Garden. |
| **GCP IAM** | Does principal have `roles/aiplatform.user`? | Grant **Vertex AI User** role in IAM & Admin. |
