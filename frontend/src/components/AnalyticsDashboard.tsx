import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShieldCheck, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { AnalyticsSummary } from '../types';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
}

const COLORS = ['#0284c7', '#0d9488', '#16a34a', '#d97706', '#ec4899', '#8b5cf6', '#0891b2'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading analytics from database...</p>
        <p className="text-xs text-slate-400 mt-1">Connect the backend to sync real farm data</p>
      </div>
    );
  }

  const verificationRate = ((analytics.verified_transactions / (analytics.total_transactions || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6 mb-8 transition-all duration-300">
      {/* Top Row KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Farm Profit */}
        <div className="glass-card-interactive rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Net Farm Profit</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600">
            ₹{analytics.net_profit_loss.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">+68.3%</span> vs previous season
          </p>
        </div>

        {/* Card 2: Total Income */}
        <div className="glass-card-interactive rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Farm Income</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-600">
            ₹{analytics.total_income.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            From crop sales & mandi revenue
          </p>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="glass-card-interactive rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Farm Expenses</span>
            <div className="p-2 rounded-xl bg-red-100 text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-red-600">
            ₹{analytics.total_expenses.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Labor, fertilizer, seeds & diesel
          </p>
        </div>

        {/* Card 4: Verification Rate & Notebooks */}
        <div className="glass-card-interactive rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Audit Verification Rate</span>
            <div className="p-2 rounded-xl bg-teal-100 text-teal-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-teal-700">
            {verificationRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {analytics.verified_transactions} of {analytics.total_transactions} tx verified ({analytics.total_notebooks} pages)
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Expense Breakdown */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PieIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Expense Breakdown by Category</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.category_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="total_amount"
                  nameKey="category"
                >
                  {analytics.category_breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2 pt-3 border-t border-slate-200 text-xs">
            {analytics.category_breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-700 font-medium">{item.category}</span>
                </div>
                <span className="font-mono text-slate-500">
                  ₹{item.total_amount.toLocaleString()} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Crop Net Profitability Comparison */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Crop Profitability & Income vs Expense</h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.crop_breakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="crop" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="total_income" name="Income (₹)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_expense" name="Expense (₹)" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_profit" name="Net Profit (₹)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
