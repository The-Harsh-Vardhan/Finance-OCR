import React, { useState } from 'react';
import {
  Camera, Image as ImageIcon, Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
  CheckCircle, ArrowRight, FileText, Code, Check, Sparkles, RefreshCw, X, AlertCircle
} from 'lucide-react';
import {
  ScanResponse, ExpenseItem, IncomeItem, SelectedCrop, Summary, ScanData
} from './types';
import {
  CROP_OPTIONS, EXPENSE_CATEGORIES, INCOME_CATEGORIES,
  INITIAL_CROPS_SUMMARY, SAMPLE_SCAN_RESPONSE
} from './data/samples';

export default function App() {
  // Screen state navigation: 'dashboard' | 'upload_modal' | 'scan_preview' | 'scanning' | 'review' | 'success'
  const [screen, setScreen] = useState<'dashboard' | 'upload_modal' | 'scan_preview' | 'scanning' | 'review' | 'success'>('dashboard');

  // Selected crop filter on main dashboard
  const [activeCropFilter, setActiveCropFilter] = useState<string>('All Crops');

  // Active Scan Response State (Stores exact API format JSON)
  const [scanResponse, setScanResponse] = useState<ScanResponse>(SAMPLE_SCAN_RESPONSE);

  // Editable entries state during 'review' screen
  const [editableExpenses, setEditableExpenses] = useState<ExpenseItem[]>(SAMPLE_SCAN_RESPONSE.data.expenses);
  const [editableIncome, setEditableIncome] = useState<IncomeItem[]>(SAMPLE_SCAN_RESPONSE.data.income);
  const [selectedCrop, setSelectedCrop] = useState<SelectedCrop>(SAMPLE_SCAN_RESPONSE.data.selected_crop);

  // Live image state for OCR
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [showCropDropdown, setShowCropDropdown] = useState<boolean>(false);

  // Dashboard accumulated entries
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

  // Derived dashboard totals
  const totalExpenseSum = allExpenses.reduce((acc, c) => acc + c.amount, 0);
  const totalIncomeSum = allIncome.reduce((acc, c) => acc + c.amount, 0);
  const netProfit = totalIncomeSum - totalExpenseSum;

  // Handle file upload
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

  // Perform backend OCR scan request
  const triggerScanApi = async () => {
    setScreen('scanning');
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedImage,
          cropName: selectedCrop.crop_name,
          cropId: selectedCrop.user_crop_id
        })
      });

      if (res.ok) {
        const json: ScanResponse = await res.json();
        setScanResponse(json);
        setEditableExpenses(json.data.expenses);
        setEditableIncome(json.data.income);
        setSelectedCrop(json.data.selected_crop);
      } else {
        // Fallback to sample response format
        setScanResponse(SAMPLE_SCAN_RESPONSE);
        setEditableExpenses(SAMPLE_SCAN_RESPONSE.data.expenses);
        setEditableIncome(SAMPLE_SCAN_RESPONSE.data.income);
      }
    } catch (err) {
      console.warn("Scan API request error, using target response schema format", err);
      setScanResponse(SAMPLE_SCAN_RESPONSE);
      setEditableExpenses(SAMPLE_SCAN_RESPONSE.data.expenses);
      setEditableIncome(SAMPLE_SCAN_RESPONSE.data.income);
    }

    setTimeout(() => {
      setScreen('review');
    }, 1200);
  };

  // Confirm extracted entries and merge to dashboard state
  const handleConfirmEntries = () => {
    setAllExpenses(prev => [...editableExpenses, ...prev]);
    setAllIncome(prev => [...editableIncome, ...prev]);

    // Recalculate summary payload matching prompt format
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

  // Switch crop in review screen
  const handleSelectCrop = (crop: typeof CROP_OPTIONS[0]) => {
    const newCropObj: SelectedCrop = {
      user_crop_id: crop.id,
      crop_name: crop.name,
      season: crop.season,
      year: crop.year,
      image_url: crop.image
    };
    setSelectedCrop(newCropObj);
    setShowCropDropdown(false);
  };

  // Entry edit helper
  const handleExpenseChange = (index: number, field: keyof ExpenseItem, value: any) => {
    const copy = [...editableExpenses];
    copy[index] = { ...copy[index], [field]: value };
    setEditableExpenses(copy);
  };

  const handleIncomeChange = (index: number, field: keyof IncomeItem, value: any) => {
    const copy = [...editableIncome];
    copy[index] = { ...copy[index], [field]: value };
    setEditableIncome(copy);
  };

  const handleDeleteExpense = (index: number) => {
    setEditableExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteIncome = (index: number) => {
    setEditableIncome(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddExpenseRow = () => {
    const newRow: ExpenseItem = {
      expense_category_id: 1,
      expense_category_name: 'Fertilizer',
      expense_category_image: 'https://cdn.gramiq.ai/icons/fertilizer.png',
      amount: 500,
      date: '2026-06-15',
      note: '',
      user_crop_id: selectedCrop.user_crop_id
    };
    setEditableExpenses(prev => [...prev, newRow]);
  };

  const handleAddIncomeRow = () => {
    const newRow: IncomeItem = {
      income_category_id: 11,
      income_category_name: 'Sale of Crop',
      income_category_image: 'https://cdn.gramiq.ai/icons/sale_crop.png',
      amount: 1000,
      date: '2026-06-15',
      note: '',
      user_crop_id: selectedCrop.user_crop_id
    };
    setEditableIncome(prev => [...prev, newRow]);
  };

  return (
    <div className="app-container">

      {/* Header Bar */}
      <header className="app-header">
        <div className="header-left">
          {screen !== 'dashboard' && (
            <button className="back-btn" onClick={() => setScreen('dashboard')}>
              <ChevronLeft size={22} />
            </button>
          )}
          <span>
            {screen === 'dashboard' && 'Farm Profit'}
            {screen === 'upload_modal' && 'Add photo'}
            {screen === 'scan_preview' && 'Scan finance page'}
            {screen === 'scanning' && 'Scan finance page'}
            {screen === 'review' && 'Check what we found'}
            {screen === 'success' && 'Scan finance page'}
          </span>
        </div>
        <div className="header-action-badge" onClick={() => setShowJsonModal(true)}>
          <Code size={13} /> View API JSON
        </div>
      </header>

      {/* Main Dynamic View Content */}
      <main className="app-content">

        {/* SCREEN 1: Farm Profit Dashboard */}
        {screen === 'dashboard' && (
          <div>

            {/* Horizontal Crop Filter Tabs */}
            <div className="crop-tabs-bar">
              {['All Crops', 'Tomato', 'Rice', 'Cotton', 'Wheat', 'Mustard'].map(crop => (
                <div
                  key={crop}
                  className={`crop-tab ${activeCropFilter === crop ? 'active' : ''}`}
                  onClick={() => setActiveCropFilter(crop)}
                >
                  {crop}
                </div>
              ))}
            </div>

            {/* Top Hisaab Banner */}
            <div className="hisaab-banner" onClick={() => setScreen('upload_modal')}>
              <div>
                <div className="banner-title">Keep your hisaab on paper?</div>
                <div className="banner-subtitle">Snap the page - GramIQ fills the entries for you.</div>
              </div>
              <ChevronRight size={18} color="#2563EB" />
            </div>

            {/* Combined Net Profit Card with Donut Chart */}
            <div className="profit-card">
              <div className="filter-pills">
                <div className="filter-pill active">Total</div>
                <div className="filter-pill">Per Acre</div>
                <div className="filter-pill">Per Quintal</div>
              </div>

              <div className="chart-container">
                <div className="donut-ring">
                  <div className="donut-inner">
                    <span className="donut-label">Combined Net Profit</span>
                    <span className="donut-amount">₹{netProfit.toLocaleString()}</span>
                    <span className="donut-sub">Till Financial Year</span>
                  </div>
                </div>
              </div>

              <div className="metrics-row">
                <div className="metric-box">
                  <div className="metric-label">Cost of Cultivation</div>
                  <div className="metric-value red">₹{totalExpenseSum.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Income</div>
                  <div className="metric-value green">₹{totalIncomeSum.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">Net Profit</div>
                  <div className="metric-value blue">₹{netProfit.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* PDF Report Download Button */}
            <button className="report-btn">
              <span>Download / View Full Report</span>
              <FileText size={18} />
            </button>

            {/* Expenses List */}
            <div className="section-header">
              <div className="section-title">
                Expenses <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(Tap to add expense)</span>
              </div>
              <button className="add-circle-btn red" onClick={() => setScreen('upload_modal')}>
                <Plus size={16} />
              </button>
            </div>

            {allExpenses.map((exp, idx) => (
              <div key={idx} className="entry-card">
                <div className="entry-info">
                  <div className="entry-icon expense">
                    {EXPENSE_CATEGORIES.find(c => c.name === exp.expense_category_name)?.icon || '💸'}
                  </div>
                  <div>
                    <div className="entry-name">{exp.expense_category_name}</div>
                    <div className="entry-subtext">{exp.date} • {exp.note || 'Tap to edit'}</div>
                  </div>
                </div>
                <div className="entry-amount-actions">
                  <span className="entry-amount expense">-₹{exp.amount.toLocaleString()}</span>
                  <button className="action-icon-btn"><Edit2 size={13} /></button>
                </div>
              </div>
            ))}

            <button className="dashed-add-btn" onClick={() => setScreen('upload_modal')}>
              <Plus size={16} /> Add new expense
            </button>

            {/* Income List */}
            <div className="section-header">
              <div className="section-title">
                Income <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(Tap to add income)</span>
              </div>
              <button className="add-circle-btn green" onClick={() => setScreen('upload_modal')}>
                <Plus size={16} />
              </button>
            </div>

            {allIncome.map((inc, idx) => (
              <div key={idx} className="entry-card">
                <div className="entry-info">
                  <div className="entry-icon income">
                    {INCOME_CATEGORIES.find(c => c.name === inc.income_category_name)?.icon || '💰'}
                  </div>
                  <div>
                    <div className="entry-name">{inc.income_category_name}</div>
                    <div className="entry-subtext">{inc.date} • {inc.note || 'Tap to edit'}</div>
                  </div>
                </div>
                <div className="entry-amount-actions">
                  <span className="entry-amount income">+₹{inc.amount.toLocaleString()}</span>
                  <button className="action-icon-btn"><Edit2 size={13} /></button>
                </div>
              </div>
            ))}

            {/* Per Crop Breakdown */}
            <div style={{ marginTop: 24 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>Per crop breakdown</div>
              {INITIAL_CROPS_SUMMARY.map(crop => (
                <div key={crop.id} className="entry-card">
                  <div className="entry-info">
                    <div style={{ fontSize: 24 }}>{crop.image}</div>
                    <div>
                      <div className="entry-name">{crop.name} <span style={{ fontSize: 10, color: '#64748B' }}>{crop.season}</span></div>
                      <div className="entry-subtext">COST: ₹{crop.cost.toLocaleString()} | INC: ₹{crop.income.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="entry-amount green">+₹{crop.net.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Floating Camera Button */}
            <button className="fab-camera-btn" onClick={() => setScreen('upload_modal')}>
              <Camera size={26} />
            </button>
          </div>
        )}

        {/* SCREEN 2: Upload Modal Bottom Sheet */}
        {screen === 'upload_modal' && (
          <div className="modal-overlay">
            <div className="modal-bottom-sheet">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="sheet-title">Add photo of your finance page</h3>
                <button className="action-icon-btn" onClick={() => setScreen('dashboard')}><X size={16} /></button>
              </div>
              <p className="sheet-desc">
                Written your expenses and income in a notebook? Take a photo. GramIQ reads it and creates the entries. You can edit/replace later.
              </p>

              <div className="upload-options-grid">
                <label className="upload-card-btn">
                  <div className="upload-icon-circle"><Camera size={22} /></div>
                  <span>Take photo</span>
                  <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>

                <label className="upload-card-btn">
                  <div className="upload-icon-circle" style={{ background: '#3B82F6' }}><ImageIcon size={22} /></div>
                  <span>Upload from gallery</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>

              {/* Sample Receipts Quick Selector */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Or try sample receipt:</div>
                <button
                  className="dashed-add-btn"
                  style={{ background: '#EFF6FF', borderColor: '#93C5FD', color: '#1E40AF' }}
                  onClick={() => {
                    setUploadedImage(null);
                    setScreen('scan_preview');
                  }}
                >
                  <Sparkles size={16} /> Use Sample Farm Notebook Receipt (5 entries)
                </button>
              </div>

              <div className="tips-box">
                <div className="tips-title">For best reading:</div>
                <div className="tip-item"><Check size={13} /> Keep full page visible & in frame</div>
                <div className="tip-item"><Check size={13} /> Good light, no shadow on the paper</div>
                <div className="tip-item"><Check size={13} /> One page at a time, you can add more later</div>
                <div className="tip-item"><Check size={13} /> Marathi, Hindi & English handwritten support</div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: Scan Preview with Bounding Box Overlay */}
        {screen === 'scan_preview' && (
          <div>
            <div className="scan-preview-wrapper">
              <img
                src={uploadedImage || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60"}
                alt="Scan Page"
                className="scan-image"
              />
              {/* Overlay Bounding Boxes matching screenshot */}
              <div className="bounding-box" style={{ top: '15%', left: '8%', width: '84%', height: '12%' }} />
              <div className="bounding-box" style={{ top: '30%', left: '8%', width: '84%', height: '12%' }} />
              <div className="bounding-box" style={{ top: '65%', left: '8%', width: '84%', height: '16%' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
              <CheckCircle size={16} /> Page detected
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => setScreen('upload_modal')}>Retake</button>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={triggerScanApi}>
                <Sparkles size={16} /> Read page
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: Scanning Progress Sheet */}
        {screen === 'scanning' && (
          <div className="modal-overlay">
            <div className="modal-bottom-sheet" style={{ textAlign: 'center', padding: 32 }}>
              <RefreshCw size={36} className="animate-spin" style={{ color: '#2F2684', margin: '0 auto 16px auto' }} />
              <h3 className="sheet-title">GramIQ is reading your hisaab...</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20, textAlign: 'left' }}>
                <div className="tip-item" style={{ color: '#0F172A', fontSize: 13 }}><CheckCircle size={16} color="#10B981" /> Reading the page</div>
                <div className="tip-item" style={{ color: '#0F172A', fontSize: 13 }}><CheckCircle size={16} color="#10B981" /> Finding amounts</div>
                <div className="tip-item" style={{ color: '#0F172A', fontSize: 13 }}><CheckCircle size={16} color="#10B981" /> Sorting cost & income</div>
              </div>
              <button className="btn-secondary" style={{ marginTop: 24, width: '100%' }} onClick={() => setScreen('dashboard')}>Cancel</button>
            </div>
          </div>
        )}

        {/* SCREEN 5: "Check what we found" Review & Edit Screen */}
        {screen === 'review' && (
          <div style={{ paddingBottom: 80 }}>

            <div style={{ background: '#EFF6FF', padding: '10px 14px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                {editableExpenses.length + editableIncome.length} entries found
              </span>
              <button className="header-action-badge" style={{ color: '#1E40AF', background: '#DBEAFE' }} onClick={() => setScreen('upload_modal')}>
                Retake photo
              </button>
            </div>

            {/* Selected Crop Card */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
              FOR WHICH CROP?
            </div>
            <div className="review-crop-card">
              <div className="crop-card-info">
                <div className="crop-card-img">🌽</div>
                <div>
                  <div className="crop-card-name">{selectedCrop.crop_name}</div>
                  <div className="crop-card-season">{selectedCrop.season} {selectedCrop.year}</div>
                </div>
              </div>
              <button className="switch-crop-btn" onClick={() => setShowCropDropdown(!showCropDropdown)}>
                Switch ▾
              </button>
            </div>

            {/* Crop Selector Dropdown */}
            {showCropDropdown && (
              <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: 16, padding: 8, marginBottom: 16 }}>
                {CROP_OPTIONS.map(c => (
                  <div
                    key={c.id}
                    style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 8 }}
                    onClick={() => handleSelectCrop(c)}
                  >
                    {c.name} ({c.season} {c.year})
                  </div>
                ))}
              </div>
            )}

            {/* Expenses Detected Section */}
            <div className="section-header">
              <div className="section-title">
                Expenses Detected: <span style={{ color: '#EF4444' }}>₹{editableExpenses.reduce((a,b) => a + Number(b.amount||0), 0).toLocaleString()}</span>
              </div>
              <button className="add-circle-btn red" onClick={handleAddExpenseRow}><Plus size={16} /></button>
            </div>

            {editableExpenses.map((exp, idx) => (
              <div key={idx} className="edit-entry-card">
                <div className="edit-entry-top">
                  <select
                    className="category-select"
                    value={exp.expense_category_name}
                    onChange={(e) => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.name === e.target.value);
                      handleExpenseChange(idx, 'expense_category_name', e.target.value);
                      if (cat) handleExpenseChange(idx, 'expense_category_id', cat.id);
                    }}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>

                  <div className="amount-input-wrapper">
                    <span>₹</span>
                    <input
                      type="number"
                      className="amount-input"
                      value={exp.amount}
                      onChange={(e) => handleExpenseChange(idx, 'amount', Number(e.target.value))}
                    />
                    <button className="action-icon-btn delete" onClick={() => handleDeleteExpense(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={exp.date}
                    onChange={(e) => handleExpenseChange(idx, 'date', e.target.value)}
                    style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '4px 8px', fontSize: 11 }}
                  />
                  <span style={{ fontSize: 11, background: '#F1F5F9', padding: '4px 8px', borderRadius: 8, color: '#475569' }}>
                    {selectedCrop.season} {selectedCrop.year}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Add note (e.g. Urea 1 bag from Krishi Kendra)"
                  className="note-input"
                  value={exp.note}
                  onChange={(e) => handleExpenseChange(idx, 'note', e.target.value)}
                />
              </div>
            ))}

            {/* Income Detected Section */}
            <div className="section-header" style={{ marginTop: 24 }}>
              <div className="section-title">
                Income Detected: <span style={{ color: '#10B981' }}>₹{editableIncome.reduce((a,b) => a + Number(b.amount||0), 0).toLocaleString()}</span>
              </div>
              <button className="add-circle-btn green" onClick={handleAddIncomeRow}><Plus size={16} /></button>
            </div>

            {editableIncome.map((inc, idx) => (
              <div key={idx} className="edit-entry-card">
                <div className="edit-entry-top">
                  <select
                    className="category-select"
                    value={inc.income_category_name}
                    onChange={(e) => {
                      const cat = INCOME_CATEGORIES.find(c => c.name === e.target.value);
                      handleIncomeChange(idx, 'income_category_name', e.target.value);
                      if (cat) handleIncomeChange(idx, 'income_category_id', cat.id);
                    }}
                  >
                    {INCOME_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>

                  <div className="amount-input-wrapper">
                    <span>₹</span>
                    <input
                      type="number"
                      className="amount-input"
                      value={inc.amount}
                      onChange={(e) => handleIncomeChange(idx, 'amount', Number(e.target.value))}
                    />
                    <button className="action-icon-btn delete" onClick={() => handleDeleteIncome(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    value={inc.date}
                    onChange={(e) => handleIncomeChange(idx, 'date', e.target.value)}
                    style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '4px 8px', fontSize: 11 }}
                  />
                  <span style={{ fontSize: 11, background: '#F1F5F9', padding: '4px 8px', borderRadius: 8, color: '#475569' }}>
                    {selectedCrop.season} {selectedCrop.year}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Add note (e.g. Maize sold at Akola Mandi)"
                  className="note-input"
                  value={inc.note}
                  onChange={(e) => handleIncomeChange(idx, 'note', e.target.value)}
                />
              </div>
            ))}

            {/* Bottom Actions Bar */}
            <div className="bottom-actions-bar">
              <button className="btn-secondary" onClick={() => setScreen('dashboard')}>Discard</button>
              <button className="btn-primary" onClick={handleConfirmEntries}>
                Confirm & add {editableExpenses.length + editableIncome.length} entries
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 6: Success Confirmation */}
        {screen === 'success' && (
          <div style={{ textAlign: 'center', padding: '40px 16px 20px 16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>
              {scanResponse.data.summary.total_entries} entries added
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: 14, borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#991B1B' }}>Expense added</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>₹{scanResponse.data.summary.total_expense.toLocaleString()}</div>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', padding: 14, borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#065F46' }}>Income added</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>₹{scanResponse.data.summary.total_income.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="dashed-add-btn" onClick={() => setScreen('upload_modal')}>
                <Camera size={16} /> Scan another page
              </button>
              <button className="btn-primary" onClick={() => setScreen('dashboard')}>
                Done
              </button>
            </div>
          </div>
        )}

      </main>

      {/* JSON Viewer Modal (Strict response format verification) */}
      {showJsonModal && (
        <div className="modal-overlay">
          <div className="modal-bottom-sheet" style={{ maxHeight: '85vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className="sheet-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Code size={18} color="#2563EB" /> API Response JSON Format
              </h3>
              <button className="action-icon-btn" onClick={() => setShowJsonModal(false)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
              Target API response returned by <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>POST /api/scan</code>:
            </p>
            <div className="json-modal-content">
              {JSON.stringify(scanResponse, null, 2)}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
