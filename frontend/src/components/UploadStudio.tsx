import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, ArrowRight, FileText, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Notebook } from '../types';

interface UploadStudioProps {
  onUploadSuccess: (notebook: Notebook) => void;
  onStartProcessing: (notebookId: string, cropHint?: string) => void;
  isProcessing: boolean;
}

const PRESET_SAMPLES = [
  {
    id: 'sample_hindi_cotton',
    title: 'cotton_harvest_hindi.png',
    label: 'Cotton Sales & Labor Ledger (Hindi)',
    crop: 'Cotton',
    filename: 'bahi_khata_cotton_hindi.png',
    path: '/sample_images/bahi_khata_cotton_hindi.png',
    description: 'Contains labor charges (मजदूरी), pesticide expenses & cotton sale income in Devanagari Hindi'
  },
  {
    id: 'sample_marathi_soybean',
    title: 'soybean_fert_marathi.png',
    label: 'Soybean & Fertilizer Expense (Marathi)',
    crop: 'Soybean',
    filename: 'bahi_khata_soybean_marathi.png',
    path: '/sample_images/bahi_khata_soybean_marathi.png',
    description: 'Modi-script influenced handwritten Marathi notebook with Urea fertilizer (खत) purchase'
  },
  {
    id: 'sample_english_sugarcane',
    title: 'sugarcane_diesel_eng.png',
    label: 'Sugarcane & Tractor Fuel Log (English/Hindi Mix)',
    crop: 'Sugarcane',
    filename: 'bahi_khata_sugarcane_english.png',
    path: '/sample_images/bahi_khata_sugarcane_english.png',
    description: 'Bahi-Khata log detailing tractor diesel, mill token payments, and harvester rental'
  }
];

export const UploadStudio: React.FC<UploadStudioProps> = ({
  onUploadSuccess,
  onStartProcessing,
  isProcessing
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropHint, setCropHint] = useState<string>('Wheat');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (.jpg, .jpeg, .png, .webp)');
      return;
    }
    setErrorMsg(null);
    setSelectedPreset(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePresetSelect = async (preset: typeof PRESET_SAMPLES[0]) => {
    setSelectedPreset(preset.id);
    setCropHint(preset.crop);
    setErrorMsg(null);

    try {
      const res = await fetch(`/sample_images/${preset.filename}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('image')) throw new Error('Fallback demo blob');
      const blob = await res.blob();
      const file = new File([blob], preset.filename, { type: 'image/png' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#0284c7';
        ctx.font = '20px Inter, sans-serif';
        ctx.fillText(`Sample: ${preset.label}`, 40, 60);
        ctx.fillStyle = '#475569';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(preset.description, 40, 100);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], preset.filename, { type: 'image/png' });
          setSelectedFile(file);
          setPreviewUrl(canvas.toDataURL());
        }
      });
    }
  };

  const handleUploadAndRun = async () => {
    if (!selectedFile) {
      setErrorMsg('Please upload an image or choose a preset sample');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const notebook = await api.uploadNotebook(selectedFile, 'FARMER_DEFAULT');
      onUploadSuccess(notebook);
      onStartProcessing(notebook.id, cropHint);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing OCR upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-8">
      {/* Upload Zone (Full Width) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-300">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Upload Handwritten Bahi-Khata Page</h2>
            </div>
            <span className="text-xs font-mono text-slate-500 font-medium">Supported: JPG, PNG, WEBP</span>
          </div>

          {/* Dropzone Box */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/80 shadow-inner'
                : previewUrl
                ? 'border-blue-300 bg-blue-50/40'
                : 'border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="relative max-h-48 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <img src={previewUrl} alt="Bahi-Khata Preview" className="object-contain max-h-44 rounded-lg" />
                  <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur">
                    Ready for OCR
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>{selectedFile?.name}</span>
                  <span className="text-slate-400 font-mono">({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline font-bold"
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 rounded-full bg-blue-100 text-blue-600">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Drag and drop your notebook image here, or <span className="text-blue-600 underline font-bold">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Supports handwritten Hindi, Marathi, Gujarati or English ledger entries
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Crop Hint & Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Crop Context Hint:
            </label>
            <select
              value={cropHint}
              onChange={(e) => setCropHint(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-bold text-slate-900 rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="Wheat">🌾 Wheat (गेहूं)</option>
              <option value="Cotton">🌱 Cotton (कपास)</option>
              <option value="Sugarcane">🌾 Sugarcane (गन्ना)</option>
              <option value="Soybean">🫘 Soybean (सोयाबीन)</option>
              <option value="Gram">🫛 Gram (चना / तुर)</option>
              <option value="General">🚜 General Farm</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleUploadAndRun}
            disabled={!selectedFile || isProcessing || isUploading}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md ${
              !selectedFile || isProcessing || isUploading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-500/20 hover:shadow-blue-500/35 active:scale-95'
            }`}
          >
            {isProcessing || isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run 8-Stage OCR Pipeline</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
