import React, { useState } from 'react';
import { Cpu, FileText, BarChart3, BookOpen, Activity, AlertCircle, Sun, Moon, Settings, Check, X, Database } from 'lucide-react';
import { getApiBase } from '../services/api';
import { supabaseService } from '../services/supabase';

interface HeaderProps {
  activeTab: 'studio' | 'notebooks' | 'analytics' | 'dictionary';
  setActiveTab: (tab: 'studio' | 'notebooks' | 'analytics' | 'dictionary') => void;
  serverStatus: 'Online' | 'Offline' | 'Checking';
  dbInfo?: { status: string; type: string; connected: boolean };
  farmerId: string;
  setFarmerId: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  serverStatus,
  dbInfo,
  farmerId,
  setFarmerId
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBase());
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => localStorage.getItem('gramiq_supabase_url') || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => localStorage.getItem('gramiq_supabase_key') || '');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveSettings = () => {
    let cleanApi = apiUrlInput.trim();
    if (cleanApi.startsWith('postgresql://') || cleanApi.startsWith('postgres://') || cleanApi.includes('@')) {
      cleanApi = 'https://gramiq-finance-ocr-backend.onrender.com/api/v1';
      setApiUrlInput(cleanApi);
    }
    localStorage.setItem('gramiq_api_url', cleanApi);
    if (supabaseUrlInput && supabaseKeyInput) {
      supabaseService.setCredentials(supabaseUrlInput, supabaseKeyInput);
    } else {
      supabaseService.clearCredentials();
    }
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      setIsSettingsOpen(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <header className="sticky top-0 z-40 glass-nav px-4 lg:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-white dark:bg-[#0c1222] rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
                GramIQ Finance OCR
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full badge-cyan">
                v1.0 AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Indic Bahi-Khata Ledger Digitization & Audit Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>OCR Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('notebooks')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'notebooks'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notebooks</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Farm P&L Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'dictionary'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Indic Terms</span>
          </button>
        </nav>

        {/* Server Status, Farmer Selection, Theme Toggle & Settings */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Farmer Selection */}
          <div className="hidden xl:flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Farmer:</span>
            <select
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="bg-transparent text-xs text-blue-600 dark:text-cyan-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="FARMER_MH_401" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">MH-401 (Ramesh Patil)</option>
              <option value="FARMER_UP_108" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">UP-108 (Suresh Verma)</option>
              <option value="FARMER_GJ_204" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">GJ-204 (Vikram Patel)</option>
              <option value="FARMER_PB_309" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">PB-309 (Gurpreet Singh)</option>
            </select>
          </div>



          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Configure API & Supabase Credentials"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* 1. FastAPI Backend Status Pill */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
              serverStatus === 'Online'
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                : serverStatus === 'Checking'
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
            }`}
            title="FastAPI Render Backend Status"
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
                <Activity className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>API Waking Up...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span>API Offline</span>
              </>
            )}
          </div>

          {/* 2. Database Connection Status Pill */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
              dbInfo?.connected
                ? 'bg-blue-100 dark:bg-cyan-950/40 text-blue-700 dark:text-cyan-300 border-blue-300 dark:border-cyan-500/30'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
            title={`Database: ${dbInfo?.type || 'PostgreSQL / SQLite'} (${dbInfo?.status || 'Connecting'})`}
          >
            <Database className={`w-3.5 h-3.5 ${dbInfo?.connected ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'}`} />
            <span>{dbInfo?.connected ? dbInfo.type : 'DB Syncing...'}</span>
          </div>
        </div>
      </div>

      {/* API & Supabase Configuration Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                Configure FastAPI & Supabase Connection
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  1. FastAPI Backend Base URL:
                </label>
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="https://gramiq-finance-ocr-backend.onrender.com/api/v1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 p-2.5 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-cyan-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Database className="w-4 h-4" />
                  <span>2. Supabase Integration Credentials:</span>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Supabase Project URL:</label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 p-2 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Supabase Anon Key:</label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 p-2 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {savedMsg && (
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Credentials saved! Reloading connection...</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('gramiq_api_url');
                    supabaseService.clearCredentials();
                    setApiUrlInput('https://gramiq-finance-ocr-backend.onrender.com/api/v1');
                    setSupabaseUrlInput('');
                    setSupabaseKeyInput('');
                  }}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Reset Defaults
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-blue-500 hover:to-cyan-500"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
