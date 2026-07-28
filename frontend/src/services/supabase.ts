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
  }
};
