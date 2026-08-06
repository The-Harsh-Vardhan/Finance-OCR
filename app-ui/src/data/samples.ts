import { CropBreakdown, ScanResponse } from '../types';

export const CROP_OPTIONS = [
  { id: 101, name: 'Maize', season: 'Kharif', year: 2026, image: 'https://cdn.gramiq.ai/crops/maize.png' },
  { id: 102, name: 'Tomato', season: 'Kharif', year: 2026, image: 'https://cdn.gramiq.ai/crops/tomato.png' },
  { id: 103, name: 'Rice', season: 'Kharif', year: 2026, image: 'https://cdn.gramiq.ai/crops/rice.png' },
  { id: 104, name: 'Cotton', season: 'Kharif', year: 2026, image: 'https://cdn.gramiq.ai/crops/cotton.png' },
  { id: 105, name: 'Wheat', season: 'Rabi', year: 2026, image: 'https://cdn.gramiq.ai/crops/wheat.png' },
  { id: 106, name: 'Mustard', season: 'Rabi', year: 2026, image: 'https://cdn.gramiq.ai/crops/mustard.png' },
];

export const EXPENSE_CATEGORIES = [
  { id: 1, name: 'Fertilizer', icon: '🧪', image: 'https://cdn.gramiq.ai/icons/fertilizer.png' },
  { id: 2, name: 'Labour', icon: '👥', image: 'https://cdn.gramiq.ai/icons/labour.png' },
  { id: 3, name: 'Irrigation', icon: '💧', image: 'https://cdn.gramiq.ai/icons/irrigation.png' },
  { id: 4, name: 'Diesel/Fuel', icon: '⛽', image: 'https://cdn.gramiq.ai/icons/fuel.png' },
  { id: 5, name: 'Seeds', icon: '🌱', image: 'https://cdn.gramiq.ai/icons/seeds.png' },
  { id: 6, name: 'Machinery', icon: '🚜', image: 'https://cdn.gramiq.ai/icons/machinery.png' },
];

export const INCOME_CATEGORIES = [
  { id: 11, name: 'Sale of Crop', icon: '🌾', image: 'https://cdn.gramiq.ai/icons/sale_crop.png' },
  { id: 12, name: 'Government Subsidy', icon: '🏛️', image: 'https://cdn.gramiq.ai/icons/subsidy.png' },
  { id: 13, name: 'Sale of Crop residues', icon: '🍂', image: 'https://cdn.gramiq.ai/icons/crop_residues.png' },
];

export const INITIAL_CROPS_SUMMARY: CropBreakdown[] = [
  { id: 102, name: 'Tomato', season: 'Kharif 2026', cost: 28000, income: 53000, net: 25000, image: '🍅' },
  { id: 103, name: 'Rice', season: 'Kharif 2026', cost: 18000, income: 33000, net: 15000, image: '🌾' },
  { id: 105, name: 'Wheat', season: 'Rabi 2026', cost: 23000, income: 42000, net: 19000, image: '🌾' },
  { id: 106, name: 'Mustard', season: 'Rabi 2026', cost: 15000, income: 25000, net: 10000, image: '🌼' },
];

export const SAMPLE_SCAN_RESPONSE: ScanResponse = {
  success: true,
  message: "Receipt scanned successfully",
  data: {
    scan_id: "SCAN_982734",
    summary: {
      total_entries: 5,
      expense_count: 3,
      income_count: 2,
      total_expense: 3200,
      total_income: 5600
    },
    selected_crop: {
      user_crop_id: 101,
      crop_name: "Maize",
      season: "Kharif",
      year: 2026,
      image_url: "https://cdn.gramiq.ai/crops/maize.png"
    },
    expenses: [
      {
        expense_category_id: 1,
        expense_category_name: "Fertilizer",
        expense_category_image: "https://cdn.gramiq.ai/icons/fertilizer.png",
        amount: 2200,
        date: "2026-06-15",
        note: "Urea 1 bag from Krishi Kendra",
        user_crop_id: 101
      },
      {
        expense_category_id: 2,
        expense_category_name: "Labour",
        expense_category_image: "https://cdn.gramiq.ai/icons/labour.png",
        amount: 1000,
        date: "2026-06-15",
        note: "",
        user_crop_id: 101
      }
    ],
    income: [
      {
        income_category_id: 11,
        income_category_name: "Sale of Crop",
        income_category_image: "https://cdn.gramiq.ai/icons/sale_crop.png",
        amount: 5000,
        date: "2026-06-15",
        note: "Maize sold at Akola Mandi",
        user_crop_id: 101
      },
      {
        income_category_id: 12,
        income_category_name: "Government Subsidy",
        income_category_image: "https://cdn.gramiq.ai/icons/subsidy.png",
        amount: 600,
        date: "2026-06-15",
        note: "",
        user_crop_id: 101
      }
    ]
  }
};
