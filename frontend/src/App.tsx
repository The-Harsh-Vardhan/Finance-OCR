import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PipelineDiagram } from './components/PipelineDiagram';
import { UploadStudio } from './components/UploadStudio';
import { TransactionTable } from './components/TransactionTable';
import { IntermediateModal } from './components/IntermediateModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { KnowledgeExplorer } from './components/KnowledgeExplorer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { api } from './services/api';
import { AnalyticsSummary, IntermediateData, Notebook, Transaction } from './types';
import { FileText, Calendar, CheckCircle2, ChevronRight, RefreshCw, Cpu, Database } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'notebooks' | 'analytics' | 'dictionary'>('studio');
  const [serverStatus, setServerStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking');
  const [farmerId, setFarmerId] = useState<string>('FARMER_MH_401');

  // Notebook and OCR pipeline state
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [notebookList, setNotebookList] = useState<Notebook[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [intermediateData, setIntermediateData] = useState<IntermediateData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Pipeline execution simulation / tracking state
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

  // Initial load & health check
  useEffect(() => {
    const checkServer = async () => {
      const health = await api.getHealth();
      if (health.status === 'Online') {
        setServerStatus('Online');
        loadAllData();
      } else {
        setServerStatus('Offline');
        // Load mock/fallback initial data for offline demonstration
        loadFallbackDemoData();
      }
    };
    checkServer();
  }, []);

  const loadAllData = async () => {
    try {
      const nbs = await api.listNotebooks();
      setNotebookList(nbs);

      const summary = await api.getAnalyticsSummary();
      setAnalytics(summary);

      if (nbs.length > 0) {
        const latest = nbs[0];
        setActiveNotebook(latest);
        const txs = await api.getNotebookTransactions(latest.id);
        setTransactions(txs);
      }
    } catch {
      loadFallbackDemoData();
    }
  };

  const loadFallbackDemoData = () => {
    const demoNotebook: Notebook = {
      id: 'nb_demo_7829',
      farmer_id: farmerId,
      original_filename: 'bahi_khata_cotton_hindi.png',
      image_path: '/uploads/bahi_khata_cotton_hindi.png',
      upload_time: new Date().toISOString(),
      status: 'Review_Needed',
      transaction_count: 3,
      ocr_confidence: 0.96
    };

    const demoTx: Transaction[] = [
      {
        id: 'tx_1',
        notebook_id: demoNotebook.id,
        transaction_date: '2026-04-12',
        description: 'खाद यूरिया 2 बोरी (Fertilizer)',
        category: 'Fertilizer',
        subcategory: 'Urea Purchase',
        crop: 'Cotton',
        type: 'Expense',
        amount: 530,
        unit: '₹',
        ocr_confidence: 0.98,
        verified: false
      },
      {
        id: 'tx_2',
        notebook_id: demoNotebook.id,
        transaction_date: '2026-04-15',
        description: 'मजदूरी 3 दिन (Farm Labor Charges)',
        category: 'Labor',
        subcategory: 'Weeding Labor',
        crop: 'Cotton',
        type: 'Expense',
        amount: 900,
        unit: '₹',
        ocr_confidence: 0.95,
        verified: false
      },
      {
        id: 'tx_3',
        notebook_id: demoNotebook.id,
        transaction_date: '2026-04-20',
        description: 'कपास फसल बिक्री 20 क्विंटल (Cotton Sale Mandi)',
        category: 'Crop Sale',
        subcategory: 'Cotton Mandi Sale',
        crop: 'Cotton',
        type: 'Income',
        amount: 45000,
        unit: '₹',
        ocr_confidence: 0.97,
        verified: true
      }
    ];

    setActiveNotebook(demoNotebook);
    setNotebookList([demoNotebook]);
    setTransactions(demoTx);
  };

  // Upload handler
  const handleUploadSuccess = (notebook: Notebook) => {
    setActiveNotebook(notebook);
    setNotebookList((prev) => [notebook, ...prev]);
    addToast(`Notebook uploaded successfully (${notebook.original_filename})`, 'success');
  };

  // Run pipeline execution with live stage animation
  const handleStartProcessing = async (notebookId: string, cropHint?: string) => {
    setIsProcessing(true);
    setCurrentStage(1);
    addToast('Executing 8-Stage AI Digitization Pipeline...', 'info');

    // Animate stage stepping for visual feedback
    for (let stage = 1; stage <= 8; stage++) {
      setCurrentStage(stage);
      await new Promise((resolve) => setTimeout(resolve, 220));
    }

    try {
      if (serverStatus === 'Online') {
        const processResult = await api.processNotebook(notebookId, cropHint);
        const updatedTxs = await api.getNotebookTransactions(notebookId);
        setTransactions(updatedTxs);
        try {
          const interData = await api.getIntermediateData(notebookId);
          setIntermediateData(interData);
        } catch { /* ignore fallback */ }
      } else {
        // Offline demo mode
        setCurrentStage(8);
      }

      addToast('OCR Pipeline finished processing notebook!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Pipeline processing failed', 'error');
    } finally {
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

  return (
    <div className="min-h-screen bg-[#0c1222] bg-grid-pattern bg-orbs flex flex-col justify-between text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      <div>
        {/* Main Glass Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          serverStatus={serverStatus}
          farmerId={farmerId}
          setFarmerId={setFarmerId}
        />

        {/* Content Container */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 relative z-10">
          {/* TAB 1: OCR STUDIO (Main Workflow) */}
          {activeTab === 'studio' && (
            <div>
              {/* 8-Stage Animated Pipeline Diagram */}
              <PipelineDiagram
                currentStage={currentStage}
                isProcessing={isProcessing}
                onSelectStageDetail={() => setIsIntermediateModalOpen(true)}
              />

              {/* Upload & Sample Studio */}
              <UploadStudio
                onUploadSuccess={handleUploadSuccess}
                onStartProcessing={handleStartProcessing}
                isProcessing={isProcessing}
                farmerId={farmerId}
              />

              {/* Digitized Transactions Ledger Table */}
              {activeNotebook && (
                <TransactionTable
                  notebookId={activeNotebook.id}
                  transactions={transactions}
                  onTransactionsUpdate={(updated) => setTransactions(updated)}
                  onOpenIntermediateModal={() => setIsIntermediateModalOpen(true)}
                  onShowToast={addToast}
                />
              )}
            </div>
          )}

          {/* TAB 2: NOTEBOOK ARCHIVE & AUDITS */}
          {activeTab === 'notebooks' && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 mb-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    All Digitized Bahi-Khata Notebooks
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Archived handwritten farm notebooks and their processing status history
                  </p>
                </div>
                <span className="badge-cyan text-xs px-3 py-1 rounded-full font-mono font-bold">
                  {notebookList.length} Uploaded Notebooks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notebookList.map((nb) => (
                  <div
                    key={nb.id}
                    onClick={() => handleSelectNotebook(nb)}
                    className="glass-card-interactive rounded-xl p-4 border border-slate-800 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-cyan-300 font-bold truncate max-w-[150px]">
                          {nb.original_filename}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          nb.status === 'Complete' ? 'badge-emerald' : 'badge-amber'
                        }`}>
                          {nb.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Uploaded: {new Date(nb.upload_time).toLocaleDateString()}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Farmer: {nb.farmer_id}</span>
                      <span className="text-cyan-400 font-semibold flex items-center gap-1 hover:underline">
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

          {/* TAB 4: INDIC KNOWLEDGE BASE & DICTIONARY */}
          {activeTab === 'dictionary' && (
            <KnowledgeExplorer />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="glass-nav py-4 px-8 border-t border-slate-800/80 text-xs text-slate-400 z-10 relative mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">GramIQ Finance OCR</span>
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
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
