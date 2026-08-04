import { AnalyticsSummary, IntermediateData, Notebook, Transaction } from '../types';
import { supabaseService } from './supabase';

export const getApiBase = (): string => {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('gramiq_api_url') : import.meta.env.VITE_API_URL;
  const raw = saved && !saved.startsWith('postgres') && !saved.includes('@') ? saved.trim() : 'https://gramiq-finance-ocr-backend.onrender.com/api/v1';
  const clean = raw.replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
};

export const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  const filename = imagePath.split(/[/\\]/).pop() || imagePath;
  const baseUrl = getApiBase().replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}/uploads/${filename}`;
};

export interface HealthResponse {
  status: 'Online' | 'Offline' | 'Checking';
  system?: string;
  database?: {
    status: string;
    type: string;
    connected: boolean;
  };
}

const req = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${getApiBase()}${endpoint}`;
  const headers = options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed with status ${res.status}`);
  }
  return res.status !== 204 ? res.json() : (null as any);
};

const compressImageFile = async (file: File, maxPx = 1280, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
};

export const api = {
  async getHealth(): Promise<HealthResponse> {
    return req('/health');
  },

  async uploadNotebook(file: File, farmerId: string = 'FARMER_MH_401'): Promise<Notebook> {
    const form = new FormData();
    form.append('file', file);
    form.append('notebook_name', file.name);
    form.append('farmer_id', farmerId);
    return req('/notebooks/upload', { method: 'POST', body: form });
  },

  async processWithVercelEdge(file: File, cropHint?: string) {
    const base64 = await compressImageFile(file, 1280, 0.85);
    const userApiKey = localStorage.getItem('gramiq_gemini_key') || '';

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: base64,
        crop_hint: cropHint || 'General',
        api_key: userApiKey,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status} Edge OCR Error`);
    }

    return await res.json();
  },

  async processNotebook(notebookId: string, cropHint?: string) {
    return req(`/notebooks/${notebookId}/process?crop_hint=${encodeURIComponent(cropHint || '')}`, { method: 'POST' });
  },

  async listNotebooks(): Promise<Notebook[]> {
    return req('/notebooks/');
  },

  async getNotebook(notebookId: string): Promise<Notebook> {
    return req(`/notebooks/${notebookId}`);
  },

  async deleteNotebook(notebookId: string): Promise<void> {
    return req(`/notebooks/${notebookId}`, { method: 'DELETE' });
  },

  async getNotebookTransactions(notebookId: string): Promise<Transaction[]> {
    return req(`/notebooks/${notebookId}/transactions`);
  },

  async getIntermediateData(notebookId: string): Promise<IntermediateData> {
    return req(`/notebooks/${notebookId}/intermediate-data`);
  },

  async updateIntermediateData(notebookId: string, payload: any) {
    return req(`/notebooks/${notebookId}/intermediate-data`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async batchVerifyTransactions(notebookId: string, transactions: Transaction[]) {
    return req(`/notebooks/${notebookId}/verify`, { method: 'POST', body: JSON.stringify({ transactions }) });
  },

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    return req(`/transactions/${transactionId}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    return req(`/transactions/${transactionId}`, { method: 'DELETE' });
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const data = await req('/analytics/summary');
      if (data) return data;
    } catch {
      /* fallback to Supabase */
    }

    if (supabaseService.isConfigured()) {
      const supabaseData = await supabaseService.fetchAnalyticsSummary();
      if (supabaseData) return supabaseData;
    }

    throw new Error('Failed to fetch analytics summary');
  }
};
