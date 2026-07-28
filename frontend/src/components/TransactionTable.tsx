import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save, Download, Plus, Trash2, Search, Filter, ShieldCheck, AlertTriangle, HelpCircle, Eye } from 'lucide-react';
import { Transaction } from '../types';
import { api } from '../services/api';

interface TransactionTableProps {
  notebookId: string;
  transactions: Transaction[];
  onTransactionsUpdate: (updated: Transaction[]) => void;
  onOpenIntermediateModal: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  notebookId,
  transactions,
  onTransactionsUpdate,
  onOpenIntermediateModal,
  onShowToast
}) => {
  const [localRows, setLocalRows] = useState<Transaction[]>(transactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [isSaving, setIsSaving] = useState(false);

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
      // Mark all rows as verified locally
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

  // Filtered rows
  const filteredRows = localRows.filter(row => {
    const matchesSearch =
      row.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.crop?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || row.type === filterType;
    return matchesSearch && matchesType;
  });

  // Financial totals
  const totalIncome = filteredRows.filter(r => r.type === 'Income').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalExpense = filteredRows.filter(r => r.type === 'Expense').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const netPnl = totalIncome - totalExpense;

  return (
    <div className="w-full glass-card rounded-2xl p-6 border border-slate-800/80 mb-8">
      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Digitized Transaction Ledger</h2>
            <span className="badge-emerald text-[11px] px-2.5 py-0.5 rounded-full font-mono">
              {localRows.length} Records Extracted
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inline editable OCR audit ledger. Modify extracted values and click <strong className="text-emerald-400">Batch Verify</strong> to commit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenIntermediateModal}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-cyan-500/30 flex items-center space-x-1.5 transition-all"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>View OCR Deep Dive</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleBatchVerify}
            disabled={isSaving || !localRows.length}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Verify & Commit Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Sub-bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, category, crop..."
            className="w-full bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs pl-9 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          <button
            onClick={() => setFilterType('All')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              filterType === 'All' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('Expense')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              filterType === 'Expense' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilterType('Income')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              filterType === 'Income' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
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
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
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
                    : 'bg-red-950/50 text-red-400 border border-red-500/40';

                return (
                  <tr key={row.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Date */}
                    <td className="py-2.5 px-3">
                      <input
                        type="date"
                        value={row.transaction_date || ''}
                        onChange={(e) => handleCellChange(row.id, 'transaction_date', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 w-32"
                      />
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.description || ''}
                        onChange={(e) => handleCellChange(row.id, 'description', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3">
                      <select
                        value={row.type}
                        onChange={(e) => handleCellChange(row.id, 'type', e.target.value as 'Income' | 'Expense')}
                        className={`bg-slate-900 border border-slate-800 rounded px-2 py-1 font-bold focus:outline-none ${
                          row.type === 'Income' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        <option value="Expense" className="text-red-400">Expense</option>
                        <option value="Income" className="text-emerald-400">Income</option>
                      </select>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3">
                      <select
                        value={row.category}
                        onChange={(e) => handleCellChange(row.id, 'category', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
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

                    {/* Crop */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={row.crop || ''}
                        onChange={(e) => handleCellChange(row.id, 'crop', e.target.value)}
                        className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <input
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => handleCellChange(row.id, 'amount', parseFloat(e.target.value) || 0)}
                        className={`w-28 text-right bg-slate-900 border border-slate-800 rounded px-2 py-1 font-mono font-bold focus:outline-none focus:border-cyan-500 ${
                          row.type === 'Income' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      />
                    </td>

                    {/* Confidence */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${confColor}`}>
                        {(confidence * 100).toFixed(0)}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
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
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handleAddRow}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-semibold flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Add Manual Entry</span>
        </button>

        {/* Live Financial Totals */}
        <div className="flex items-center space-x-6 text-xs font-mono font-bold">
          <div className="text-slate-400">
            Income: <span className="text-emerald-400">₹{totalIncome.toLocaleString()}</span>
          </div>
          <div className="text-slate-400">
            Expenses: <span className="text-red-400">₹{totalExpense.toLocaleString()}</span>
          </div>
          <div className="text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            Net P&L: <span className={netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              ₹{netPnl.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
