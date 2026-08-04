import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, ArrowRight, FileText, CheckCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { api } from '../services/api';
import { Notebook } from '../types';
import { ImageZoomModal } from './ImageZoomModal';

interface UploadStudioProps {
  onUploadSuccess: (notebook: Notebook) => void;
  onStartProcessing: (notebookId: string, cropHint?: string, file?: File) => void;
  isProcessing: boolean;
  elapsedTime?: number;
  lastExecutionTime?: number | null;
}

export const UploadStudio: React.FC<UploadStudioProps> = ({
  onUploadSuccess,
  onStartProcessing,
  isProcessing,
  elapsedTime = 0,
  lastExecutionTime = null
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [inlineZoom, setInlineZoom] = useState(1);
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
      let notebookId = `nb-${Date.now()}`;
      try {
        const notebook = await api.uploadNotebook(selectedFile, 'FARMER_DEFAULT');
        notebookId = notebook.id;
        onUploadSuccess(notebook);
      } catch (uploadErr) {
        // Fallback notebook object if backend offline
        onUploadSuccess({
          id: notebookId,
          farmer_id: 'FARMER_DEFAULT',
          original_filename: selectedFile.name,
          image_path: previewUrl || '',
          upload_time: new Date().toISOString(),
          status: 'Processing',
        } as Notebook);
      }

      onStartProcessing(notebookId, 'General', selectedFile);
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Upload Handwritten Bahi-Khata Page</h2>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>API Connected: Vercel Edge (Vertex AI / Gemini)</span>
              </span>
              <span className="font-mono text-slate-500 font-medium hidden sm:inline">Supported: JPG, PNG, WEBP</span>
            </div>
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
              <div className="flex flex-col items-center space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                <div className="relative group max-h-56 overflow-hidden rounded-xl border border-slate-200 shadow-md bg-slate-900/5 transition-all">
                  <div className="overflow-auto max-h-52 flex items-center justify-center p-2">
                    <img
                      src={previewUrl}
                      alt="Bahi-Khata Preview"
                      style={{ transform: `scale(${inlineZoom})`, transition: 'transform 0.2s ease-out' }}
                      className="object-contain max-h-44 rounded-lg"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur z-10">
                    Ready for OCR
                  </div>

                  {/* Quick Action Overlay Controls */}
                  <div className="absolute bottom-2 right-2 flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/50 shadow-lg z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineZoom((z) => Math.max(z - 0.25, 0.75));
                      }}
                      disabled={inlineZoom <= 0.75}
                      title="Zoom Out"
                      className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-all"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-blue-300 px-1">
                      {Math.round(inlineZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineZoom((z) => Math.min(z + 0.25, 2.5));
                      }}
                      disabled={inlineZoom >= 2.5}
                      title="Zoom In"
                      className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-all"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3 bg-slate-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsZoomModalOpen(true);
                      }}
                      title="Fullscreen View"
                      className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* File info and Action controls */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-800">
                  <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>{selectedFile?.name}</span>
                    <span className="text-slate-400 font-mono">({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInlineZoom((z) => Math.min(z + 0.25, 2.5));
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 border border-slate-200 transition-all"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsZoomModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1 border border-blue-600 transition-all shadow-sm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Fullscreen</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setInlineZoom(1);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline font-bold px-2 py-1"
                    >
                      Change File
                    </button>
                  </div>
                </div>
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
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {lastExecutionTime !== null ? (
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Last Execution Duration: {lastExecutionTime.toFixed(2)}s</span>
            </div>
          ) : <div />}

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
                <span className="font-mono">Executing Pipeline ({elapsedTime.toFixed(1)}s)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run 3-Stage AI OCR Pipeline</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      <ImageZoomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        imageSrc={previewUrl}
        title={selectedFile?.name || 'Uploaded Handwritten Bahi-Khata Page'}
      />
    </div>
  );
};
