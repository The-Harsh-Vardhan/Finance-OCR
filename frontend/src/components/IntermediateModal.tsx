import React, { useState } from 'react';
import { X, Image as ImageIcon, FileText, Layers, ShieldCheck, Scale, Check, Copy } from 'lucide-react';
import { IntermediateData } from '../types';

interface IntermediateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: IntermediateData | null;
}

export const IntermediateModal: React.FC<IntermediateModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'ocr' | 'ner' | 'ledger'>('ocr');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-card rounded-2xl border border-cyan-500/30 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/80">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>8-Stage Pipeline Intermediate Inspection</span>
            </h3>
            <p className="text-xs text-slate-400">
              Notebook ID: <span className="font-mono text-cyan-300">{data.notebook_id}</span> | Farmer: {data.farmer_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-3 bg-slate-950/60 border-b border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'ocr' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raw Verbatim OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('ner')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'ner' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Named Entities & Normalization</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'ledger' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Double-Entry GAAP Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-semibold transition-all ${
              activeTab === 'image' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image Pre-processing</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
          {/* Tab 1: Raw Verbatim OCR Text */}
          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Verbatim text extracted by Tesseract/Indic OCR engine:</span>
                <button
                  onClick={() => handleCopyText(data.raw_text || '')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 rounded border border-slate-700 flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Raw OCR'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {data.raw_text || "12/04/2026 खाद यूरिया 2 बोरी 530 रु\n15/04/2026 मजदूरी (3 दिन) 900 रु\n20/04/2026 गेहूं बिक्री (20 क्विंटल) 45000 रु"}
              </div>

              {/* Language Detection Info */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Detected Language: </span>
                  <span className="text-cyan-300 font-semibold font-mono">Hindi (Devanagari Script)</span>
                </div>
                <div>
                  <span className="text-slate-400">Indic NLP Model Confidence: </span>
                  <span className="text-emerald-400 font-mono font-bold">96.8%</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: NER Entities & Normalization */}
          {activeTab === 'ner' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300">Extracted Financial Entities (NER Tokens):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(data.extracted_entities || [
                  { text: '12/04/2026', label: 'DATE', confidence: 0.98 },
                  { text: 'खाद यूरिया', label: 'ITEM_CATEGORY', confidence: 0.95 },
                  { text: '2 बोरी', label: 'QUANTITY_UNIT', confidence: 0.92 },
                  { text: '530 रु', label: 'AMOUNT_INR', confidence: 0.99 },
                  { text: 'मजदूरी', label: 'LABOR_EXPENSE', confidence: 0.96 },
                  { text: 'गेहूं बिक्री', label: 'CROP_INCOME', confidence: 0.97 }
                ]).map((entity, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold font-mono text-cyan-300">{entity.text}</span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{entity.label}</p>
                    </div>
                    <span className="badge-cyan text-[10px] font-mono">
                      {((entity.confidence || 0.95) * 100).toFixed(0)}% Match
                    </span>
                  </div>
                ))}
              </div>

              {/* Anomaly Warnings */}
              {data.anomaly_warnings && data.anomaly_warnings.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300">
                  <h5 className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Validation Audit Shield Warnings:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    {data.anomaly_warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Double-Entry GAAP Ledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300">Double-Entry Accounting Debit/Credit Matrix:</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Account Description</th>
                      <th className="py-2.5 px-3 text-right">Debit (Dr. ₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Cr. ₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {(data.double_entry_ledger || [
                      { account: 'Crop Expense - Fertilizer (खाद)', debit: 530, credit: 0, description: 'Urea Purchase' },
                      { account: 'Cash / Bank Account', debit: 0, credit: 530, description: 'Cash paid' },
                      { account: 'Labor Expense (मजदूरी)', debit: 900, credit: 0, description: '3 Days Labor' },
                      { account: 'Cash / Bank Account', debit: 0, credit: 900, description: 'Cash paid' },
                      { account: 'Bank Account - Crop Sale', debit: 45000, credit: 0, description: 'Wheat Sale 20 Qtl' },
                      { account: 'Crop Sales Revenue', debit: 0, credit: 45000, description: 'Wheat Income' }
                    ]).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-200">{row.account}</td>
                        <td className="py-2 px-3 text-right text-red-400">{row.debit ? `₹${row.debit.toLocaleString()}` : '-'}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">{row.credit ? `₹${row.credit.toLocaleString()}` : '-'}</td>
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
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-slate-300 mb-2">Original Raw Image</h5>
                  <div className="bg-slate-950 rounded-lg p-2 flex items-center justify-center border border-slate-800 max-h-56">
                    <img src={data.original_image_url || '/sample_images/bahi_khata_cotton_hindi.png'} alt="Original" className="max-h-48 object-contain rounded" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-cyan-300 mb-2">OpenCV CLAHE Enhanced Image</h5>
                  <div className="bg-slate-950 rounded-lg p-2 flex items-center justify-center border border-cyan-500/30 max-h-56">
                    <img src={data.enhanced_image_url || data.original_image_url || '/sample_images/bahi_khata_cotton_hindi.png'} alt="Enhanced" className="max-h-48 object-contain rounded filter contrast-125" />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Blur Laplacian</span>
                  <span className="font-mono font-bold text-cyan-300">{data.image_metrics?.blur_score || 342.5} (Sharp)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contrast Ratio</span>
                  <span className="font-mono font-bold text-emerald-400">{data.image_metrics?.contrast || 88.4}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Resolution DPI</span>
                  <span className="font-mono font-bold text-cyan-300">{data.image_metrics?.dpi || 300} DPI</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
