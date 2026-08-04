import React, { useState, useEffect } from 'react';
import { CheckCircle2, Download, Plus, Trash2, Search, Filter, ShieldCheck, Eye, Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { Transaction } from '../types';
import { api, getImageUrl } from '../services/api';
import { ImageZoomModal } from './ImageZoomModal';

interface TransactionTableProps {
  notebookId: string;
  imagePath?: string;
  transactions: Transaction[];
  onTransactionsUpdate: (updated: Transaction[]) => void;
  onOpenIntermediateModal: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onDeleteNotebook?: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  notebookId,
  imagePath,
  transactions,
  onTransactionsUpdate,
  onOpenIntermediateModal,
  onShowToast,
  onDeleteNotebook
}) => {
  const [localRows, setLocalRows] = useState<Transaction[]>(transactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [isSaving, setIsSaving] = useState(false);
  const [showOriginalPage, setShowOriginalPage] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  useEffect(() => {
    setLocalRows(transactions);
  }, [transactions]);

  const handleCellChange = (id: string, field: keyof Transaction, value: any) => {
    setLocalRows(prev =>
      prev.map(row => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    const newTx: Transaction = {
      id: `new_${Date.now()}`,
      notebook_id: notebookId,
      transaction_date: new Date().toISOString().split('T')[0],
      description: 'Manual Ledger Entry',
      category: 'Labor',
      subcategory: 'Labor Charges',
      crop: 'Wheat',
      type: 'Expense',
      amount: 0,
      unit: '₹',
      ocr_confidence: 1.0,
      verified: true
    };
    const updated = [...localRows, newTx];
    setLocalRows(updated);
    onTransactionsUpdate(updated);
  };

  const handleDeleteRow = async (id: string) => {
    const updated = localRows.filter(r => r.id !== id);
    setLocalRows(updated);
    onTransactionsUpdate(updated);

    if (!id.startsWith('new_')) {
      try {
        await api.deleteTransaction(id);
        onShowToast('Transaction deleted', 'info');
      } catch (err) {
        onShowToast('Failed to delete transaction from backend', 'error');
      }
    }
  };

  const handleBatchVerify = async () => {
    setIsSaving(true);
    try {
      const verifiedRows = localRows.map(r => ({ ...r, verified: true }));
      setLocalRows(verifiedRows);

      const res = await api.batchVerifyTransactions(notebookId, verifiedRows);
      onTransactionsUpdate(verifiedRows);
      onShowToast(res.message || 'Transactions verified and saved successfully!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to verify transactions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!localRows.length) return;
    const headers = ['Date', 'Description', 'Type', 'Category', 'Subcategory', 'Crop', 'Amount', 'Unit', 'Verified', 'Confidence'];
    const csvRows = localRows.map(r => [
      r.transaction_date,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.type,
      r.category,
      r.subcategory || '',
      r.crop || '',
      r.amount,
      r.unit || '₹',
      r.verified ? 'Yes' : 'No',
      `${((r.ocr_confidence || 1) * 100).toFixed(0)}%`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GramIQ_Ledger_${notebookId.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('CSV exported successfully', 'success');
  };

  const filteredRows = localRows.filter(row => {
    const matchesSearch =
      row.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.crop?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || row.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalIncome = filteredRows.filter(r => r.type === 'Income').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalExpense = filteredRows.filter(r => r.type === 'Expense').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const netPnl = totalIncome - totalExpense;

  return (
    <div className="w-full glass-card rounded-2xl p-6 mb-8 transition-all duration-300">
      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Digitized Transaction Ledger</h2>
            <span className="badge-emerald text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold">
              {localRows.length} Records Extracted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inline editable OCR audit ledger. Modify extracted values and click <strong className="text-emerald-600">Batch Verify</strong> to commit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {imagePath && (
            <button
              onClick={() => setShowOriginalPage(!showOriginalPage)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all shadow-sm ${
                showOriginalPage
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 font-bold'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              }`}
              title="Cross-check extracted ledger records against physical handwritten notebook image"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{showOriginalPage ? 'Hide Notebook Page' : 'View Original Notebook Page'}</span>
            </button>
          )}

          <button
            onClick={onOpenIntermediateModal}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>View OCR Deep Dive</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-300 flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {onDeleteNotebook && (
            <button
              onClick={onDeleteNotebook}
              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 border border-red-200 flex items-center space-x-1.5 transition-all shadow-sm"
              title="Delete this notebook page and all its records"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Delete Notebook</span>
            </button>
          )}

          <button
            onClick={handleBatchVerify}
            disabled={isSaving || !localRows.length}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Verify & Commit Ledger</span>
          </button>
        </div>
      </div>

      {/* Collapsible Original Notebook Page Preview Banner */}
      {showOriginalPage && imagePath && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col md:flex-row items-center gap-4 transition-all">
          <div className="relative group cursor-pointer overflow-hidden rounded-lg border border-blue-300 shadow-md max-w-xs shrink-0" onClick={() => setIsZoomModalOpen(true)}>
            <img
              src={getImageUrl(imagePath)}
              alt="Handwritten Bahi-Khata Page"
              className="w-full max-h-48 object-contain bg-white"
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
              <Maximize2 className="w-4 h-4" />
              <span>Click to Zoom</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Original Handwritten Bahi-Khata Ledger Page
            </h4>
            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
              Compare each row in the extracted ledger table below directly against your physical handwritten notebook entry. Click the preview image to open a full-resolution zoom modal for audit verification.
            </p>
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="mt-3 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Open Fullscreen Zoom</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      <ImageZoomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        imageSrc={imagePath ? getImageUrl(imagePath) : null}
        title="Original Handwritten Bahi-Khata High-Resolution Scan"
      />

      {/* Filter and Search Sub-bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, category, crop..."
            className="w-full bg-white border border-slate-300 text-slate-900 text-xs pl-9 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          <button
            onClick={() => setFilterType('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              filterType === 'All' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('Expense')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              filterType === 'Expense' ? 'bg-red-100 text-red-700 border border-red-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilterType('Income')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              filterType === 'Income' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Description / Items</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Crop</th>
              <th className="py-3 px-3 text-right">Amount (₹)</th>
              <th className="py-3 px-3 text-center">Confidence</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No transaction records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const confidence = row.ocr_confidence || 0.95;
                const confColor =
                  confidence >= 0.85
                    ? 'badge-emerald'
                    : confidence >= 0.65
                    ? 'badge-amber'
                    : 'bg-red-100 text-red-700 border border-red-300';

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        value={row.transaction_date || ''}
                        onChange={(e) => handleCellChange(row.id, 'transaction_date', e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500 w-32"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={((row as any).description_en || row.description || '').replace(/^[\d\s./:-]+/, '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleCellChange(row.id, 'description', val);
                          handleCellChange(row.id, 'description_en', val);
                        }}
                        placeholder="Item name in English"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500 font-medium text-xs"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={row.type}
                        onChange={(e) => handleCellChange(row.id, 'type', e.target.value as 'Income' | 'Expense')}
                        className={`bg-white border border-slate-300 rounded px-2 py-1 font-bold focus:outline-none ${
                          row.type === 'Income' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        <option value="Expense" className="text-red-600">Expense</option>
                        <option value="Income" className="text-emerald-600">Income</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={row.category}
                        onChange={(e) => handleCellChange(row.id, 'category', e.target.value)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Labor">Labor (मजदूरी)</option>
                        <option value="Fertilizer">Fertilizer (खाद)</option>
                        <option value="Seeds">Seeds (बीज)</option>
                        <option value="Pesticides">Pesticides (कीटनाशक)</option>
                        <option value="Diesel/Fuel">Diesel/Fuel (डीजल)</option>
                        <option value="Crop Sale">Crop Sale (फसल बिक्री)</option>
                        <option value="Equipment Rental">Equipment Rental</option>
                        <option value="Misc">Misc (विविध)</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.crop || ''}
                        onChange={(e) => handleCellChange(row.id, 'crop', e.target.value)}
                        className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <input
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => handleCellChange(row.id, 'amount', parseFloat(e.target.value) || 0)}
                        className={`w-28 text-right bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold focus:outline-none focus:border-blue-500 ${
                          row.type === 'Income' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${confColor}`}>
                        {(confidence * 100).toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary Financial Totals & Add Row button */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleAddRow}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs text-blue-600 font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>Add Manual Entry</span>
        </button>

        <div className="flex items-center space-x-6 text-xs font-mono font-bold">
          <div className="text-slate-500">
            Income: <span className="text-emerald-600">₹{totalIncome.toLocaleString()}</span>
          </div>
          <div className="text-slate-500">
            Expenses: <span className="text-red-600">₹{totalExpense.toLocaleString()}</span>
          </div>
          <div className="text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
            Net P&L: <span className={netPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              ₹{netPnl.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
