export interface SelectedCrop {
  user_crop_id: number;
  crop_name: string;
  season: string;
  year: number;
  image_url: string;
}

export interface Summary {
  total_entries: number;
  expense_count: number;
  income_count: number;
  total_expense: number;
  total_income: number;
}

export interface ExpenseItem {
  expense_category_id: number;
  expense_category_name: string;
  expense_category_image: string;
  amount: number;
  date: string;
  note: string;
  user_crop_id: number;
}

export interface IncomeItem {
  income_category_id: number;
  income_category_name: string;
  income_category_image: string;
  amount: number;
  date: string;
  note: string;
  user_crop_id: number;
}

export interface ScanData {
  scan_id: string;
  summary: Summary;
  selected_crop: SelectedCrop;
  expenses: ExpenseItem[];
  income: IncomeItem[];
}

export interface ScanResponse {
  success: boolean;
  message: string;
  data: ScanData;
}

export interface CropBreakdown {
  id: number;
  name: string;
  season: string;
  cost: number;
  income: number;
  net: number;
  image: string;
}
