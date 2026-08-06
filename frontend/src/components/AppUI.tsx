import React, { useState } from 'react';
import {
  Camera, Image as ImageIcon, Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
  CheckCircle, ArrowRight, FileText, Code, Check, Sparkles, RefreshCw, X, Smartphone
} from 'lucide-react';

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

const CROP_OPTIONS = [
  { id: 101, name: 'Maize', season: 'Kharif', year: 2026, image: '🌽' },
  { id: 102, name: 'Tomato', season: 'Kharif', year: 2026, image: '🍅' },
  { id: 103, name: 'Rice', season: 'Kharif', year: 2026, image: '🌾' },
  { id: 104, name: 'Cotton', season: 'Kharif', year: 2026, image: '☁️' },
  { id: 105, name: 'Wheat', season: 'Rabi', year: 2026, image: '🌾' },
  { id: 106, name: 'Mustard', season: 'Rabi', year: 2026, image: '🌼' },
];

const EXPENSE_CATEGORIES = [
  { id: 1, name: 'Fertilizer', icon: '🧪', image: 'https://cdn.gramiq.ai/icons/fertilizer.png' },
  { id: 2, name: 'Labour', icon: '👥', image: 'https://cdn.gramiq.ai/icons/labour.png' },
  { id: 3, name: 'Irrigation', icon: '💧', image: 'https://cdn.gramiq.ai/icons/irrigation.png' },
  { id: 4, name: 'Diesel/Fuel', icon: '⛽', image: 'https://cdn.gramiq.ai/icons/fuel.png' },
  { id: 5, name: 'Seeds', icon: '🌱', image: 'https://cdn.gramiq.ai/icons/seeds.png' },
];

const INCOME_CATEGORIES = [
  { id: 11, name: 'Sale of Crop', icon: '🌾', image: 'https://cdn.gramiq.ai/icons/sale_crop.png' },
  { id: 12, name: 'Government Subsidy', icon: '🏛️', image: 'https://cdn.gramiq.ai/icons/subsidy.png' },
  { id: 13, name: 'Sale of Crop residues', icon: '🍂', image: 'https://cdn.gramiq.ai/icons/crop_residues.png' },
];

const DEFAULT_SAMPLE_RESPONSE: ScanResponse = {
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
      },
      {
        expense_category_id: 3,
        expense_category_name: "Irrigation",
        expense_category_image: "https://cdn.gramiq.ai/icons/irrigation.png",
        amount: 0,
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

export const AppUI: React.FC = () => {
  const [screen, setScreen] = useState<'dashboard' | 'upload_modal' | 'scan_preview' | 'scanning' | 'review' | 'success'>('dashboard');
  const [activeCropFilter, setActiveCropFilter] = useState<string>('All Crops');
  const [scanResponse, setScanResponse] = useState<ScanResponse>(DEFAULT_SAMPLE_RESPONSE);
  const [editableExpenses, setEditableExpenses] = useState<ExpenseItem[]>(DEFAULT_SAMPLE_RESPONSE.data.expenses);
  const [editableIncome, setEditableIncome] = useState<IncomeItem[]>(DEFAULT_SAMPLE_RESPONSE.data.income);
  const [selectedCrop, setSelectedCrop] = useState<SelectedCrop>(DEFAULT_SAMPLE_RESPONSE.data.selected_crop);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [showCropDropdown, setShowCropDropdown] = useState<boolean>(false);

  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([
    { expense_category_id: 1, expense_category_name: 'Fertilizer', expense_category_image: '', amount: 9400, date: '2026-06-10', note: '', user_crop_id: 102 },
    { expense_category_id: 2, expense_category_name: 'Labour', expense_category_image: '', amount: 1400, date: '2026-06-12', note: '', user_crop_id: 102 },
    { expense_category_id: 3, expense_category_name: 'Irrigation', expense_category_image: '', amount: 2400, date: '2026-06-14', note: '', user_crop_id: 102 },
    { expense_category_id: 4, expense_category_name: 'Diesel/Fuel', expense_category_image: '', amount: 1000, date: '2026-06-15', note: '', user_crop_id: 102 },
    { expense_category_id: 5, expense_category_name: 'Seeds', expense_category_image: '', amount: 900, date: '2026-06-01', note: '', user_crop_id: 102 },
  ]);

  const [allIncome, setAllIncome] = useState<IncomeItem[]>([
    { income_category_id: 11, income_category_name: 'Sale of Crop', income_category_image: '', amount: 53000, date: '2026-06-20', note: 'Tomato harvest sold', user_crop_id: 102 },
    { income_category_id: 12, income_category_name: 'Government Subsidy', income_category_image: '', amount: 600, date: '2026-06-25', note: 'PM Kisan', user_crop_id: 102 },
  ]);

  const totalExpenseSum = allExpenses.reduce((acc, c) => acc + c.amount, 0);
  const totalIncomeSum = allIncome.reduce((acc, c) => acc + c.amount, 0);
  const netProfit = totalIncomeSum - totalExpenseSum;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setScreen('scan_preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerScanApi = async () => {
    setScreen('scanning');
    try {
      if (uploadedImage) {
        const userApiKey = localStorage.getItem('gramiq_gemini_key') || '';
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: uploadedImage,
            crop_hint: selectedCrop.crop_name,
            api_key: userApiKey,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const txs = json.data || json.transactions || [];
          if (Array.isArray(txs) && txs.length > 0) {
            const parsedExpenses: ExpenseItem[] = [];
            const parsedIncome: IncomeItem[] = [];

            txs.forEach((tx: any) => {
              const rawType = (tx.type || 'Expense').toLowerCase();
              const catName = tx.category || (rawType.includes('income') || rawType.includes('sales') ? 'Sale of Crop' : 'Fertilizer');
              const amt = Number(tx.amount || 0);
              const dt = tx.date || tx.transaction_date || '2026-06-15';
              const noteStr = tx.description_en || tx.description || tx.ocr_text || '';

              if (rawType.includes('income') || rawType.includes('sales') || rawType.includes('जमा')) {
                const matchCat = INCOME_CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase()) || INCOME_CATEGORIES[0];
                parsedIncome.push({
                  income_category_id: matchCat.id,
                  income_category_name: matchCat.name,
                  income_category_image: matchCat.image,
                  amount: amt,
                  date: dt,
                  note: noteStr,
                  user_crop_id: selectedCrop.user_crop_id
                });
              } else {
                const matchCat = EXPENSE_CATEGORIES.find(c => c.name.toLowerCase() === catName.toLowerCase()) || EXPENSE_CATEGORIES[0];
                parsedExpenses.push({
                  expense_category_id: matchCat.id,
                  expense_category_name: matchCat.name,
                  expense_category_image: matchCat.image,
                  amount: amt,
                  date: dt,
                  note: noteStr,
                  user_crop_id: selectedCrop.user_crop_id
                });
              }
            });

            const totalExp = parsedExpenses.reduce((a, b) => a + b.amount, 0);
            const totalInc = parsedIncome.reduce((a, b) => a + b.amount, 0);

            const aiResponsePayload: ScanResponse = {
              success: true,
              message: "Receipt scanned successfully",
              data: {
                scan_id: `SCAN_${Math.floor(100000 + Math.random() * 900000)}`,
                summary: {
                  total_entries: parsedExpenses.length + parsedIncome.length,
                  expense_count: parsedExpenses.length,
                  income_count: parsedIncome.length,
                  total_expense: totalExp,
                  total_income: totalInc
                },
                selected_crop: selectedCrop,
                expenses: parsedExpenses,
                income: parsedIncome
              }
            };

            setScanResponse(aiResponsePayload);
            setEditableExpenses(parsedExpenses);
            setEditableIncome(parsedIncome);
            setScreen('review');
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Real AI OCR call error, using default benchmark payload", err);
    }

    // Default sample fallback if no custom image or API unavailable
    setScanResponse(DEFAULT_SAMPLE_RESPONSE);
    setEditableExpenses(DEFAULT_SAMPLE_RESPONSE.data.expenses);
    setEditableIncome(DEFAULT_SAMPLE_RESPONSE.data.income);
    setScreen('review');
  };

  const handleConfirmEntries = () => {
    setAllExpenses(prev => [...editableExpenses, ...prev]);
    setAllIncome(prev => [...editableIncome, ...prev]);

    const totalExp = editableExpenses.reduce((a, b) => a + Number(b.amount || 0), 0);
    const totalInc = editableIncome.reduce((a, b) => a + Number(b.amount || 0), 0);

    const updatedResponse: ScanResponse = {
      success: true,
      message: "Receipt scanned successfully",
      data: {
        scan_id: scanResponse.data.scan_id || "SCAN_982734",
        summary: {
          total_entries: editableExpenses.length + editableIncome.length,
          expense_count: editableExpenses.length,
          income_count: editableIncome.length,
          total_expense: totalExp,
          total_income: totalInc
        },
        selected_crop: selectedCrop,
        expenses: editableExpenses,
        income: editableIncome
      }
    };

    setScanResponse(updatedResponse);
    setScreen('success');
  };

  return (
    <div className="flex justify-center items-start py-4">
      <div className="w-full max-w-[440px] bg-slate-50 min-h-[820px] rounded-[36px] border-8 border-slate-800 shadow-2xl overflow-hidden relative font-sans flex flex-col">
        {/* Mobile Header */}
        <header className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {screen !== 'dashboard' && (
              <button onClick={() => setScreen('dashboard')} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-bold text-lg">
              {screen === 'dashboard' && 'Farm Profit'}
              {screen === 'upload_modal' && 'Add photo'}
              {screen === 'scan_preview' && 'Scan finance page'}
              {screen === 'scanning' && 'Scan finance page'}
              {screen === 'review' && 'Check what we found'}
              {screen === 'success' && 'Scan finance page'}
            </span>
          </div>

          <button
            onClick={() => setShowJsonModal(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full text-white"
          >
            <Code className="w-3.5 h-3.5" /> API JSON
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-4 pb-24 overflow-y-auto">
          {screen === 'dashboard' && (
            <div>
              {/* Crop Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                {['All Crops', 'Tomato', 'Rice', 'Cotton', 'Wheat', 'Mustard'].map(crop => (
                  <button
                    key={crop}
                    onClick={() => setActiveCropFilter(crop)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCropFilter === crop
                        ? 'bg-indigo-900 text-white shadow-md'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>

              {/* Top Banner */}
              <div
                onClick={() => setScreen('upload_modal')}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-dashed border-blue-300 rounded-2xl p-3.5 flex items-center justify-between mb-5 cursor-pointer hover:shadow-md transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-blue-900">Keep your hisaab on paper?</div>
                  <div className="text-[11px] text-blue-600">Snap the page - GramIQ fills entries for you.</div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </div>

              {/* Profit Donut Card */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mb-5">
                <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
                  <div className="flex-1 text-center py-1 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-xs">Total</div>
                  <div className="flex-1 text-center py-1 text-xs font-semibold text-slate-500">Per Acre</div>
                  <div className="flex-1 text-center py-1 text-xs font-semibold text-slate-500">Per Quintal</div>
                </div>

                <div className="flex flex-col items-center justify-center my-2">
                  <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-emerald-500 via-rose-500 to-blue-500 p-4 flex items-center justify-center shadow-inner">
                    <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center text-center p-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Combined Net Profit</span>
                      <span className="text-xl font-extrabold text-slate-900 my-0.5">₹{netProfit.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400">Till Financial Year</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-[10px] font-semibold text-slate-500">Cost</div>
                    <div className="text-xs font-bold text-rose-600">₹{totalExpenseSum.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-[10px] font-semibold text-slate-500">Income</div>
                    <div className="text-xs font-bold text-emerald-600">₹{totalIncomeSum.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-[10px] font-semibold text-slate-500">Net Profit</div>
                    <div className="text-xs font-bold text-blue-600">₹{netProfit.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Download Report */}
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-3.5 flex items-center justify-between font-bold text-xs shadow-md mb-6">
                <span>Download / View Full Report</span>
                <FileText className="w-4 h-4" />
              </button>

              {/* Expenses List */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-slate-900">Expenses <span className="text-xs font-normal text-slate-400">(Tap to add)</span></span>
                <button onClick={() => setScreen('upload_modal')} className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {allExpenses.map((exp, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-3 mb-2 flex items-center justify-between border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-lg">
                      {EXPENSE_CATEGORIES.find(c => c.name === exp.expense_category_name)?.icon || '💸'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{exp.expense_category_name}</div>
                      <div className="text-[10px] text-slate-400">{exp.date} • {exp.note || 'No note'}</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-rose-600">-₹{exp.amount.toLocaleString()}</span>
                </div>
              ))}

              {/* Income List */}
              <div className="flex items-center justify-between mb-3 mt-5">
                <span className="font-bold text-sm text-slate-900">Income <span className="text-xs font-normal text-slate-400">(Tap to add)</span></span>
                <button onClick={() => setScreen('upload_modal')} className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {allIncome.map((inc, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-3 mb-2 flex items-center justify-between border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-lg">
                      {INCOME_CATEGORIES.find(c => c.name === inc.income_category_name)?.icon || '💰'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{inc.income_category_name}</div>
                      <div className="text-[10px] text-slate-400">{inc.date} • {inc.note || 'No note'}</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-emerald-600">+₹{inc.amount.toLocaleString()}</span>
                </div>
              ))}

              {/* Floating Camera Button */}
              <button
                onClick={() => setScreen('upload_modal')}
                className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white border-4 border-white shadow-xl flex items-center justify-center hover:scale-105 transition-all z-30"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* SCREEN 2: Upload Modal */}
          {screen === 'upload_modal' && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end justify-center">
              <div className="bg-white w-full max-w-[440px] rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-base text-slate-900">Add photo of your finance page</h3>
                  <button onClick={() => setScreen('dashboard')} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </div>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Written your expenses and income in a notebook? Take a photo. GramIQ reads it and creates entries for you.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                    <div className="w-10 h-10 rounded-full bg-indigo-900 text-white flex items-center justify-center"><Camera className="w-5 h-5" /></div>
                    <span className="text-xs font-bold text-slate-800">Take photo</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                  </label>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center"><ImageIcon className="w-5 h-5" /></div>
                    <span className="text-xs font-bold text-slate-800">Upload gallery</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <button
                  onClick={() => { setUploadedImage(null); setScreen('scan_preview'); }}
                  className="w-full bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-2 mb-4 hover:bg-blue-100"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" /> Try Sample Farm Notebook Page (5 entries)
                </button>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900">
                  <div className="font-bold text-emerald-950 mb-1">For best reading:</div>
                  <div className="flex items-center gap-1.5 text-[11px] mb-1"><Check className="w-3.5 h-3.5 text-emerald-600" /> Keep full page visible & in frame</div>
                  <div className="flex items-center gap-1.5 text-[11px] mb-1"><Check className="w-3.5 h-3.5 text-emerald-600" /> Good light, no shadow on paper</div>
                  <div className="flex items-center gap-1.5 text-[11px]"><Check className="w-3.5 h-3.5 text-emerald-600" /> Marathi, Hindi & English support</div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: Scan Preview */}
          {screen === 'scan_preview' && (
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-black mb-4">
                <img
                  src={uploadedImage || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60"}
                  alt="Receipt Preview"
                  className="w-full opacity-90 block"
                />
                <div className="absolute top-[15%] left-[8%] w-[84%] h-[12%] border-2 border-blue-500 bg-blue-500/20 rounded shadow-lg animate-pulse" />
                <div className="absolute top-[32%] left-[8%] w-[84%] h-[14%] border-2 border-blue-500 bg-blue-500/20 rounded shadow-lg animate-pulse" />
                <div className="absolute top-[65%] left-[8%] w-[84%] h-[16%] border-2 border-blue-500 bg-blue-500/20 rounded shadow-lg animate-pulse" />
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-4">
                <CheckCircle className="w-4 h-4" /> Page detected
              </div>

              <div className="flex gap-3">
                <button onClick={() => setScreen('upload_modal')} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs">Retake</button>
                <button onClick={triggerScanApi} className="flex-2 bg-indigo-900 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md">
                  <Sparkles className="w-4 h-4" /> Read page
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: Progress Overlay */}
          {screen === 'scanning' && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-[360px] text-center shadow-2xl">
                <RefreshCw className="w-9 h-9 text-indigo-900 animate-spin mx-auto mb-4" />
                <h3 className="font-bold text-base text-slate-900 mb-4">GramIQ is reading your hisaab...</h3>
                <div className="text-left space-y-2 text-xs text-slate-700 mb-6">
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Reading the page</div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Finding amounts</div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Sorting cost & income</div>
                </div>
                <button onClick={() => setScreen('dashboard')} className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold">Cancel</button>
              </div>
            </div>
          )}

          {/* SCREEN 5: Review & Edit */}
          {screen === 'review' && (
            <div className="pb-16">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-blue-900">{editableExpenses.length + editableIncome.length} entries found</span>
                <button onClick={() => setScreen('upload_modal')} className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">Retake photo</button>
              </div>

              {/* Selected Crop Card */}
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">FOR WHICH CROP?</div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between mb-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-lg">🌽</div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{selectedCrop.crop_name}</div>
                    <div className="text-[10px] text-slate-400">{selectedCrop.season} {selectedCrop.year}</div>
                  </div>
                </div>
                <button onClick={() => setShowCropDropdown(!showCropDropdown)} className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                  Switch ▾
                </button>
              </div>

              {showCropDropdown && (
                <div className="bg-white border border-slate-200 rounded-xl p-2 mb-4 shadow-md space-y-1">
                  {CROP_OPTIONS.map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCrop({ user_crop_id: c.id, crop_name: c.name, season: c.season, year: c.year, image_url: '' });
                        setShowCropDropdown(false);
                      }}
                      className="p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      {c.name} ({c.season} {c.year})
                    </div>
                  ))}
                </div>
              )}

              {/* Expenses Detected */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs text-slate-900">Expenses Detected: <span className="text-rose-600">₹{editableExpenses.reduce((a,b)=>a+Number(b.amount||0),0)}</span></span>
                <button onClick={() => setEditableExpenses(prev=>[...prev, { expense_category_id:1, expense_category_name:'Fertilizer', expense_category_image:'', amount:500, date:'2026-06-15', note:'', user_crop_id:selectedCrop.user_crop_id }])} className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
              </div>

              {editableExpenses.map((exp, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 mb-2 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <select
                      value={exp.expense_category_name}
                      onChange={(e) => {
                        const copy = [...editableExpenses];
                        copy[i].expense_category_name = e.target.value;
                        setEditableExpenses(copy);
                      }}
                      className="bg-slate-100 font-bold px-2 py-1 rounded-lg text-slate-900 border-none outline-none"
                    >
                      {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    <div className="flex items-center gap-2">
                      <span className="font-bold">₹</span>
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) => {
                          const copy = [...editableExpenses];
                          copy[i].amount = Number(e.target.value);
                          setEditableExpenses(copy);
                        }}
                        className="w-20 border border-slate-300 rounded px-2 py-0.5 text-right font-bold"
                      />
                      <button onClick={() => setEditableExpenses(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Add note..."
                    value={exp.note}
                    onChange={(e) => {
                      const copy = [...editableExpenses];
                      copy[i].note = e.target.value;
                      setEditableExpenses(copy);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700"
                  />
                </div>
              ))}

              {/* Income Detected */}
              <div className="flex justify-between items-center mb-2 mt-4">
                <span className="font-bold text-xs text-slate-900">Income Detected: <span className="text-emerald-600">₹{editableIncome.reduce((a,b)=>a+Number(b.amount||0),0)}</span></span>
                <button onClick={() => setEditableIncome(prev=>[...prev, { income_category_id:11, income_category_name:'Sale of Crop', income_category_image:'', amount:1000, date:'2026-06-15', note:'', user_crop_id:selectedCrop.user_crop_id }])} className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
              </div>

              {editableIncome.map((inc, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 mb-2 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <select
                      value={inc.income_category_name}
                      onChange={(e) => {
                        const copy = [...editableIncome];
                        copy[i].income_category_name = e.target.value;
                        setEditableIncome(copy);
                      }}
                      className="bg-slate-100 font-bold px-2 py-1 rounded-lg text-slate-900 border-none outline-none"
                    >
                      {INCOME_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    <div className="flex items-center gap-2">
                      <span className="font-bold">₹</span>
                      <input
                        type="number"
                        value={inc.amount}
                        onChange={(e) => {
                          const copy = [...editableIncome];
                          copy[i].amount = Number(e.target.value);
                          setEditableIncome(copy);
                        }}
                        className="w-20 border border-slate-300 rounded px-2 py-0.5 text-right font-bold"
                      />
                      <button onClick={() => setEditableIncome(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Add note..."
                    value={inc.note}
                    onChange={(e) => {
                      const copy = [...editableIncome];
                      copy[i].note = e.target.value;
                      setEditableIncome(copy);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700"
                  />
                </div>
              ))}

              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4 flex gap-3 z-40">
                <button onClick={() => setScreen('dashboard')} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs">Discard</button>
                <button onClick={handleConfirmEntries} className="flex-2 bg-indigo-900 text-white py-3 rounded-xl font-bold text-xs shadow-md">
                  Confirm & add {editableExpenses.length + editableIncome.length} entries
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 6: Success */}
          {screen === 'success' && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-6">{scanResponse.data.summary.total_entries} entries added</h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                  <div className="text-[10px] font-bold text-rose-800">Expense added</div>
                  <div className="text-base font-extrabold text-rose-600">₹{scanResponse.data.summary.total_expense.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-800">Income added</div>
                  <div className="text-base font-extrabold text-emerald-600">₹{scanResponse.data.summary.total_income.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={() => setScreen('upload_modal')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Scan another page
                </button>
                <button onClick={() => setScreen('dashboard')} className="w-full bg-indigo-900 text-white py-3 rounded-xl font-bold text-xs shadow-md">Done</button>
              </div>
            </div>
          )}
        </div>

        {/* JSON Viewer Modal */}
        {showJsonModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end justify-center p-4">
            <div className="bg-white w-full max-w-[420px] rounded-2xl p-4 max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5"><Code className="w-4 h-4 text-blue-600" /> Target Response JSON Format</h3>
                <button onClick={() => setShowJsonModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 bg-slate-900 text-cyan-400 rounded-xl p-3 text-[10px] font-mono overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(scanResponse, null, 2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
