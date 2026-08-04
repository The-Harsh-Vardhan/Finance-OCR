-- GramIQ Finance OCR - Production PostgreSQL (Supabase) Database Schema
-- Run this migration in your PostgreSQL database or Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Notebooks Table
CREATE TABLE IF NOT EXISTS public.notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id TEXT NOT NULL DEFAULT 'FARMER_DEFAULT',
    original_filename TEXT NOT NULL,
    image_path TEXT NOT NULL,
    enhanced_image_path TEXT,
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'Uploaded',
    quality_score DOUBLE PRECISION,
    error_message TEXT,
    quality_metrics JSONB,
    intermediate_ocr_data JSONB,
    intermediate_translation_data JSONB,
    final_output_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID REFERENCES public.notebooks(id) ON DELETE CASCADE,
    transaction_date DATE,
    raw_date TEXT,
    ocr_text TEXT,
    description_en TEXT,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    crop TEXT,
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    unit TEXT DEFAULT '₹',
    confidence DOUBLE PRECISION DEFAULT 0.95,
    confidence_level TEXT DEFAULT 'High',
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Production Indexes
CREATE INDEX IF NOT EXISTS idx_notebooks_farmer ON public.notebooks(farmer_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_status ON public.notebooks(status);
CREATE INDEX IF NOT EXISTS idx_transactions_notebook ON public.transactions(notebook_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_crop ON public.transactions(crop);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Allow public select notebooks" ON public.notebooks;
DROP POLICY IF EXISTS "Allow public insert notebooks" ON public.notebooks;
DROP POLICY IF EXISTS "Allow public update notebooks" ON public.notebooks;

DROP POLICY IF EXISTS "Allow public select transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public delete transactions" ON public.transactions;

CREATE POLICY "Allow public select notebooks" ON public.notebooks FOR SELECT USING (true);
CREATE POLICY "Allow public insert notebooks" ON public.notebooks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notebooks" ON public.notebooks FOR UPDATE USING (true);

CREATE POLICY "Allow public select transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete transactions" ON public.transactions FOR DELETE USING (true);
