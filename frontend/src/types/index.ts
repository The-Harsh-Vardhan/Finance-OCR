export type NotebookStatus = 'Uploaded' | 'Processing' | 'Review_Needed' | 'Complete' | 'Failed';

export interface Notebook {
  id: string;
  farmer_id: string;
  original_filename: string;
  image_path: string;
  upload_time: string;
  status: NotebookStatus;
  transaction_count?: number;
  ocr_confidence?: number;
}

export interface Transaction {
  id: string;
  notebook_id: string;
  transaction_date: string;
  description: string;
  description_en?: string;
  category: string;
  subcategory?: string;
  crop?: string;
  type: 'Income' | 'Expense';
  amount: number;
  unit?: string;
  ocr_confidence?: number;
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
  farmer_id: string;
  upload_time: string;
  original_image_url: string;
  enhanced_image_url: string;
  image_metrics?: {
    blur_score?: number;
    brightness?: number;
    contrast?: number;
    dpi?: number;
    quality_verdict?: string;
  };
  raw_text?: string;
  language_detection?: {
    primary_language?: string;
    script?: string;
    confidence?: number;
  };
  preprocessed_text?: string;
  extracted_entities?: Array<{
    text: string;
    label: string;
    confidence: number;
  }>;
  validation_results?: {
    math_valid: boolean;
    missing_fields: string[];
    date_formatted: boolean;
  };
  anomaly_warnings?: string[];
  double_entry_ledger?: Array<{
    account: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  pipeline_status?: string;
}

export interface PipelineStageInfo {
  id: number;
  name: string;
  subtitle: string;
  icon: string;
  nodeKey: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  detail?: string;
  duration?: string;
}
