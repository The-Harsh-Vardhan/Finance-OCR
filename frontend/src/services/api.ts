import { AnalyticsSummary, IntermediateData, Notebook, Transaction } from '../types';
import { supabaseService } from './supabase';

// @ts-ignore - Import production JS SDK client
import GramIQFinanceClient from './api-client';

export const getApiBase = () => {
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

/**
 * Returns a configured instance of GramIQFinanceClient JS SDK
 */
const getSdkClient = () => {
  return new GramIQFinanceClient({
    baseUrl: getApiBase(),
    timeoutMs: 30000
  });
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
      // Fallback if canvas fails
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
    return await getSdkClient().getHealth();
  },

  async uploadNotebook(file: File, farmerId: string = 'FARMER_MH_401'): Promise<Notebook> {
    return await getSdkClient().uploadNotebook(file, file.name, farmerId);
  },

  async processWithVercelEdge(file: File, cropHint?: string) {
    const base64 = await compressImageFile(file, 1280, 0.85);

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: base64,
        crop_hint: cropHint || 'General',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Vercel Edge OCR failed' }));
      throw new Error(err.error || 'Vercel Edge OCR failed');
    }

    return await res.json();
  },

  async processNotebook(notebookId: string, cropHint?: string) {
    return await getSdkClient().processNotebook(notebookId, cropHint || '');
  },

  async listNotebooks(): Promise<Notebook[]> {
    return await getSdkClient().listNotebooks();
  },

  async getNotebook(notebookId: string): Promise<Notebook> {
    return await getSdkClient().getNotebook(notebookId);
  },

  async deleteNotebook(notebookId: string): Promise<void> {
    return await getSdkClient().deleteNotebook(notebookId);
  },

  async getNotebookTransactions(notebookId: string): Promise<Transaction[]> {
    return await getSdkClient().getNotebookTransactions(notebookId);
  },

  async getIntermediateData(notebookId: string): Promise<IntermediateData> {
    return await getSdkClient().getIntermediateData(notebookId);
  },

  async updateIntermediateData(notebookId: string, payload: any) {
    return await getSdkClient().updateIntermediateData(notebookId, payload);
  },

  async batchVerifyTransactions(notebookId: string, transactions: Transaction[]) {
    return await getSdkClient().batchVerifyTransactions(notebookId, transactions);
  },

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    return await getSdkClient().updateTransaction(transactionId, updates);
  },

  async deleteTransaction(transactionId: string): Promise<void> {
    return await getSdkClient().deleteTransaction(transactionId);
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const data = await getSdkClient().getAnalyticsSummary();
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
