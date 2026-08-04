# 🧪 GramIQ Finance OCR - Postman API Testing Guide

This guide explains how to import, configure, and execute the **GramIQ Finance OCR Postman API Collection** (`GramIQ_Finance_OCR_APIs.postman_collection.json`).

---

## 🚀 Quick Start Guide

### 1. Import Collection into Postman
1. Open **Postman Desktop** or Web Client.
2. Click **Import** in the top-left corner.
3. Select `GramIQ_Finance_OCR_APIs.postman_collection.json` from `production/`.

### 2. Configure Environment Variables
Set the following collection variables:
- `baseUrl`: `https://gramiq-finance-ocr-backend.onrender.com` (or `http://localhost:8000` for local dev)
- `notebookId`: Dynamically populated after calling **Upload Bahi-Khata Image**
- `transactionId`: Dynamically populated after calling **Get Notebook Extracted Transactions**

---

## 📋 End-to-End Testing Workflow

```text
Step 1: Check System Health (GET /)
   │
Step 2: Upload Bahi-Khata Image (POST /api/v1/notebooks/upload)
   │ ➔ Copy returned `id` to {{notebookId}} variable
   ▼
Step 3: Trigger 3-Step OCR Pipeline (POST /api/v1/notebooks/process/{{notebookId}})
   │
Step 4: Poll Notebook Details (GET /api/v1/notebooks/{{notebookId}})
   │ ➔ Wait until status changes from 'Processing' to 'Complete'
   ▼
Step 5: Inspect Extracted Transactions (GET /api/v1/notebooks/{{notebookId}}/transactions)
   │
Step 6: Batch Verify Transactions (POST /api/v1/transactions/verify)
   │
Step 7: View Farm Analytics Summary (GET /api/v1/analytics/summary)
```

---

## 💬 WhatsApp Webhook Testing

To test the WhatsApp Bot webhook locally:
1. Start the WhatsApp Bot Server: `cd production/whatsapp-bot && npm start`
2. Run **WhatsApp Webhook Healthcheck** (`GET http://localhost:3001/health`)
3. Run **WhatsApp Inbound Text Webhook** (`POST http://localhost:3001/webhook` with body `{"object": "whatsapp_business_account", ...}`)
