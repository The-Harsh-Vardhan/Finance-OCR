# GramIQ WhatsApp Bot Production Integration

This directory contains the production WhatsApp Bot Webhook Service for **GramIQ Finance OCR**. It enables farmers and agricultural workers to submit photos of handwritten Bahi-Khata ledgers directly over WhatsApp, trigger automated AI digitization, and query financial analytics.

---

## 🌟 Key Features

1. **Inbound Photo OCR**: Send any farm ledger photo via WhatsApp → receive receipt summary with extracted income/expenses, confidence scores, and totals.
2. **Interactive Commands**: Reply `SUMMARY`, `EXPENSES`, or `ANALYTICS` to fetch real-time farm P&L reports directly in WhatsApp.
3. **Indic Term Search**: Query agricultural terms (e.g. `खात`, `बियाणे`, `मजुरी`) to see canonical categories.
4. **Dual Provider Support**: Native integration with **Meta WhatsApp Cloud API** and **Twilio WhatsApp API**.

---

## 🚀 Environment & Configuration Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Configure Variables:

```env
PORT=3001
NODE_ENV=production
GRAMIQ_BACKEND_URL=https://gramiq-finance-ocr-backend.onrender.com/api/v1

# Meta WhatsApp Cloud API Setup
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_ACCESS_TOKEN=EAAG...YOUR_PERMANENT_META_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Provider Mode ('meta' or 'twilio')
PROVIDER=meta
```

---

## 📦 Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start webhook server
npm start
```

---

## 🔗 Meta Cloud API Webhook Verification

1. Go to **Meta for Developers Console** -> **WhatsApp** -> **Configuration**.
2. Set Webhook Callback URL: `https://your-domain.com/webhook`
3. Set Verify Token: matches `WHATSAPP_VERIFY_TOKEN` in your `.env`.
4. Subscribe to `messages` Webhook field.

---

## 📱 Supported WhatsApp User Flow

```
User (WhatsApp) ──> Photo (Bahi-Khata Ledger) ──> Webhook Server
                                                         │
                                               Uploads to GramIQ Backend
                                                         │
                                               Triggers 3-Step Pipeline (OCR->Trans->Cat)
                                                         │
User (WhatsApp) <── Formatted Receipt Summary <── Pipeline Completes
```
