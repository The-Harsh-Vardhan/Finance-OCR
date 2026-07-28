import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BookOpen, ShieldCheck, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { AnalyticsSummary } from '../types';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
}

const COLORS = ['#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  const defaultAnalytics: AnalyticsSummary = analytics || {
    total_notebooks: 14,
    total_transactions: 86,
    verified_transactions: 82,
    unverified_transactions: 4,
    total_expenses: 124500,
    total_income: 385000,
    net_profit_loss: 260500,
    category_breakdown: [
      { category: 'Labor', total_amount: 45000, percentage: 36.1, transaction_count: 24 },
      { category: 'Fertilizer', total_amount: 32000, percentage: 25.7, transaction_count: 18 },
      { category: 'Seeds', total_amount: 18500, percentage: 14.8, transaction_count: 12 },
      { category: 'Diesel/Fuel', total_amount: 16000, percentage: 12.8, transaction_count: 15 },
      { category: 'Pesticides', total_amount: 13000, percentage: 10.4, transaction_count: 17 },
    ],
    crop_breakdown: [
      { crop: 'Wheat', total_expense: 38000, total_income: 145000, net_profit: 107000 },
      { crop: 'Cotton', total_expense: 42000, total_income: 120000, net_profit: 78000 },
      { crop: 'Sugarcane', total_expense: 28000, total_income: 85000, net_profit: 57000 },
      { crop: 'Soybean', total_expense: 16500, total_income: 35000, net_profit: 18500 },
    ]
  };

  const verificationRate = ((defaultAnalytics.verified_transactions / (defaultAnalytics.total_transactions || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6 mb-8">
      {/* Top Row KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Farm Profit */}
        <div className="glass-card-interactive rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Net Farm Profit</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            ₹{defaultAnalytics.net_profit_loss.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">+68.3%</span> vs previous season
          </p>
        </div>

        {/* Card 2: Total Income */}
        <div className="glass-card-interactive rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Farm Income</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-300">
            ₹{defaultAnalytics.total_income.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            From crop sales & mandi revenue
          </p>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="glass-card-interactive rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Total Farm Expenses</span>
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-red-400">
            ₹{defaultAnalytics.total_expenses.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Labor, fertilizer, seeds & diesel
          </p>
        </div>

        {/* Card 4: Verification Rate & Notebooks */}
        <div className="glass-card-interactive rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Audit Verification Rate</span>
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-teal-300">
            {verificationRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {defaultAnalytics.verified_transactions} of {defaultAnalytics.total_transactions} tx verified ({defaultAnalytics.total_notebooks} pages)
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Expense Breakdown (Pie Chart) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <PieIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Expense Breakdown by Category</h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defaultAnalytics.category_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="total_amount"
                  nameKey="category"
                >
                  {defaultAnalytics.category_breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Table */}
          <div className="mt-4 space-y-2 pt-3 border-t border-slate-800 text-xs">
            {defaultAnalytics.category_breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-300 font-medium">{item.category}</span>
                </div>
                <span className="font-mono text-slate-400">
                  ₹{item.total_amount.toLocaleString()} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Crop Net Profitability Comparison (Bar Chart) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Crop Profitability & Income vs Expense</h3>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defaultAnalytics.crop_breakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="total_income" name="Income (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_expense" name="Expense (₹)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_profit" name="Net Profit (₹)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
