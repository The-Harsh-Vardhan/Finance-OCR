import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, ArrowRight, FileText, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Notebook } from '../types';

interface UploadStudioProps {
  onUploadSuccess: (notebook: Notebook) => void;
  onStartProcessing: (notebookId: string, cropHint?: string) => void;
  isProcessing: boolean;
}

export const UploadStudio: React.FC<UploadStudioProps> = ({
  onUploadSuccess,
  onStartProcessing,
  isProcessing
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (.jpg, .jpeg, .png, .webp)');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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
      onStartProcessing(notebook.id, 'General');
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

        {/* Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={handleUploadAndRun}
            disabled={!selectedFile || isProcessing || isUploading}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md ${
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
