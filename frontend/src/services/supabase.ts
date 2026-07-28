import { createClient } from '@supabase/supabase-js';

// Environment variables or localStorage overrides for Supabase configuration
const getSupabaseConfig = () => {
  let url = import.meta.env.VITE_SUPABASE_URL || '';
  let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('gramiq_supabase_url');
    const savedKey = localStorage.getItem('gramiq_supabase_key');
    if (savedUrl) url = savedUrl;
    if (savedKey) anonKey = savedKey;
  }

  return { url, anonKey };
};

const { url, anonKey } = getSupabaseConfig();

// Initialize Supabase client if URL and Anon Key are present
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const supabaseService = {
  isConfigured(): boolean {
    const { url, anonKey } = getSupabaseConfig();
    return Boolean(url && anonKey);
  },

  setCredentials(url: string, anonKey: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gramiq_supabase_url', url);
      localStorage.setItem('gramiq_supabase_key', anonKey);
    }
  },

  clearCredentials() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gramiq_supabase_url');
      localStorage.removeItem('gramiq_supabase_key');
    }
  },

  async fetchNotebooks() {
    if (!supabase) return [];
    const { data, error } = await supabase.from('notebooks').select('*').order('upload_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async fetchTransactions(notebookId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase.from('transactions').select('*').eq('notebook_id', notebookId);
    if (error) throw error;
    return data || [];
  },

  async fetchAnalyticsSummary() {
    if (!supabase) return null;
    const { data: notebooks } = await supabase.from('notebooks').select('id');
    const { data: transactions } = await supabase.from('transactions').select('*');

    if (!transactions) return null;

    const total_notebooks = notebooks ? notebooks.length : 0;
    const total_transactions = transactions.length;
    const verified_transactions = transactions.filter((t: any) => t.verified).length;
    const unverified_transactions = total_transactions - verified_transactions;

    let total_expenses = 0;
    let total_income = 0;

    const catMap: Record<string, { total: number; count: number }> = {};
    const cropMap: Record<string, { exp: number; inc: number }> = {};

    transactions.forEach((t: any) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'Expense') {
        total_expenses += amt;
        const cat = t.category || 'Misc';
        if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 };
        catMap[cat].total += amt;
        catMap[cat].count += 1;
      } else if (t.type === 'Income') {
        total_income += amt;
      }

      if (t.crop) {
        if (!cropMap[t.crop]) cropMap[t.crop] = { exp: 0, inc: 0 };
        if (t.type === 'Expense') cropMap[t.crop].exp += amt;
        if (t.type === 'Income') cropMap[t.crop].inc += amt;
      }
    });

    const net_profit_loss = total_income - total_expenses;

    const category_breakdown = Object.entries(catMap).map(([category, info]) => ({
      category,
      total_amount: Math.round(info.total * 100) / 100,
      percentage: total_expenses > 0 ? Math.round((info.total / total_expenses) * 10000) / 100 : 0,
      transaction_count: info.count
    }));

    const crop_breakdown = Object.entries(cropMap).map(([crop, info]) => ({
      crop,
      total_expense: Math.round(info.exp * 100) / 100,
      total_income: Math.round(info.inc * 100) / 100,
      net_profit: Math.round((info.inc - info.exp) * 100) / 100
    }));

    return {
      total_notebooks,
      total_transactions,
      verified_transactions,
      unverified_transactions,
      total_expenses: Math.round(total_expenses * 100) / 100,
      total_income: Math.round(total_income * 100) / 100,
      net_profit_loss: Math.round(net_profit_loss * 100) / 100,
      category_breakdown,
      crop_breakdown
    };
  }
};

