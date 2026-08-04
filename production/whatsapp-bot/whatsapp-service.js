/**
 * GramIQ WhatsApp Service Client
 * Handles Meta Cloud API / Twilio messaging & receipt formatting
 */

const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.provider = process.env.PROVIDER || 'meta';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
  }

  /**
   * Send text message to a WhatsApp user
   */
  async sendMessage(toPhone, text) {
    if (this.provider === 'twilio') {
      return await this._sendTwilioMessage(toPhone, text);
    }
    return await this._sendMetaMessage(toPhone, text);
  }

  async _sendMetaMessage(toPhone, text) {
    if (!this.accessToken || !this.phoneNumberId) {
      console.log(`[WhatsApp Mock Send to ${toPhone}]:\n${text}`);
      return { success: true, mock: true };
    }

    const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    const cleanPhone = toPhone.replace(/[^\d]/g, '');

    try {
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: text }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (err) {
      console.error('[WhatsApp Service Error]:', err.response?.data || err.message);
      throw err;
    }
  }

  async _sendTwilioMessage(toPhone, text) {
    if (!this.twilioSid || !this.twilioAuthToken) {
      console.log(`[Twilio Mock Send to ${toPhone}]:\n${text}`);
      return { success: true, mock: true };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`);
    params.append('From', this.twilioNumber);
    params.append('Body', text);

    const auth = Buffer.from(`${this.twilioSid}:${this.twilioAuthToken}`).toString('base64');
    const res = await axios.post(url, params.toString(), {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return res.data;
  }

  /**
   * Format digitized transactions into a clean, WhatsApp receipt message
   */
  formatLedgerSummaryResponse(notebook, transactions) {
    let msg = `🌾 *GramIQ Bahi-Khata Digitization Result* 🌾\n`;
    msg += `------------------------------------\n`;
    msg += `📄 *Notebook ID:* \`${notebook.id.substring(0, 8)}\`...\n`;
    msg += `📊 *Quality Score:* ${notebook.quality_score ? (notebook.quality_score * 100).toFixed(1) + '%' : 'N/A'}\n`;
    msg += `------------------------------------\n\n`;

    if (!transactions || transactions.length === 0) {
      msg += `⚠️ No distinct transactions detected in this image.\n`;
      return msg;
    }

    let totalIncome = 0;
    let totalExpense = 0;

    msg += `📝 *Extracted Transactions (${transactions.length}):*\n\n`;

    transactions.forEach((tx, idx) => {
      const icon = tx.type === 'Income' ? '🟢' : '🔴';
      const amountStr = `₹${tx.amount.toLocaleString('en-IN')}`;
      if (tx.type === 'Income') totalIncome += tx.amount;
      else totalExpense += tx.amount;

      msg += `${idx + 1}. ${icon} *${tx.description}*\n`;
      msg += `   └ Amount: *${amountStr}* (${tx.type})\n`;
      msg += `   └ Category: ${tx.category}${tx.crop ? ' | Crop: ' + tx.crop : ''}\n`;
      if (tx.transaction_date) {
        msg += `   └ Date: ${tx.transaction_date}\n`;
      }
      msg += `\n`;
    });

    const netProfit = totalIncome - totalExpense;
    msg += `------------------------------------\n`;
    msg += `🟢 *Total Income:* ₹${totalIncome.toLocaleString('en-IN')}\n`;
    msg += `🔴 *Total Expense:* ₹${totalExpense.toLocaleString('en-IN')}\n`;
    msg += `💰 *Net Profit/Loss:* ${netProfit >= 0 ? '🟢 +₹' : '🔴 -₹'}${Math.abs(netProfit).toLocaleString('en-IN')}\n`;
    msg += `------------------------------------\n`;
    msg += `\n💡 Reply *SUMMARY* for overall farm finance dashboard.`;

    return msg;
  }

  /**
   * Format overall financial analytics into WhatsApp message
   */
  formatAnalyticsResponse(analytics) {
    let msg = `📊 *GramIQ Farm Finance Overall Summary* 📊\n`;
    msg += `------------------------------------\n`;
    msg += `📓 *Total Notebooks Digitized:* ${analytics.total_notebooks}\n`;
    msg += `📝 *Total Transactions:* ${analytics.total_transactions}\n`;
    msg += `✅ *Verified:* ${analytics.verified_transactions} | ⏳ *Pending:* ${analytics.unverified_transactions}\n`;
    msg += `------------------------------------\n\n`;

    msg += `🟢 *Total Income:* ₹${analytics.total_income.toLocaleString('en-IN')}\n`;
    msg += `🔴 *Total Expenses:* ₹${analytics.total_expenses.toLocaleString('en-IN')}\n`;
    msg += `💵 *Net Farm P&L:* ${analytics.net_profit_loss >= 0 ? '🟢 +₹' : '🔴 -₹'}${Math.abs(analytics.net_profit_loss).toLocaleString('en-IN')}\n\n`;

    if (analytics.category_breakdown && analytics.category_breakdown.length > 0) {
      msg += `📌 *Top Expense Categories:*\n`;
      analytics.category_breakdown.slice(0, 5).forEach((cat) => {
        msg += ` • ${cat.category}: ₹${cat.total_amount.toLocaleString('en-IN')} (${cat.percentage}%)\n`;
      });
      msg += `\n`;
    }

    if (analytics.crop_breakdown && analytics.crop_breakdown.length > 0) {
      msg += `🌾 *Crop Profitability Breakdown:*\n`;
      analytics.crop_breakdown.forEach((crop) => {
        msg += ` • *${crop.crop}*: Net ${crop.net_profit >= 0 ? 'Profit +₹' : 'Loss -₹'}${Math.abs(crop.net_profit).toLocaleString('en-IN')}\n`;
      });
    }

    return msg;
  }
}

module.exports = new WhatsAppService();
