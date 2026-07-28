import React from 'react';
import { Camera, FileCode2, Languages, Sparkles, Calculator, ShieldAlert, Scale, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { PipelineStageInfo } from '../types';

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 1,
    name: "Multimodal AI Vision",
    subtitle: "Gemini VLM Single-Pass",
    icon: "Sparkles",
    nodeKey: "ai_vision",
    status: "idle",
    duration: "~450ms",
    detail: "OCR, Indic translation, entity recognition & GAAP categorization in 1 pass"
  },
  {
    id: 2,
    name: "Validation & Rules Engine",
    subtitle: "Date & Bounds Check",
    icon: "Calculator",
    nodeKey: "validation",
    status: "idle",
    duration: "~100ms",
    detail: "Normalizes Devanagari dates & validates agricultural amount sanity bounds"
  },
  {
    id: 3,
    name: "Audit & DB Sync",
    subtitle: "Final Ledger Commit",
    icon: "CheckCircle2",
    nodeKey: "final_audit",
    status: "idle",
    duration: "~100ms",
    detail: "Stores verified transactions & auto-syncs with PostgreSQL (Supabase)"
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
          ? 'text-blue-600 animate-pulse'
          : isDone
          ? 'text-emerald-600'
          : 'text-slate-400'
      }`
    };
    switch (iconName) {
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Calculator': return <Calculator {...props} />;
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
              3-Stage Lean AI Digitization Pipeline
            </h2>
            {isProcessing && (
              <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                Processing Active Stage {currentStage}/3
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real-time multimodal VLM pipeline converting Indian farm notebook images into structured accounting entries
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 font-bold shadow-sm">
            Total Pipeline Latency: ~0.65s
          </span>
        </div>
      </div>

      {/* Grid of Stages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {PIPELINE_STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isActive = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStageDetail?.(stage.id)}
              className={`relative rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 border ${
                isActive
                  ? 'bg-white border-blue-600 shadow-md shadow-blue-500/15 scale-[1.02] ring-2 ring-blue-400/40'
                  : isDone
                  ? 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-400 shadow-sm'
                  : 'bg-slate-50/80 border-slate-200 hover:border-blue-300 hover:bg-white shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-700' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/80 text-slate-600'}`}>
                    {getIcon(stage.icon, isActive, isDone)}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    STAGE 0{stage.id}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                  {stage.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {stage.detail}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-mono">
                <span className={isActive ? 'text-blue-700 font-bold' : isDone ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                  {isActive ? 'Processing...' : isDone ? 'Complete' : 'Queued'}
                </span>
                <span className="text-slate-400 font-semibold">{stage.duration}</span>
              </div>

              {/* Progress Line Chevron */}
              {stage.id < 3 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className={`w-4 h-4 ${isDone ? 'text-emerald-500' : isActive ? 'text-blue-500 animate-pulse' : 'text-slate-300'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
