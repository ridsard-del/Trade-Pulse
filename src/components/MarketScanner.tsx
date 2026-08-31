import React, { useState } from 'react';
import { 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Search,
  CheckCircle2,
  Play
} from 'lucide-react';
import { MarketAsset, Language, TradeSignal } from '../types';
import { translations } from '../utils/translations';

interface ScannedSetup {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change24h: number;
  signalType: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  marketStructure: string;
  bengaliHeadline: string;
  dataSource?: string;
}

interface MarketScannerProps {
  scannedSetups: ScannedSetup[];
  onSelectAndAnalyze: (symbol: string) => void;
  language: Language;
  isLoading: boolean;
  onRefreshScan: () => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({
  scannedSetups,
  onSelectAndAnalyze,
  language,
  isLoading,
  onRefreshScan,
}) => {
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'crypto' | 'forex' | 'stock' | 'commodity'>('ALL');
  const [search, setSearch] = useState('');
  const t = translations[language];

  const filtered = scannedSetups.filter((item) => {
    const matchDir = filterDirection === 'ALL' || item.direction === filterDirection;
    const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
    const matchSearch = item.symbol.toLowerCase().includes(search.toLowerCase()) || item.name.toLowerCase().includes(search.toLowerCase());
    return matchDir && matchCat && matchSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-5">
      {/* Scanner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.marketScanner}</span>
              <span className="text-xs font-mono font-normal bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {scannedSetups.length} Setups Scanned
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'এআই দিয়ে স্বয়ংক্রিয়ভাবে চিহ্নিত সেরা রিস্ক-রিওয়ার্ড ট্রেড সেটআপসমূহ'
                : 'Automated AI scan identifying high-confluence institutional trading setups'}
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshScan}
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{language === 'bn' ? 'পুনরায় স্ক্যান করুন' : 'Refresh Scanner'}</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.searchAsset}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Direction & Category Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Direction Filter */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            {(['ALL', 'LONG', 'SHORT'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFilterDirection(dir)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterDirection === dir
                    ? dir === 'LONG'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : dir === 'SHORT'
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            {(['ALL', 'crypto', 'forex', 'commodity', 'stock'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium uppercase transition-all ${
                  filterCategory === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Setups Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            {language === 'bn' ? 'কোনো স্ক্যান ফলাফল মেলেনি' : 'No trade setups match the active filters.'}
          </div>
        ) : (
          filtered.map((setup) => {
            const isLong = setup.direction === 'LONG';
            return (
              <div
                key={setup.symbol}
                className="bg-slate-950/90 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group"
              >
                {/* Top Row: Symbol, Category & Signal Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
                        <span>{setup.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-normal uppercase">({setup.category})</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300">
                        ${(setup.price ?? 0).toLocaleString()} ({(setup.change24h ?? 0) >= 0 ? '+' : ''}{(setup.change24h ?? 0).toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-[11px] flex items-center gap-1 shadow ${
                      isLong
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                        : 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                    }`}
                  >
                    {isLong ? <ArrowUpRight className="w-3 h-3 stroke-[3]" /> : <ArrowDownRight className="w-3 h-3 stroke-[3]" />}
                    <span>{setup.signalType}</span>
                  </div>
                </div>

                {/* Structure / Headline */}
                <div className="text-xs text-slate-300 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-emerald-400 font-semibold mb-0.5">
                    {language === 'bn' ? setup.bengaliHeadline : setup.marketStructure}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{language === 'bn' ? 'কনফ্লুয়েন্স স্কোর' : 'Confluence'}: <strong className="text-slate-200">{setup.confidence}/100</strong></span>
                    <span>R:R: <strong className="text-emerald-400 font-extrabold">1:{setup.riskRewardRatio}</strong></span>
                  </div>
                </div>

                {/* Key Levels (Entry, SL, TP) */}
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                    <div className="text-[9px] text-cyan-400 font-sans uppercase">Entry</div>
                    <div className="font-bold text-white">${setup.entry}</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                    <div className="text-[9px] text-rose-400 font-sans uppercase">Stop Loss</div>
                    <div className="font-bold text-rose-400">${setup.stopLoss}</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                    <div className="text-[9px] text-emerald-400 font-sans uppercase">TP Target</div>
                    <div className="font-bold text-emerald-400">${setup.takeProfit2}</div>
                  </div>
                </div>

                {/* 1-Click Load into Chart & Terminal */}
                <button
                  id={`btn-load-scanner-${setup.symbol}`}
                  onClick={() => onSelectAndAnalyze(setup.symbol)}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{language === 'bn' ? 'চার্টে লোড ও এনালাইজ করুন' : 'Load Setup & Chart'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
