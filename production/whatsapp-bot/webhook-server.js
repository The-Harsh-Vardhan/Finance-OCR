/**
 * GramIQ WhatsApp Bot Webhook Server
 * Express webhook handler for Meta Cloud API & Twilio WhatsApp requests
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const whatsappService = require('./whatsapp-service');
const GramIQFinanceClient = require('../javascript-api/api-client');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'gramiq_whatsapp_verify_token_2026';
const BACKEND_URL = process.env.GRAMIQ_BACKEND_URL || 'https://ledger-ocr-seven.vercel.app/api/ocr';

const client = new GramIQFinanceClient({ baseUrl: BACKEND_URL });

/**
 * Healthcheck route
 */
app.get('/health', async (req, res) => {
  const backendHealth = await client.getHealth();
  res.json({
    status: 'Online',
    service: 'GramIQ WhatsApp Bot',
    backend: backendHealth
  });
});

/**
 * GET /webhook: Meta Webhook Verification
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp Webhook verified successfully.');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.status(400).send('Missing verification parameters');
});

/**
 * POST /webhook: Handle Inbound WhatsApp Messages & Media
 */
app.post('/webhook', async (req, res) => {
  // Acknowledge Meta HTTP request immediately
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    // Check Meta Cloud API Payload Structure
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              await handleMetaMessage(message);
            }
          }
        }
      }
    } 
    // Check Twilio Payload Structure
    else if (req.body && req.body.From && req.body.Body !== undefined) {
      await handleTwilioMessage(req.body);
    }
  } catch (err) {
    console.error('❌ Error handling webhook event:', err.message);
  }
});

/**
 * Handle Meta Cloud API Inbound Messages
 */
async function handleMetaMessage(message) {
  const fromPhone = message.from;
  const msgType = message.type;

  console.log(`📩 Received WhatsApp message from ${fromPhone} (Type: ${msgType})`);

  if (msgType === 'image') {
    const mediaId = message.image.id;
    await processInboundImage(fromPhone, mediaId, 'meta');
  } else if (msgType === 'text') {
    const text = (message.text.body || '').trim();
    await handleTextCommand(fromPhone, text);
  } else {
    await whatsappService.sendMessage(
      fromPhone,
      '📷 Please send a photo of your Bahi-Khata (farm ledger notebook page) for financial OCR processing.'
    );
  }
}

/**
 * Handle Twilio Inbound Messages
 */
async function handleTwilioMessage(body) {
  const fromPhone = body.From;
  const mediaUrl = body.MediaUrl0;
  const text = (body.Body || '').trim();

  if (mediaUrl) {
    await processInboundImage(fromPhone, mediaUrl, 'twilio');
  } else if (text) {
    await handleTextCommand(fromPhone, text);
  }
}

/**
 * Download Inbound Image & Submit to GramIQ OCR Backend
 */
async function processInboundImage(fromPhone, mediaIdOrUrl, provider) {
  try {
    await whatsappService.sendMessage(
      fromPhone,
      '📸 *Image Received!* Processing your Bahi-Khata ledger using GramIQ AI OCR pipeline...'
    );

    let imageBuffer;
    let filename = `whatsapp_${Date.now()}.jpg`;

    if (provider === 'meta') {
      // 1. Fetch Media URL from Meta
      const mediaRes = await axios.get(`https://graph.facebook.com/v18.0/${mediaIdOrUrl}`, {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
      });
      const downloadUrl = mediaRes.data.url;
      // 2. Download Image Binary
      const imgRes = await axios.get(downloadUrl, {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
        responseType: 'arraybuffer'
      });
      imageBuffer = Buffer.from(imgRes.data);
    } else {
      const imgRes = await axios.get(mediaIdOrUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(imgRes.data);
    }

    // 3. Upload to Backend API
    const farmerId = `WA_${fromPhone.replace(/[^\d]/g, '')}`;
    const uploadRes = await client.uploadNotebook(imageBuffer, filename, farmerId);
    const notebookId = uploadRes.id;

    // 4. Trigger 3-Step Processing Pipeline
    await client.processNotebook(notebookId);

    // 5. Poll for completion asynchronously
    client.pollUntilComplete(
      notebookId,
      null,
      2000,
      120000
    ).then(async (completedNotebook) => {
      const transactions = await client.getNotebookTransactions(notebookId);
      const summaryMsg = whatsappService.formatLedgerSummaryResponse(completedNotebook, transactions);
      await whatsappService.sendMessage(fromPhone, summaryMsg);
    }).catch(async (err) => {
      console.error(`❌ OCR processing failed for notebook ${notebookId}:`, err.message);
      await whatsappService.sendMessage(
        fromPhone,
        `⚠️ *OCR Processing Failed*: ${err.message}. Please send a clearer, well-lit photo of the ledger.`
      );
    });

  } catch (err) {
    console.error('❌ Failed to process inbound image:', err.message);
    await whatsappService.sendMessage(
      fromPhone,
      `⚠️ Could not download or process image: ${err.message}`
    );
  }
}

/**
 * Handle Text Commands (SUMMARY, HELP, etc.)
 */
async function handleTextCommand(fromPhone, text) {
  const cmd = text.toUpperCase();

  if (cmd === 'SUMMARY' || cmd === 'ANALYTICS' || cmd === 'EXPENSES' || cmd === 'INCOME') {
    try {
      const analytics = await client.getAnalyticsSummary();
      const responseText = whatsappService.formatAnalyticsResponse(analytics);
      await whatsappService.sendMessage(fromPhone, responseText);
    } catch (err) {
      await whatsappService.sendMessage(fromPhone, `⚠️ Error fetching farm analytics: ${err.message}`);
    }
  } else if (cmd === 'HELP' || cmd === 'HI' || cmd === 'HELLO' || cmd === 'START') {
    let helpMsg = `🌾 *Welcome to GramIQ Farm Finance Assistant* 🌾\n\n`;
    helpMsg += `Here is how you can use this bot:\n`;
    helpMsg += ` 📸 *Send a photo*: Upload any Bahi-Khata (farm ledger) image to digitize transactions instantly.\n`;
    helpMsg += ` 📊 *Reply SUMMARY*: View overall income, expenses, crop profits & analytics.\n`;
    helpMsg += ` ❓ *Reply HELP*: View available commands.\n\n`;
    helpMsg += `GramIQ AI automatically translates Indic languages and extracts transaction rows directly into your ledger!`;
    await whatsappService.sendMessage(fromPhone, helpMsg);
  } else {
    // Search Knowledge Base or reply default
    try {
      const kbRes = await client.searchKnowledgeBase(text);
      if (kbRes && kbRes.results && kbRes.results.length > 0) {
        let reply = `🔍 *Farm Term Mapping found for "${text}":*\n\n`;
        kbRes.results.slice(0, 3).forEach((item) => {
          reply += ` • *${item.alias}* ➔ ${item.canonical_name} (${item.category})\n`;
        });
        reply += `\n💡 Upload a ledger photo or reply *SUMMARY* for financial analytics.`;
        return await whatsappService.sendMessage(fromPhone, reply);
      }
    } catch (_) {}

    await whatsappService.sendMessage(
      fromPhone,
      `📸 Send a Bahi-Khata photo to digitize transactions, or reply *SUMMARY* for farm analytics.`
    );
  }
}

app.listen(PORT, () => {
  console.log(`🚀 GramIQ WhatsApp Webhook Server listening on port ${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
});
