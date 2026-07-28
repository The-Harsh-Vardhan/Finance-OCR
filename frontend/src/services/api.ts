import { AnalyticsSummary, IntermediateData, Notebook, Transaction } from '../types';

export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gramiq_api_url');
    if (saved) return saved.replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  return 'http://127.0.0.1:8000/api/v1';
};

export const api = {
  async getHealth() {
    try {
      const base = getApiBase().replace(/\/api\/v1\/?$/, '');
      const res = await fetch(`${base}/`);
      if (!res.ok) throw new Error('Backend offline');
      return await res.json();
    } catch {
      return { status: 'Offline', system: 'GramIQ OCR Backend' };
    }
  },

  async uploadNotebook(file: File, farmerId: string = 'FARMER_MH_401'): Promise<Notebook> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('farmer_id', farmerId);

    const res = await fetch(`${getApiBase()}/notebooks/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload notebook' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async processNotebook(notebookId: string, cropHint?: string) {
    const res = await fetch(`${getApiBase()}/notebooks/process/${notebookId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop_hint: cropHint || '' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to process notebook' }));
      throw new Error(err.detail || 'Processing failed');
    }
    return res.json();
  },

  async listNotebooks(): Promise<Notebook[]> {
    const res = await fetch(`${getApiBase()}/notebooks`);
    if (!res.ok) throw new Error('Failed to fetch notebooks');
    return res.json();
  },

  async getNotebook(notebookId: string): Promise<Notebook> {
    const res = await fetch(`${getApiBase()}/notebooks/${notebookId}`);
    if (!res.ok) throw new Error('Failed to fetch notebook details');
    return res.json();
  },

  async getNotebookTransactions(notebookId: string): Promise<Transaction[]> {
    const res = await fetch(`${getApiBase()}/notebooks/${notebookId}/transactions`);
    if (!res.ok) throw new Error('Failed to fetch notebook transactions');
    return res.json();
  },

  async getIntermediateData(notebookId: string): Promise<IntermediateData> {
    const res = await fetch(`${getApiBase()}/notebooks/${notebookId}/intermediate-data`);
    if (!res.ok) throw new Error('Failed to fetch intermediate pipeline data');
    return res.json();
  },

  async updateIntermediateData(notebookId: string, payload: any) {
    const res = await fetch(`${getApiBase()}/notebooks/${notebookId}/intermediate-data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save intermediate stage data');
    return res.json();
  },

  async batchVerifyTransactions(notebookId: string, transactions: Transaction[]) {
    const res = await fetch(`${getApiBase()}/transactions/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notebook_id: notebookId,
        transactions,
      }),
    });

    if (!res.ok) throw new Error('Failed to verify transactions');
    return res.json();
  },

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`${getApiBase()}/transactions/${transactionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/transactions/${transactionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${getApiBase()}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  },

  async searchKnowledgeBase(query: string) {
    const res = await fetch(`${getApiBase()}/knowledge-base/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  }
};
