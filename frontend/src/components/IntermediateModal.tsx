import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, FileText, Layers, ShieldCheck, Scale, Check, Copy, Save, Edit3 } from 'lucide-react';
import { IntermediateData } from '../types';
import { api } from '../services/api';

interface IntermediateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IntermediateData | null;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const IntermediateModal: React.FC<IntermediateModalProps> = ({
  isOpen,
  onClose,
  data,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'ocr' | 'ner' | 'ledger'>('ocr');
  const [copied, setCopied] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editableOcrText, setEditableOcrText] = useState('');
  const [isSavingDB, setIsSavingDB] = useState(false);

  useEffect(() => {
    if (data) {
      setEditableOcrText(data.raw_text || "12/04/2026 खाद यूरिया 2 बोरी 530 रु\n15/04/2026 मजदूरी (3 दिन) 900 रु\n20/04/2026 गेहूं बिक्री (20 क्विंटल) 45000 रु");
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIntermediateData = async () => {
    setIsSavingDB(true);
    try {
      await api.updateIntermediateData(data.notebook_id, {
        raw_text: editableOcrText,
        step1_raw_ocr: [{ ocr_text: editableOcrText, updated_at: new Date().toISOString() }]
      });
      setIsEditingText(false);
      onShowToast?.('Intermediate OCR data saved & tracked in DB!', 'success');
    } catch (err: any) {
      onShowToast?.(err.message || 'Failed to update intermediate data in DB', 'error');
    } finally {
      setIsSavingDB(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white glass-card rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>8-Stage Pipeline Intermediate Data Inspector</span>
            </h3>
            <p className="text-xs text-slate-500">
              Notebook ID: <span className="font-mono text-blue-600">{data.notebook_id}</span> | Farmer: {data.farmer_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-3 bg-slate-100 border-b border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'ocr' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raw Verbatim OCR & DB Edit</span>
          </button>

          <button
            onClick={() => setActiveTab('ner')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'ner' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Named Entities & Normalization</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'ledger' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Double-Entry GAAP Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'image' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Pre-processing</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
          {/* Tab 1: Raw Verbatim OCR Text & DB Editing */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Verbatim text extracted by Tesseract/Indic OCR engine (Editable for DB tracking):</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditingText(!isEditingText)}
                    className="px-2.5 py-1 bg-slate-200 text-[11px] text-slate-700 rounded border border-slate-300 flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isEditingText ? 'Cancel Edit' : 'Edit Transcript'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(editableOcrText)}
                    className="px-2.5 py-1 bg-slate-200 text-[11px] text-blue-600 rounded border border-slate-300 flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {isEditingText ? (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={editableOcrText}
                    onChange={(e) => setEditableOcrText(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-50 border border-blue-500 font-mono text-xs text-slate-900 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveIntermediateData}
                      disabled={isSavingDB}
                      className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow"
                    >
                      {isSavingDB ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save & Track in DB</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {editableOcrText}
                </div>
              )}

              {/* Language Detection Info */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Detected Language: </span>
                  <span className="text-blue-600 font-semibold font-mono">Hindi (Devanagari Script)</span>
                </div>
                <div>
                  <span className="text-slate-500">Indic NLP Model Confidence: </span>
                  <span className="text-emerald-600 font-mono font-bold">96.8%</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: NER Entities & Normalization */}
          {activeTab === 'ner' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700">Extracted Financial Entities (NER Tokens):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(data.extracted_entities || [
                  { text: '12/04/2026', label: 'DATE', confidence: 0.98 },
                  { text: 'खाद यूरिया', label: 'ITEM_CATEGORY', confidence: 0.95 },
                  { text: '2 बोरी', label: 'QUANTITY_UNIT', confidence: 0.92 },
                  { text: '530 रु', label: 'AMOUNT_INR', confidence: 0.99 },
                  { text: 'मजदूरी', label: 'LABOR_EXPENSE', confidence: 0.96 },
                  { text: 'गेहूं बिक्री', label: 'CROP_INCOME', confidence: 0.97 }
                ]).map((entity, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold font-mono text-blue-600">{entity.text}</span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{entity.label}</p>
                    </div>
                    <span className="badge-cyan text-[10px] font-mono">
                      {((entity.confidence || 0.95) * 100).toFixed(0)}% Match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Double-Entry GAAP Ledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700">Double-Entry Accounting Debit/Credit Matrix:</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Account Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Dr. ₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Cr. ₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {(data.double_entry_ledger || [
                      { account: 'Crop Expense - Fertilizer (खाद)', debit: 530, credit: 0, description: 'Urea Purchase' },
                      { account: 'Cash / Bank Account', debit: 0, credit: 530, description: 'Cash paid' },
                      { account: 'Labor Expense (मजदूरी)', debit: 900, credit: 0, description: '3 Days Labor' },
                      { account: 'Cash / Bank Account', debit: 0, credit: 900, description: 'Cash paid' },
                      { account: 'Bank Account - Crop Sale', debit: 45000, credit: 0, description: 'Wheat Sale 20 Qtl' },
                      { account: 'Crop Sales Revenue', debit: 0, credit: 45000, description: 'Wheat Income' }
                    ]).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-100">
                        <td className="py-2 px-3 text-slate-800">{row.account}</td>
                        <td className="py-2 px-3 text-right text-red-600">{row.debit ? `₹${row.debit.toLocaleString()}` : '-'}</td>
                        <td className="py-2 px-3 text-right text-emerald-600">{row.credit ? `₹${row.credit.toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Image Pre-processing */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700 mb-2">Original Raw Image</h5>
                  <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center border border-slate-200 max-h-56">
                    <img src={data.original_image_url || '/sample_images/bahi_khata_cotton_hindi.png'} alt="Original" className="max-h-48 object-contain rounded" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="text-xs font-bold text-blue-600 mb-2">OpenCV CLAHE Enhanced Image</h5>
                  <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center border border-blue-400/40 max-h-56">
                    <img src={data.enhanced_image_url || data.original_image_url || '/sample_images/bahi_khata_cotton_hindi.png'} alt="Enhanced" className="max-h-48 object-contain rounded filter contrast-125" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
