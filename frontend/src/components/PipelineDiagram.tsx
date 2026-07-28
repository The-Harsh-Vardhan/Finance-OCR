import React from 'react';
import { Camera, FileCode2, Languages, Sparkles, Calculator, ShieldAlert, Scale, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { PipelineStageInfo } from '../types';

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 1,
    name: "Pre-processing",
    subtitle: "OpenCV Deskew & Contrast",
    icon: "Camera",
    nodeKey: "preprocessing",
    status: "idle",
    duration: "~180ms",
    detail: "Binarization, CLAHE contrast & orientation check"
  },
  {
    id: 2,
    name: "Raw OCR Extraction",
    subtitle: "Tesseract / Indic OCR",
    icon: "FileCode2",
    nodeKey: "ocr_extraction",
    status: "idle",
    duration: "~420ms",
    detail: "Multi-script line & word segmentation"
  },
  {
    id: 3,
    name: "Indic NLP Normalization",
    subtitle: "Transliteration & Slang",
    icon: "Languages",
    nodeKey: "indic_nlp",
    status: "idle",
    duration: "~250ms",
    detail: "Standardizing Hindi/Marathi agricultural vocabulary"
  },
  {
    id: 4,
    name: "Entity Recognition",
    subtitle: "CRF / Pattern NER",
    icon: "Sparkles",
    nodeKey: "entity_ner",
    status: "idle",
    duration: "~310ms",
    detail: "Extracting Date, Amount, Party, Item & Crop"
  },
  {
    id: 5,
    name: "Validation Engine",
    subtitle: "Math & Cross-checks",
    icon: "Calculator",
    nodeKey: "validation",
    status: "idle",
    duration: "~120ms",
    detail: "Reconciling total sums, missing rates & units"
  },
  {
    id: 6,
    name: "Fraud & Outlier Audit",
    subtitle: "Z-score Anomaly Shield",
    icon: "ShieldAlert",
    nodeKey: "fraud_audit",
    status: "idle",
    duration: "~190ms",
    detail: "Detecting price spikes, duplicate dates & unusual inputs"
  },
  {
    id: 7,
    name: "Double Entry Ledger",
    subtitle: "Debit & Credit Mapping",
    icon: "Scale",
    nodeKey: "double_entry",
    status: "idle",
    duration: "~150ms",
    detail: "Creating GAAP compliant Debit/Credit pairs"
  },
  {
    id: 8,
    name: "Audit & Sync",
    subtitle: "Final Ledger Commit",
    icon: "CheckCircle2",
    nodeKey: "final_audit",
    status: "idle",
    duration: "~100ms",
    detail: "Updating database & confidence rating"
  }
];

interface PipelineDiagramProps {
  currentStage: number;
  isProcessing: boolean;
  onSelectStageDetail?: (stageId: number) => void;
}

export const PipelineDiagram: React.FC<PipelineDiagramProps> = ({
  currentStage,
  isProcessing,
  onSelectStageDetail
}) => {
  const getIcon = (iconName: string, active: boolean, isDone: boolean) => {
    const props = {
      className: `w-4 h-4 ${
        active
          ? 'text-blue-600 dark:text-cyan-300 animate-pulse'
          : isDone
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-slate-400 dark:text-slate-500'
      }`
    };
    switch (iconName) {
      case 'Camera': return <Camera {...props} />;
      case 'FileCode2': return <FileCode2 {...props} />;
      case 'Languages': return <Languages {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Calculator': return <Calculator {...props} />;
      case 'ShieldAlert': return <ShieldAlert {...props} />;
      case 'Scale': return <Scale {...props} />;
      case 'CheckCircle2': return <CheckCircle2 {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 lg:p-6 mb-8 relative overflow-hidden shadow-sm transition-all duration-300">
      {/* Background glowing gradient strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 opacity-90"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              8-Stage AI Digitization Pipeline
            </h2>
            {isProcessing && (
              <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                Processing Active Stage {currentStage}/8
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real-time multi-agent execution pipeline converting Indian farm notebook images into structured accounting entries
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 font-bold shadow-sm">
            Total Pipeline Latency: ~1.75s
          </span>
        </div>
      </div>

      {/* Grid of Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative">
        {PIPELINE_STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isActive = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStageDetail?.(stage.id)}
              className={`relative rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 border ${
                isActive
                  ? 'bg-white border-blue-600 shadow-md shadow-blue-500/15 scale-[1.03] ring-2 ring-blue-400/40'
                  : isDone
                  ? 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-400 shadow-sm'
                  : 'bg-slate-50/80 border-slate-200 hover:border-blue-300 hover:bg-white shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-blue-700' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/80 text-slate-600'}`}>
                    {getIcon(stage.icon, isActive, isDone)}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    0{stage.id}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight mb-1">
                  {stage.name}
                </h3>
                <p className="text-[10px] text-slate-600 leading-snug line-clamp-2 font-medium">
                  {stage.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-mono">
                <span className={isActive ? 'text-blue-700 font-bold' : isDone ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                  {isActive ? 'Processing...' : isDone ? 'Complete' : 'Queued'}
                </span>
                <span className="text-slate-400">{stage.duration}</span>
              </div>

              {/* Progress Line Chevron */}
              {stage.id < 8 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-500' : isActive ? 'text-blue-500 animate-pulse' : 'text-slate-300'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
