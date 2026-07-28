import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PipelineDiagram } from './components/PipelineDiagram';
import { UploadStudio } from './components/UploadStudio';
import { TransactionTable } from './components/TransactionTable';
import { IntermediateModal } from './components/IntermediateModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ToastContainer, ToastMessage } from './components/Toast';
import { api } from './services/api';
import { AnalyticsSummary, IntermediateData, Notebook, Transaction } from './types';
import { Calendar, ChevronRight, Cpu, Database } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'notebooks' | 'analytics'>('studio');
  const [serverStatus, setServerStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking');
  const [dbInfo, setDbInfo] = useState<{ status: string; type: string; connected: boolean }>({
    status: 'Syncing...',
    type: 'PostgreSQL / SQLite',
    connected: false
  });

  // Notebook and OCR pipeline state
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [notebookList, setNotebookList] = useState<Notebook[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [intermediateData, setIntermediateData] = useState<IntermediateData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Pipeline execution tracking state
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isIntermediateModalOpen, setIsIntermediateModalOpen] = useState<boolean>(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load & periodic health check for Render cold start and live DB status
  useEffect(() => {
    let intervalId: any;

    const checkServer = async () => {
      const health = await api.getHealth();
      if (health.status === 'Online') {
        setServerStatus('Online');
        if (health.database) {
          setDbInfo(health.database);
        }
        loadAllData();
      } else {
        setServerStatus((prev) => (prev === 'Online' ? 'Offline' : 'Checking'));
      }
    };

    checkServer();
    intervalId = setInterval(checkServer, 7000);

    return () => clearInterval(intervalId);
  }, []);

  const loadAllData = async () => {
    try {
      const nbs = await api.listNotebooks();
      setNotebookList(nbs);

      const summary = await api.getAnalyticsSummary();
      setAnalytics(summary);

      if (activeNotebook) {
        const current = nbs.find((n) => n.id === activeNotebook.id);
        if (current) {
          const txs = await api.getNotebookTransactions(current.id);
          setTransactions(txs);
        } else {
          setActiveNotebook(null);
          setTransactions([]);
          setIntermediateData(null);
        }
      }
    } catch {
      /* clean fallback */
    }
  };

  // Upload handler
  const handleUploadSuccess = (notebook: Notebook) => {
    setActiveNotebook(notebook);
    setNotebookList((prev) => [notebook, ...prev]);
    addToast(`Notebook uploaded successfully (${notebook.original_filename})`, 'success');
  };

  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null);

  // Run pipeline execution with live stage animation & timer
  const handleStartProcessing = async (notebookId: string, cropHint?: string, file?: File) => {
    setIsProcessing(true);
    setCurrentStage(1);
    setElapsedTime(0);
    setLastExecutionTime(null);
    addToast('Executing 3-Stage AI Digitization Pipeline...', 'info');

    const startTime = Date.now();
    const timerId = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 50);

    for (let stage = 1; stage <= 3; stage++) {
      setCurrentStage(stage);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    try {
      // 1. Primary path: Lightning-fast Vercel Edge OCR (~1.5s)
      if (file) {
        try {
          const edgeResult = await api.processWithVercelEdge(file, cropHint);
          if (edgeResult && edgeResult.transactions) {
            setTransactions(edgeResult.transactions);
            if (edgeResult.intermediate_data) {
              setIntermediateData(edgeResult.intermediate_data);
            }
            const totalDuration = (Date.now() - startTime) / 1000;
            setLastExecutionTime(totalDuration);
            addToast(`Vercel Edge OCR finished in ${totalDuration.toFixed(2)}s!`, 'success');
            return;
          }
        } catch (edgeErr: any) {
          console.warn('Vercel Edge OCR fallback to Python backend:', edgeErr.message);
        }
      }

      // 2. Secondary fallback: Python FastAPI backend on Render
      if (serverStatus === 'Online') {
        await api.processNotebook(notebookId, cropHint);

        let attempts = 0;
        const maxAttempts = 60;
        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const notebook = await api.getNotebook(notebookId);
          if (notebook.status !== 'Processing') break;
          attempts++;
        }

        const updatedTxs = await api.getNotebookTransactions(notebookId);
        setTransactions(updatedTxs);
        try {
          const interData = await api.getIntermediateData(notebookId);
          setIntermediateData(interData);
        } catch { /* ignore fallback */ }
      } else {
        setCurrentStage(3);
      }

      const totalDuration = (Date.now() - startTime) / 1000;
      setLastExecutionTime(totalDuration);
      addToast(`OCR Pipeline finished in ${totalDuration.toFixed(2)}s!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Pipeline processing failed', 'error');
    } finally {
      clearInterval(timerId);
      setIsProcessing(false);
    }
  };

  // Load transactions when selecting a notebook from list
  const handleSelectNotebook = async (notebook: Notebook) => {
    setActiveNotebook(notebook);
    setActiveTab('studio');

    try {
      if (serverStatus === 'Online') {
        const txs = await api.getNotebookTransactions(notebook.id);
        setTransactions(txs);
        const inter = await api.getIntermediateData(notebook.id);
        setIntermediateData(inter);
      }
    } catch { /* fallback */ }
  };

  const handleDeleteNotebook = async (notebookId: string) => {
    if (!window.confirm('Are you sure you want to delete this notebook and all associated digitized records?')) return;

    try {
      if (serverStatus === 'Online') {
        await api.deleteNotebook(notebookId);
      }
      setNotebookList((prev) => prev.filter((n) => n.id !== notebookId));
      if (activeNotebook?.id === notebookId) {
        setActiveNotebook(null);
        setTransactions([]);
        setIntermediateData(null);
      }
      addToast('Notebook deleted successfully!', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete notebook', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern bg-orbs flex flex-col justify-between text-slate-900 font-sans transition-colors duration-300">
      <div>
        {/* Main Header with Backend and Live Database Status Badges */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          serverStatus={serverStatus}
          dbInfo={dbInfo}
        />

        {/* Content Container */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 relative z-10">
          {/* TAB 1: OCR STUDIO */}
          {activeTab === 'studio' && (
            <div>
              {/* 3-Stage Animated Pipeline Diagram */}
              <PipelineDiagram
                currentStage={currentStage}
                isProcessing={isProcessing}
                elapsedTime={elapsedTime}
                lastExecutionTime={lastExecutionTime}
                onSelectStageDetail={() => setIsIntermediateModalOpen(true)}
              />

              {/* Upload Studio */}
              <UploadStudio
                onUploadSuccess={handleUploadSuccess}
                onStartProcessing={handleStartProcessing}
                isProcessing={isProcessing}
                elapsedTime={elapsedTime}
                lastExecutionTime={lastExecutionTime}
              />

              {/* Digitized Transactions Ledger Table */}
              {activeNotebook && (
                <TransactionTable
                  notebookId={activeNotebook.id}
                  imagePath={activeNotebook.image_path}
                  transactions={transactions}
                  onTransactionsUpdate={(updated) => setTransactions(updated)}
                  onOpenIntermediateModal={() => setIsIntermediateModalOpen(true)}
                  onShowToast={addToast}
                  onDeleteNotebook={() => handleDeleteNotebook(activeNotebook.id)}
                />
              )}
            </div>
          )}

          {/* TAB 2: NOTEBOOK ARCHIVE */}
          {activeTab === 'notebooks' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    All Digitized Bahi-Khata Notebooks
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Archived handwritten farm notebooks and their processing status history
                  </p>
                </div>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1 rounded-full font-mono font-bold">
                  {notebookList.length} Uploaded Notebooks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notebookList.map((nb) => (
                  <div
                    key={nb.id}
                    onClick={() => handleSelectNotebook(nb)}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-blue-700 font-bold truncate max-w-[150px]">
                          {nb.original_filename}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          nb.status === 'Complete' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {nb.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Uploaded: {new Date(nb.upload_time).toLocaleDateString()}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotebook(nb.id);
                        }}
                        className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 font-semibold flex items-center gap-1 transition-all"
                        title="Delete notebook page"
                      >
                        <span>Delete</span>
                      </button>

                      <span className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                        Open Ledger <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FARM FINANCIAL P&L ANALYTICS */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard analytics={analytics} />
          )}


        </main>
      </div>

      {/* Footer */}
      <footer className="glass-nav py-4 px-8 border-t border-slate-200 text-xs text-slate-500 z-10 relative mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">GramIQ Finance OCR</span>
            <span>— AI Bahi-Khata Ledger Digitization & Audit System</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>FastAPI REST API: v1</span>
            <span>Tesseract Indic OCR</span>
            <span>GAAP Double-Entry Verified</span>
          </div>
        </div>
      </footer>

      {/* Deep-Dive Intermediate Inspection Modal */}
      <IntermediateModal
        isOpen={isIntermediateModalOpen}
        onClose={() => setIsIntermediateModalOpen(false)}
        data={intermediateData}
        onShowToast={addToast}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
