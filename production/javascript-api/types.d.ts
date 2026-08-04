/**
 * GramIQ Finance OCR JavaScript API SDK Type Definitions
 */

export interface NotebookStatus {
  UPLOADED: 'Uploaded';
  PROCESSING: 'Processing';
  FAILED: 'Failed';
  COMPLETE: 'Complete';
}

export interface Notebook {
  id: string;
  farmer_id: string;
  original_filename: string;
  image_path: string;
  enhanced_image_path?: string | null;
  upload_time?: string;
  status: 'Uploaded' | 'Processing' | 'Failed' | 'Complete';
  quality_score?: number | null;
  error_message?: string | null;
  quality_metrics?: Record<string, any> | null;
  intermediate_ocr_data?: any[] | null;
  intermediate_translation_data?: any[] | null;
  final_output_data?: any[] | null;
  created_at?: string;
}

export interface Transaction {
  id: string;
  notebook_id: string;
  transaction_date?: string | null;
  raw_date?: string | null;
  ocr_text?: string | null;
  description_en?: string | null;
  description: string;
  category: string;
  subcategory?: string | null;
  crop?: string | null;
  type: 'Income' | 'Expense';
  amount: number;
  unit?: string | null;
  confidence?: number | null;
  confidence_level?: string | null;
  verified: boolean;
  created_at?: string;
}

export interface CategorySummary {
  category: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export interface CropSummary {
  crop: string;
  total_expense: number;
  total_income: number;
  net_profit: number;
}

export interface AnalyticsSummary {
  total_notebooks: number;
  total_transactions: number;
  verified_transactions: number;
  unverified_transactions: number;
  total_expenses: number;
  total_income: number;
  net_profit_loss: number;
  category_breakdown: CategorySummary[];
  crop_breakdown: CropSummary[];
}

export interface IntermediateData {
  notebook_id: string;
  status: string;
  original_image_path: string;
  enhanced_image_path?: string | null;
  quality_metrics: Record<string, any>;
  step1_raw_ocr: any[];
  step2_translations: any[];
  step3_final_output: any[];
}

export interface KnowledgeBaseItem {
  alias: string;
  canonical_name: string;
  category: string;
  subcategory?: string | null;
  language: string;
}

export interface KnowledgeBaseSearchResult {
  query: string;
  total_results: number;
  categories: string[];
  results: KnowledgeBaseItem[];
}

export interface GramIQClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  farmerId?: string;
}

export declare class GramIQFinanceClient {
  constructor(config?: GramIQClientConfig);
  
  setBaseUrl(url: string): void;
  getBaseUrl(): string;
  
  getHealth(): Promise<{ status: string; system?: string; database?: any }>;
  
  uploadNotebook(fileBlobOrBuffer: File | Blob | ArrayBuffer | Buffer, filename?: string, farmerId?: string): Promise<Notebook>;
  processNotebook(notebookId: string, cropHint?: string): Promise<{ notebook_id: string; status: string; message: string }>;
  
  pollUntilComplete(
    notebookId: string,
    onProgress?: (status: Notebook) => void,
    intervalMs?: number,
    timeoutMs?: number
  ): Promise<Notebook>;

  listNotebooks(): Promise<Notebook[]>;
  getNotebook(notebookId: string): Promise<Notebook>;
  getNotebookTransactions(notebookId: string): Promise<Transaction[]>;
  getIntermediateData(notebookId: string): Promise<IntermediateData>;
  updateIntermediateData(notebookId: string, payload: Record<string, any>): Promise<any>;

  batchVerifyTransactions(notebookId: string, transactions: Transaction[]): Promise<{ message: string; notebook_id: string; status: string }>;
  updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction>;
  deleteTransaction(transactionId: string): Promise<void>;
  deleteNotebook(notebookId: string): Promise<void>;

  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  searchKnowledgeBase(query?: string): Promise<KnowledgeBaseSearchResult>;
}

export default GramIQFinanceClient;
