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
    <div className="w-full glass-card rounded-2xl p-4 lg:p-6 mb-8 relative overflow-hidden transition-all duration-300">
      {/* Background glowing gradient strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 opacity-80"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping"></span>
              8-Stage AI Digitization Pipeline
            </h2>
            {isProcessing && (
              <span className="badge-cyan text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5 shadow-sm">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600 dark:text-cyan-400" />
                Processing Active Stage {currentStage}/8
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time multi-agent execution pipeline converting Indian farm notebook images into structured accounting entries
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/40 px-3 py-1 rounded-lg border border-blue-200 dark:border-cyan-800/40 font-semibold shadow-sm">
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
                  ? 'bg-white dark:bg-slate-900 border-blue-500 dark:border-cyan-500 shadow-md shadow-blue-500/10 scale-[1.03] ring-2 ring-blue-400/40 dark:ring-cyan-500/50'
                  : isDone
                  ? 'bg-emerald-50/60 dark:bg-slate-900/40 border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-400'
                  : 'bg-white/70 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/60 hover:border-blue-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Top Row: Icon + Stage # */}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${
                  isActive
                    ? 'bg-blue-100 dark:bg-cyan-500/20 border border-blue-300 dark:border-cyan-500/40'
                    : isDone
                    ? 'bg-emerald-100 dark:bg-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/50'
                }`}>
                  {getIcon(stage.icon, isActive, isDone)}
                </div>
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-blue-600 text-white dark:bg-cyan-400 dark:text-slate-950'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  0{stage.id}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className={`text-xs font-semibold leading-snug ${
                  isActive ? 'text-blue-700 dark:text-cyan-300 font-bold' : isDone ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-300'
                }`}>
                  {stage.name}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  {stage.subtitle}
                </p>
              </div>

              {/* Footer Status Pill */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className={`font-mono ${isActive ? 'text-blue-600 dark:text-cyan-400 font-bold' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {isActive ? 'Processing...' : isDone ? 'Complete' : 'Queued'}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-[9px]">{stage.duration}</span>
              </div>

              {/* Progress Line Chevron */}
              {stage.id < 8 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-500' : isActive ? 'text-blue-500 animate-pulse' : 'text-slate-300 dark:text-slate-700'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
