import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  CheckCircle2, 
  Copy, 
  Check, 
  Calculator, 
  PlayCircle, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Info
} from 'lucide-react';
import { TradeSignal, Language, MarketAsset } from '../types';
import { translations } from '../utils/translations';

interface TradePredictionCardProps {
  signal: TradeSignal | null;
  asset: MarketAsset;
  isPredicting: boolean;
  onRunPrediction: () => void;
  onApplyToCalculator: (signal: TradeSignal) => void;
  onOpenPaperTrade: (signal: TradeSignal) => void;
  language: Language;
}

export const TradePredictionCard: React.FC<TradePredictionCardProps> = ({
  signal,
  asset,
  isPredicting,
  onRunPrediction,
  onApplyToCalculator,
  onOpenPaperTrade,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[language];

  const handleCopySetup = () => {
    if (!signal) return;
    const text = `📊 TradePulse AI Signal: ${signal.symbol} (${signal.direction})\n` +
      `⚡ Action: ${signal.signalType}\n` +
      `🎯 Ideal Entry: $${signal.entryZone.ideal}\n` +
      `🛑 Stop Loss: $${signal.stopLoss} (-${signal.potentialLossPercent}%)\n` +
      `🚀 TP 1: $${signal.takeProfit1}\n` +
      `🚀 TP 2: $${signal.takeProfit2} (+${signal.potentialGainPercent}%)\n` +
      `🚀 TP 3: $${signal.takeProfit3}\n` +
      `⚖️ Risk/Reward: 1:${signal.riskRewardRatio}\n` +
      `🧠 AI Confidence: ${signal.confidence}%`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isPredicting) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-ping absolute inset-0"></div>
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center relative shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {language === 'bn' ? `${asset.symbol} মার্কেট ডাটা এনালাইজ হচ্ছে...` : `Analyzing ${asset.symbol} live market structure...`}
        </h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          {language === 'bn' 
            ? 'রিয়েল-টাইম ক্যান্ডেলস্টিক, RSI, MACD, EMA সাপোর্ট এবং লিকুইডিটি পুল স্ক্যান করে এন্ট্রি ও এক্সিট পয়েন্ট ক্যালকুলেট করা হচ্ছে...' 
            : 'Scanning candlestick momentum, volume confluence, support/resistance clusters, and calculating optimal risk-reward entry and exits...'}
        </p>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center justify-center min-h-[380px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-emerald-400 shadow-inner">
          <Zap className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {language === 'bn' ? 'স্মার্ট এআই ট্রেড সিগন্যাল তৈরি করুন' : 'Generate AI Trade Setup'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          {language === 'bn'
            ? `${asset.name} (${asset.symbol}) এর রিয়েল-টাইম মার্কেট ডাটা দেখে সুনির্দিষ্ট এন্ট্রি জোন, স্টপ লস ও টেক প্রফিট (TP 1, TP 2, TP 3) ক্যালকুলেট করুন।`
            : `Run deep technical neural analysis for ${asset.name} (${asset.symbol}) to calculate instant entry, stop loss, and multi-tier take profit targets.`}
        </p>
        <button
          id="btn-trigger-ai-signal"
          onClick={onRunPrediction}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>{t.predictTrade}</span>
        </button>
      </div>
    );
  }

  const isLong = signal.direction === 'LONG';
  const isStrong = signal.signalType.includes('STRONG');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4">
      {/* Header Banner: Signal & Conviction */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl font-mono font-extrabold text-xs sm:text-sm tracking-wider flex items-center gap-1.5 shadow-lg ${
              isLong
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-rose-500 text-white shadow-rose-500/30'
            }`}
          >
            {isLong ? <ArrowUpRight className="w-4 h-4 stroke-[3]" /> : <ArrowDownRight className="w-4 h-4 stroke-[3]" />}
            <span>{signal.signalType.replace('_', ' ')}</span>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-mono">
              {signal.assetName} • {signal.timeframe}
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isLong ? t.long : t.short}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                @ ${(signal.currentPrice ?? 0).toFixed(asset?.decimals ?? 2)}
              </span>
            </div>
          </div>
        </div>

        {/* AI Confluence Score Meter & Predict Trade Trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                {t.confidence}
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400">
                {signal.confidence}/100
              </div>
            </div>
          </div>

          <button
            id="btn-card-header-predict"
            onClick={onRunPrediction}
            disabled={isPredicting}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            title={language === 'bn' ? 'বর্তমান মার্কেট স্ট্রাকচার অনুযায়ী নতুন ট্রেড সিগন্যাল প্রেডিক্ট করুন' : 'Run instant AI trade prediction'}
          >
            <Sparkles className={`w-3.5 h-3.5 fill-slate-950 ${isPredicting ? 'animate-spin' : ''}`} />
            <span>{isPredicting ? (language === 'bn' ? 'এনালাইজ হচ্ছে...' : 'Analyzing...') : (language === 'bn' ? 'প্রেডিক্ট ট্রেড' : 'Predict Trade')}</span>
          </button>
        </div>
      </div>

      {/* Data Source & Provenance Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Source: <strong className="text-slate-200">{signal.dataSource || asset.dataSource || 'Live Exchange Data'}</strong></span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">{t.noLookAhead}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Engine:</span>
          <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 text-[10px] font-bold">
            {signal.analysisEngine === 'GEMINI_AI' ? 'Gemini 3.7 Flash AI' : 'Quant Technical Engine'}
          </span>
        </div>
      </div>

      {/* Primary Trade Targets Grid (Entry, SL, TP1, TP2, TP3) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Entry Zone */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold mb-1">
            <span>{t.entryZone}</span>
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="text-sm sm:text-base font-mono font-bold text-white">
            ${(signal.entryZone?.ideal ?? 0).toFixed(asset?.decimals ?? 2)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {(signal.entryZone?.min ?? 0).toFixed(asset?.decimals ?? 2)} - {(signal.entryZone?.max ?? 0).toFixed(asset?.decimals ?? 2)}
          </div>
        </div>

        {/* Stop Loss */}
        <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-rose-400 font-semibold mb-1">
            <span>{t.stopLoss}</span>
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="text-sm sm:text-base font-mono font-bold text-rose-300">
            ${(signal.stopLoss ?? 0).toFixed(asset?.decimals ?? 2)}
          </div>
          <div className="text-[10px] text-rose-400/90 font-mono font-semibold mt-0.5">
            -{signal.potentialLossPercent ?? 0}% {t.potentialLoss}
          </div>
        </div>

        {/* Take Profit 1 */}
        <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold mb-1">
            <span>{t.takeProfit1}</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/30">1:1.5</span>
          </div>
          <div className="text-sm sm:text-base font-mono font-bold text-emerald-300">
            ${(signal.takeProfit1 ?? 0).toFixed(asset?.decimals ?? 2)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Conservative (50% close)
          </div>
        </div>

        {/* Take Profit 2 (Main Target) */}
        <div className="bg-slate-950/90 border border-emerald-500/50 rounded-xl p-2.5 flex flex-col justify-between ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold mb-1">
            <span>{t.takeProfit2}</span>
            <span className="text-[9px] bg-emerald-500 text-slate-950 font-extrabold px-1 py-0.2 rounded">TARGET</span>
          </div>
          <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-400">
            ${(signal.takeProfit2 ?? 0).toFixed(asset?.decimals ?? 2)}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5">
            +{signal.potentialGainPercent ?? 0}% Gain
          </div>
        </div>

        {/* Take Profit 3 (Runner) */}
        <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-2.5 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold mb-1">
            <span>{t.takeProfit3}</span>
            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/30">RUNNER</span>
          </div>
          <div className="text-sm sm:text-base font-mono font-bold text-emerald-300">
            ${(signal.takeProfit3 ?? 0).toFixed(asset?.decimals ?? 2)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Moon Bag / Trailing
          </div>
        </div>
      </div>

      {/* Risk-to-Reward Bar & Confluences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
        {/* R:R Ratio & Pattern */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">{t.riskReward}:</span>
            <span className="font-mono font-extrabold text-emerald-400 text-sm bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              1 : {(signal.riskRewardRatio ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t.marketStructure}:</span>
            <span className="font-medium text-slate-200 text-right">{signal.marketStructure}</span>
          </div>
        </div>

        {/* Key Confluence Checklist */}
        <div>
          <div className="text-slate-400 font-semibold mb-1.5 flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.confluences}</span>
          </div>
          <div className="space-y-1">
            {signal.keyConfluences.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bilingual Strategy Guide Box (বাংলা ও ইংরেজি বিস্তারিত বিশ্লেষণ) */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.bengaliGuide}</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(signal.generatedAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] font-bold text-emerald-400 mb-1">🎯 {t.predictionSummary}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {language === 'bn' ? signal.bengaliSummary.prediction : signal.reasoning}
            </p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] font-bold text-cyan-400 mb-1">📥 {t.entryAdvice}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {signal.bengaliSummary.entryAdvice}
            </p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] font-bold text-emerald-400 mb-1">📤 {t.exitAdvice}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {signal.bengaliSummary.exitAdvice}
            </p>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] font-bold text-rose-400 mb-1">🛡️ {t.riskAdvice}</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {signal.bengaliSummary.riskAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Real Technical Indicators Confluence Readout */}
      {signal.indicators && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] font-mono">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px]">RSI (14)</span>
            <span className={`font-bold ${signal.indicators.rsi14 > 70 ? 'text-amber-400' : signal.indicators.rsi14 < 30 ? 'text-emerald-400' : 'text-white'}`}>
              {signal.indicators.rsi14}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px]">MACD Momentum</span>
            <span className={`font-bold ${signal.indicators.macdTrend === 'BULLISH_CROSS' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {signal.indicators.macdTrend.replace('_', ' ')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px]">EMA 20/50 Ribbon</span>
            <span className="font-bold text-slate-200">
              {signal.indicators.emaTrend.replace('_', ' ')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px]">14 ATR Volatility</span>
            <span className="font-bold text-cyan-400">
              {signal.indicators.atr !== undefined ? `$${signal.indicators.atr}` : signal.indicators.volatility}
            </span>
          </div>
        </div>
      )}

      {/* Institutional Risk & Paper Trading Notice */}
      <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50 text-[10px] text-slate-400 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="text-slate-300 font-semibold">
            {language === 'bn' ? 'রিস্ক ডিসক্লেইমার:' : 'Risk Notice:'}
          </span>{' '}
          {language === 'bn'
            ? 'ট্রেডপালস এআই সিগন্যাল ও কনফ্লুয়েন্স স্কোর রিয়েল এক্সচেঞ্জ ডাটা ও কোয়ান্ট অ্যানালাইসিসের উপর ভিত্তি করে প্রস্তুতকৃত। এটি ১০০% লাভের নিশ্চয়তা দেয় না। সবসময় ক্যাপিটালের ১-২% এর মধ্যে রিস্ক সীমাবদ্ধ রাখুন।'
            : 'TradePulse signals and confluence scores are computed from authentic exchange series. Confluence ratings represent quantitative alignment rather than absolute win probabilities. Practice strict 1-2% capital risk.'}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-apply-calculator"
            onClick={() => onApplyToCalculator(signal)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-3 py-1.5 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.applySignal}</span>
          </button>

          <button
            id="btn-open-paper-trade"
            onClick={() => onOpenPaperTrade(signal)}
            className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold px-3 py-1.5 rounded-xl text-xs border border-emerald-500/30 transition-all cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.openPaperTrade}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-setup"
            onClick={handleCopySetup}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl text-xs border border-slate-800 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copySetup}</span>
              </>
            )}
          </button>

          <button
            id="btn-re-predict"
            onClick={onRunPrediction}
            disabled={isPredicting}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-xl text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isPredicting ? 'animate-spin' : ''}`} />
            <span>{isPredicting ? (language === 'bn' ? 'এনালাইজ হচ্ছে...' : 'Scanning...') : (language === 'bn' ? 'প্রেডিকশন রিফ্রেশ করুন' : 'Re-Predict Trade')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
