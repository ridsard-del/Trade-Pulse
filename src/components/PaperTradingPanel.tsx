import React from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaperTrade, Language } from '../types';
import { translations } from '../utils/translations';

interface PaperTradingPanelProps {
  paperTrades: PaperTrade[];
  onCloseTrade: (tradeId: string) => void;
  onClearHistory: () => void;
  language: Language;
  simulatedBalance: number;
  onSelectTradeForTerminal?: (symbol: string) => void;
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  paperTrades,
  onCloseTrade,
  onClearHistory,
  language,
  simulatedBalance,
  onSelectTradeForTerminal,
}) => {
  const t = translations[language];

  const activeTrades = paperTrades.filter((t) => t.status === 'OPEN');
  const closedTrades = paperTrades.filter((t) => t.status !== 'OPEN');

  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + t.pnlUsd, 0);
  const totalUnrealizedPnl = activeTrades.reduce((acc, t) => acc + t.pnlUsd, 0);
  const winCount = closedTrades.filter((t) => t.pnlUsd > 0).length;
  const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-6">
      {/* Portfolio Header & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.paperTrading}</span>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                Simulation Sandbox
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'রিয়েল-টাইম মার্কেট প্রাইজ অনুযায়ী লাইভ PnL সহ রিস্ক-ফ্রি ট্রেড প্র্যাকটিস'
                : 'Zero-risk live execution simulator testing AI signals against real market ticks'}
            </p>
          </div>
        </div>

        {/* Quick Balance / PnL Ribbon */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 mr-1.5 font-sans">Sim Equity:</span>
            <span className="font-bold text-white">${((simulatedBalance || 0) + (totalUnrealizedPnl || 0)).toFixed(2)}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-500 mr-1.5 font-sans">Live PnL:</span>
            <span className={`font-bold ${(totalUnrealizedPnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(totalUnrealizedPnl || 0) >= 0 ? '+' : ''}${(totalUnrealizedPnl || 0).toFixed(2)}
            </span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 hidden sm:flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500 mr-1 font-sans">{t.winRate}:</span>
            <span className="font-bold text-amber-400">{(winRate || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Active Positions Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t.openPositions} ({activeTrades.length})</span>
          </h4>
        </div>

        {activeTrades.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 text-center text-xs text-slate-400">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="max-w-md mx-auto">{t.noPositions}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTrades.map((trade) => {
              const isLong = trade.direction === 'LONG';
              const isPos = trade.pnlUsd >= 0;
              return (
                <div
                  key={trade.id}
                  className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md"
                >
                  {/* Left: Symbol & Direction Badge */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-[11px] flex items-center gap-1 ${
                        isLong
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{trade.direction}</span>
                    </div>

                    <div>
                      <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                        <span>{trade.symbol}</span>
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">
                          {trade.leverage}x
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Entry: ${trade.entryPrice} • Live: ${trade.currentPrice}
                      </div>
                    </div>
                  </div>

                  {/* Middle: TP & SL targets */}
                  <div className="hidden md:flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">Stop Loss</span>
                      <span className="text-rose-400 font-bold">${trade.stopLoss}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">Target (TP2)</span>
                      <span className="text-emerald-400 font-bold">${trade.takeProfit2}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">Margin</span>
                      <span className="text-slate-200 font-bold">${(trade.marginUsd || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Right: Live PnL & Action Buttons */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-right font-mono">
                      <div className={`text-sm font-extrabold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}${(trade.pnlUsd || 0).toFixed(2)}
                      </div>
                      <div className={`text-[11px] font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({isPos ? '+' : ''}${(trade.pnlPercent || 0).toFixed(2)}%)
                      </div>
                    </div>

                    {onSelectTradeForTerminal && (
                      <button
                        id={`btn-view-trade-terminal-${trade.id}`}
                        onClick={() => onSelectTradeForTerminal(trade.symbol)}
                        className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                        title={language === 'bn' ? 'টার্মিনালে এই অ্যাসেট লোড ও এআই প্রেডিক্ট করুন' : 'Load this asset in terminal and run AI prediction'}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:text-slate-950" />
                        <span className="hidden sm:inline">{language === 'bn' ? 'টার্মিনালে লোড' : 'Inspect'}</span>
                      </button>
                    )}

                    <button
                      id={`btn-close-trade-${trade.id}`}
                      onClick={() => onCloseTrade(trade.id)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold px-3 py-1.5 rounded-xl text-xs border border-rose-500/30 transition-all cursor-pointer"
                    >
                      {t.closePosition}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trade History Section */}
      {closedTrades.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'ট্রেড হিস্ট্রি ও পারফরম্যান্স' : 'Completed Paper Trade History'} ({closedTrades.length})
            </h4>

            <button
              onClick={onClearHistory}
              className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{language === 'bn' ? 'হিস্ট্রি মুছুন' : 'Clear Log'}</span>
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40 rounded-xl bg-slate-950/60 border border-slate-800 p-1">
            {closedTrades.map((trade) => {
              const isPos = trade.pnlUsd >= 0;
              return (
                <div key={trade.id} className="p-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.direction === 'LONG' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                      {trade.direction}
                    </span>
                    <span className="font-bold text-white">{trade.symbol}</span>
                    <span className="text-[11px] text-slate-500">
                      ({trade.status.replace('_', ' ')})
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-[11px]">
                      Entry ${trade.entryPrice} → Exit ${trade.currentPrice}
                    </span>
                    <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}${ (trade.pnlUsd || 0).toFixed(2)} ({(trade.pnlPercent || 0).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
