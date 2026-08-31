import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  Globe, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Layers, 
  Bot,
  RefreshCw
} from 'lucide-react';
import { MarketAsset, Language } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  assets: MarketAsset[];
  selectedAsset: MarketAsset;
  onSelectAsset: (asset: MarketAsset) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  activeTab: 'terminal' | 'calculator' | 'scanner' | 'mentor' | 'portfolio';
  setActiveTab: (tab: 'terminal' | 'calculator' | 'scanner' | 'mentor' | 'portfolio') => void;
  isPredicting: boolean;
  onRunPrediction: () => void;
  wsConnected?: boolean;
  latency?: number;
}

export const Header: React.FC<HeaderProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  language,
  onToggleLanguage,
  activeTab,
  setActiveTab,
  isPredicting,
  onRunPrediction,
  wsConnected = true,
  latency = 12,
}) => {
  const t = translations[language];

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Ticker Ribbon */}
      <div className="w-full bg-slate-950/90 border-b border-slate-800/50 py-1.5 px-4 overflow-x-auto no-scrollbar flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[10px] ${
            wsConnected ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            <span className="relative flex h-2 w-2">
              {wsConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span>{wsConnected ? 'WS LIVE' : 'CONNECTING...'}</span>
          </div>
          {wsConnected && (
            <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
              {latency}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 shrink-0">
          {assets.slice(0, 8).map((asset) => {
            const isPos = (asset.change24h ?? 0) >= 0;
            const isSelected = asset.symbol === selectedAsset.symbol;
            const dec = asset.decimals ?? 2;
            return (
              <button
                key={asset.symbol}
                onClick={() => onSelectAsset(asset)}
                className={`flex items-center gap-2 hover:text-white transition-colors cursor-pointer py-0.5 px-1.5 rounded ${
                  isSelected ? 'bg-slate-800 text-white font-medium ring-1 ring-emerald-500/40' : 'text-slate-400'
                }`}
              >
                <span className="font-bold text-slate-200">{asset.symbol}</span>
                <span className="text-slate-300">${(asset.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}</span>
                <span className={`flex items-center text-[11px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? '+' : ''}{(asset.change24h ?? 0).toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto hidden md:flex items-center gap-4 text-slate-400 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            <span className="text-slate-400">{t.fearGreed}:</span>
            <span className="text-emerald-400 font-bold">68 ({t.greed})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Risk Guard: Active</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>{language === 'bn' ? 'ট্রেডপালস' : 'TradePulse'}</span>
                <span className="text-emerald-400 font-extrabold text-sm sm:text-base bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">AI</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {language === 'bn' ? 'স্মার্ট মার্কেট প্রেডিকশন ও এন্ট্রি-এক্সিট ক্যালকুলেটর' : 'Real-time Market Structure & Trade Calculator'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-medium">
          <button
            id="tab-terminal-btn"
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'terminal'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'টার্মিনাল ও চার্ট' : 'Terminal'}</span>
          </button>

          <button
            id="tab-calculator-btn"
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'calculator'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'রিস্ক ক্যালকুলেটর' : 'Calculator'}</span>
          </button>

          <button
            id="tab-scanner-btn"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'scanner'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'এআই স্ক্যানার' : 'AI Scanner'}</span>
          </button>

          <button
            id="tab-mentor-btn"
            onClick={() => setActiveTab('mentor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'mentor'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'এআই মেন্টর' : 'AI Mentor'}</span>
          </button>

          <button
            id="tab-portfolio-btn"
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'portfolio'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'পেপার ট্রেডিং' : 'Paper Trade'}</span>
          </button>
        </div>

        {/* Right Actions: AI Run Prediction Button & Language Switch */}
        <div className="flex items-center gap-2">
          {/* Quick AI Trigger */}
          <button
            id="btn-run-ai-prediction-header"
            onClick={onRunPrediction}
            disabled={isPredicting}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPredicting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{language === 'bn' ? 'এনালাইজ হচ্ছে...' : 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>{language === 'bn' ? 'এআই প্রেডিক্ট' : 'Predict Trade'}</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
            <button
              id="lang-bn-btn"
              onClick={() => onToggleLanguage('bn')}
              className={`px-2 py-1 rounded transition-all ${
                language === 'bn'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              বাংলা
            </button>
            <button
              id="lang-en-btn"
              onClick={() => onToggleLanguage('en')}
              className={`px-2 py-1 rounded transition-all ${
                language === 'en'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
