/**
 * GramIQ Finance OCR - Production API Client Implementation
 * Works in Android WebViews, React Native, Node.js, and Browser environments.
 */

class GramIQFinanceClient {
  /**
   * @param {Object} [config]
   * @param {string} [config.baseUrl] Backend URL (e.g. https://gramiq-backend.onrender.com/api/v1)
   * @param {number} [config.timeoutMs] Default request timeout in milliseconds (default: 30000)
   * @param {string} [config.farmerId] Default farmer identifier (default: FARMER_DEFAULT)
   */
  constructor(config = {}) {
    const rawUrl = config.baseUrl || 
      (typeof process !== 'undefined' && process.env && process.env.GRAMIQ_BACKEND_URL) || 
      'https://ledger-ocr-seven.vercel.app/api/ocr';
    
    this.baseUrl = this._sanitizeBaseUrl(rawUrl);
    this.timeoutMs = config.timeoutMs || 30000;
    this.defaultFarmerId = config.farmerId || 'FARMER_DEFAULT';
  }

  _sanitizeBaseUrl(url) {
    const clean = (url || '').trim().replace(/\/+$/, '');
    if (clean.endsWith('/api/v1')) return clean;
    return `${clean}/api/v1`;
  }

  setBaseUrl(url) {
    this.baseUrl = this._sanitizeBaseUrl(url);
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const timeoutMs = options.timeoutMs || this.timeoutMs;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      signal: controller ? controller.signal : undefined,
    };

    if (options.body) {
      if (options.body instanceof FormData || options.isFormData) {
        fetchOptions.body = options.body;
      } else {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(options.body);
      }
    }

    try {
      const response = await fetch(url, fetchOptions);
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetail = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errJson = await response.json();
          errDetail = errJson.detail || errJson.message || errDetail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      if (response.status === 204) return null;
      return await response.json();
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
      }
      throw err;
    }
  }

  /**
   * Healthcheck endpoint to test system and database connectivity
   */
  async getHealth() {
    const base = this.baseUrl.replace(/\/api\/v1\/?$/, '');
    const url = `${base}/`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('System Offline');
      return await res.json();
    } catch (err) {
      return {
        status: 'Offline',
        system: 'GramIQ Finance OCR',
        database: { status: 'Disconnected', type: 'Unknown', connected: false }
      };
    }
  }

  /**
   * Uploads notebook image to server
   * @param {File|Blob|Buffer|Object} fileData
   * @param {string} [filename]
   * @param {string} [farmerId]
   */
  async uploadNotebook(fileData, filename = 'notebook_image.jpg', farmerId = null) {
    const formData = new FormData();
    formData.append('farmer_id', farmerId || this.defaultFarmerId);

    if (typeof Blob !== 'undefined' && (fileData instanceof Blob || fileData instanceof File)) {
      formData.append('file', fileData, filename || fileData.name || 'notebook.jpg');
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(fileData)) {
      const blob = new Blob([fileData]);
      formData.append('file', blob, filename);
    } else {
      formData.append('file', fileData, filename);
    }

    return await this._request('/notebooks/upload', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }

  /**
   * Triggers the 3-step AI vision digitization pipeline (OCR -> Translate -> Categorize)
   */
  async processNotebook(notebookId, cropHint = '') {
    return await this._request(`/notebooks/process/${notebookId}`, {
      method: 'POST',
      body: { crop_hint: cropHint }
    });
  }

  /**
   * Polls getNotebook until status becomes 'Complete' or 'Failed'
   */
  async pollUntilComplete(notebookId, onProgress = null, intervalMs = 2000, timeoutMs = 120000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const notebook = await this.getNotebook(notebookId);
      if (onProgress && typeof onProgress === 'function') {
        onProgress(notebook);
      }

      if (notebook.status === 'Complete') {
        return notebook;
      }
      if (notebook.status === 'Failed') {
        throw new Error(`Notebook processing failed: ${notebook.error_message || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Polling timed out after ${timeoutMs / 1000}s for notebook ${notebookId}`);
  }

  async listNotebooks() {
    return await this._request('/notebooks');
  }

  async getNotebook(notebookId) {
    return await this._request(`/notebooks/${notebookId}`);
  }

  async getNotebookTransactions(notebookId) {
    return await this._request(`/notebooks/${notebookId}/transactions`);
  }

  async getIntermediateData(notebookId) {
    return await this._request(`/notebooks/${notebookId}/intermediate-data`);
  }

  async updateIntermediateData(notebookId, payload) {
    return await this._request(`/notebooks/${notebookId}/intermediate-data`, {
      method: 'PUT',
      body: payload
    });
  }

  async batchVerifyTransactions(notebookId, transactions) {
    return await this._request('/transactions/verify', {
      method: 'POST',
      body: {
        notebook_id: notebookId,
        transactions: transactions
      }
    });
  }

  async updateTransaction(transactionId, updates) {
    return await this._request(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: updates
    });
  }

  async deleteTransaction(transactionId) {
    return await this._request(`/transactions/${transactionId}`, {
      method: 'DELETE'
    });
  }

  async deleteNotebook(notebookId) {
    return await this._request(`/notebooks/${notebookId}`, {
      method: 'DELETE'
    });
  }

  async getAnalyticsSummary() {
    return await this._request('/analytics/summary');
  }

  async searchKnowledgeBase(query = '') {
    return await this._request(`/knowledge-base/search?query=${encodeURIComponent(query)}`);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GramIQFinanceClient;
  module.exports.GramIQFinanceClient = GramIQFinanceClient;
  module.exports.default = GramIQFinanceClient;
}
if (typeof window !== 'undefined') {
  window.GramIQFinanceClient = GramIQFinanceClient;
}

export default GramIQFinanceClient;
