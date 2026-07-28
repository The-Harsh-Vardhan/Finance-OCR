import React from 'react';
import { Cpu, FileText, BarChart3, BookOpen, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'notebooks' | 'analytics' | 'dictionary';
  setActiveTab: (tab: 'studio' | 'notebooks' | 'analytics' | 'dictionary') => void;
  serverStatus: 'Online' | 'Offline' | 'Checking';
  farmerId: string;
  setFarmerId: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  serverStatus,
  farmerId,
  setFarmerId
}) => {
  return (
    <header className="sticky top-0 z-40 glass-nav px-4 lg:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0c1222] rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                GramIQ Finance OCR
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full badge-cyan">
                v1.0 AI
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Indic Bahi-Khata Ledger Digitization & Audit Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>OCR Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('notebooks')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'notebooks'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notebooks</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Farm P&L Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'dictionary'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Indic Terms</span>
          </button>
        </nav>

        {/* Server Status & Farmer ID selector */}
        <div className="flex items-center space-x-3">
          {/* Farmer Selection */}
          <div className="hidden xl:flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-400 font-medium">Farmer:</span>
            <select
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="bg-transparent text-xs text-cyan-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="FARMER_MH_401" className="bg-slate-900 text-slate-200">MH-401 (Ramesh Patil)</option>
              <option value="FARMER_UP_108" className="bg-slate-900 text-slate-200">UP-108 (Suresh Verma)</option>
              <option value="FARMER_GJ_204" className="bg-slate-900 text-slate-200">GJ-204 (Vikram Patel)</option>
              <option value="FARMER_PB_309" className="bg-slate-900 text-slate-200">PB-309 (Gurpreet Singh)</option>
            </select>
          </div>

          {/* Backend Status Pill */}
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
              serverStatus === 'Online'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : serverStatus === 'Checking'
                ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                : 'bg-red-950/40 text-red-400 border-red-500/30'
            }`}
          >
            {serverStatus === 'Online' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>FastAPI Active</span>
              </>
            ) : serverStatus === 'Checking' ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span>API Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
