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

export interface PipelineTraceItem {
  engine: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

interface PipelineDiagramProps {
  currentStage: number;
  isProcessing: boolean;
  elapsedTime?: number;
  lastExecutionTime?: number | null;
  lastEngine?: string | null;
  pipelineTrace?: PipelineTraceItem[];
  onSelectStageDetail?: (stageId: number) => void;
}

export const PipelineDiagram: React.FC<PipelineDiagramProps> = ({
  currentStage,
  isProcessing,
  elapsedTime = 0,
  lastExecutionTime = null,
  lastEngine = null,
  pipelineTrace = [],
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
            {isProcessing ? (
              <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm font-mono">
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                Stage {currentStage}/3 ({elapsedTime.toFixed(1)}s)
              </span>
            ) : lastExecutionTime !== null ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Query Completed in {lastExecutionTime.toFixed(2)}s
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real-time multimodal VLM pipeline converting Indian farm notebook images into structured accounting entries
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className={`text-[11px] font-mono px-3 py-1 rounded-lg border font-bold shadow-sm ${
            isProcessing
              ? 'text-blue-700 bg-blue-50 border-blue-200'
              : lastExecutionTime !== null
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-blue-700 bg-blue-50 border-blue-200'
          }`}>
            {isProcessing
              ? `Execution Time: ${elapsedTime.toFixed(2)}s`
              : lastExecutionTime !== null
              ? `Last Query Latency: ${lastExecutionTime.toFixed(2)}s`
              : 'Total Pipeline Latency: ~0.65s'}
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

      {/* Model Execution & Fallback Audit Trail */}
      {(lastEngine || (pipelineTrace && pipelineTrace.length > 0)) && (
        <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/80 rounded-xl p-3.5 flex flex-col gap-2 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Delivered Vision Model:
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">
                {lastEngine || 'Gemini Vision'}
              </span>
            </span>
            {pipelineTrace && pipelineTrace.length > 1 && (
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                Fallback Pipeline ({pipelineTrace.length} models attempted)
              </span>
            )}
          </div>

          {pipelineTrace && pipelineTrace.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] font-mono font-bold text-slate-600">Pipeline Audit Trail:</span>
              {pipelineTrace.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span
                    title={item.error ? `Error: ${item.error}` : 'Model execution succeeded'}
                    className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1 border shadow-xs ${
                      item.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300 opacity-90'
                    }`}
                  >
                    <span>{item.status === 'SUCCESS' ? '🟢' : '🔴'}</span>
                    <span>{item.engine}</span>
                    {item.status === 'FAILED' && (
                      <span className="font-normal text-[10px] text-rose-700 bg-rose-100 px-1 rounded">
                        {item.error ? item.error.substring(0, 15) : 'Failed'}
                      </span>
                    )}
                  </span>
                  {idx < pipelineTrace.length - 1 && <span className="text-slate-400 text-xs font-bold">➔</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
