import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info, 
  Layers, 
  Sparkles,
  PlayCircle
} from 'lucide-react';
import { TradeSignal, MarketAsset, PositionCalcInput, PositionCalcResult, TradeDirection, Language } from '../types';
import { translations } from '../utils/translations';

interface EntryExitCalculatorProps {
  asset: MarketAsset;
  activeSignal: TradeSignal | null;
  language: Language;
  onOpenPaperTradeWithParams?: (params: {
    symbol: string;
    direction: TradeDirection;
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    margin: number;
    leverage: number;
  }) => void;
}

export const EntryExitCalculator: React.FC<EntryExitCalculatorProps> = ({
  asset,
  activeSignal,
  language,
  onOpenPaperTradeWithParams,
}) => {
  const t = translations[language];

  // Inputs state
  const decimals = asset?.decimals ?? 2;
  const currentAssetPrice = asset?.price ?? 0;

  const [accountBalance, setAccountBalance] = useState<number>(1000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1.5);
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [entryPrice, setEntryPrice] = useState<number>(currentAssetPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(+(currentAssetPrice * 0.985).toFixed(decimals));
  const [takeProfit1Price, setTakeProfit1Price] = useState<number>(+(currentAssetPrice * 1.02).toFixed(decimals));
  const [takeProfit2Price, setTakeProfit2Price] = useState<number>(+(currentAssetPrice * 1.045).toFixed(decimals));
  const [takeProfit3Price, setTakeProfit3Price] = useState<number>(+(currentAssetPrice * 1.07).toFixed(decimals));
  const [leverage, setLeverage] = useState<number>(10);

  // Sync with active signal when changed
  useEffect(() => {
    const curDec = asset?.decimals ?? 2;
    const basePrice = asset?.price ?? 0;
    if (activeSignal && activeSignal.entryZone) {
      setDirection(activeSignal.direction ?? 'LONG');
      setEntryPrice(activeSignal.entryZone.ideal ?? basePrice);
      setStopLossPrice(activeSignal.stopLoss ?? +(basePrice * 0.985).toFixed(curDec));
      setTakeProfit1Price(activeSignal.takeProfit1 ?? +(basePrice * 1.02).toFixed(curDec));
      setTakeProfit2Price(activeSignal.takeProfit2 ?? +(basePrice * 1.045).toFixed(curDec));
      setTakeProfit3Price(activeSignal.takeProfit3 ?? +(basePrice * 1.07).toFixed(curDec));
    } else {
      setEntryPrice(basePrice);
      setStopLossPrice(+(basePrice * 0.985).toFixed(curDec));
      setTakeProfit1Price(+(basePrice * 1.02).toFixed(curDec));
      setTakeProfit2Price(+(basePrice * 1.045).toFixed(curDec));
      setTakeProfit3Price(+(basePrice * 1.07).toFixed(curDec));
    }
  }, [activeSignal, asset]);

  // Comprehensive mathematical calculation
  const calcResult: PositionCalcResult = useMemo(() => {
    const isLong = direction === 'LONG';
    const maxLossUsd = (accountBalance * riskPercentage) / 100;
    
    const priceDelta = isLong ? entryPrice - stopLossPrice : stopLossPrice - entryPrice;
    const lossPercentage = entryPrice > 0 ? (priceDelta / entryPrice) * 100 : 0;
    
    // Position Size in USD = Max Risk $ / (Loss % / 100)
    let positionSizeUsd = 0;
    let positionSizeUnits = 0;
    if (priceDelta > 0) {
      positionSizeUnits = maxLossUsd / priceDelta;
      positionSizeUsd = positionSizeUnits * entryPrice;
    }

    const marginRequiredUsd = leverage > 0 ? positionSizeUsd / leverage : positionSizeUsd;

    // Gain at TP1, TP2, TP3
    const tp1Delta = isLong ? takeProfit1Price - entryPrice : entryPrice - takeProfit1Price;
    const tp2Delta = isLong ? takeProfit2Price - entryPrice : entryPrice - takeProfit2Price;
    const tp3Delta = isLong ? takeProfit3Price - entryPrice : entryPrice - takeProfit3Price;

    const gainTp1Percent = entryPrice > 0 ? (tp1Delta / entryPrice) * 100 : 0;
    const gainTp2Percent = entryPrice > 0 ? (tp2Delta / entryPrice) * 100 : 0;
    const gainTp3Percent = entryPrice > 0 ? (tp3Delta / entryPrice) * 100 : 0;

    const profitTp1Usd = positionSizeUnits * tp1Delta;
    const profitTp2Usd = positionSizeUnits * tp2Delta;
    const profitTp3Usd = positionSizeUnits * tp3Delta;

    const riskRewardRatio = priceDelta > 0 ? tp2Delta / priceDelta : 0;

    // Est. Liquidation Price
    let liquidationPrice = 0;
    if (leverage > 1 && entryPrice > 0) {
      const liqBuffer = 1 / leverage;
      liquidationPrice = isLong 
        ? entryPrice * (1 - liqBuffer * 0.95)
        : entryPrice * (1 + liqBuffer * 0.95);
    }

    const dec = asset?.decimals ?? 2;

    return {
      maxLossUsd: +(maxLossUsd || 0).toFixed(2),
      positionSizeUsd: +(positionSizeUsd || 0).toFixed(2),
      positionSizeUnits: +(positionSizeUnits || 0).toFixed(4),
      marginRequiredUsd: +(marginRequiredUsd || 0).toFixed(2),
      riskRewardRatio: +(riskRewardRatio || 0).toFixed(2),
      profitTp1Usd: +(profitTp1Usd || 0).toFixed(2),
      profitTp2Usd: +(profitTp2Usd || 0).toFixed(2),
      profitTp3Usd: +(profitTp3Usd || 0).toFixed(2),
      gainTp1Percent: +(gainTp1Percent || 0).toFixed(2),
      gainTp2Percent: +(gainTp2Percent || 0).toFixed(2),
      gainTp3Percent: +(gainTp3Percent || 0).toFixed(2),
      lossPercent: +(lossPercentage || 0).toFixed(2),
      liquidationPrice: +(liquidationPrice || 0).toFixed(dec),
      effectiveLeverage: leverage,
    };
  }, [accountBalance, riskPercentage, direction, entryPrice, stopLossPrice, takeProfit1Price, takeProfit2Price, takeProfit3Price, leverage, asset?.decimals]);

  const presetRiskPcts = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];
  const presetLeverages = [1, 2, 5, 10, 20, 50];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-6">
      {/* Title & Direction Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.calculatorTitle}</span>
              <span className="text-xs font-mono font-normal text-slate-400">({asset.symbol})</span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bn' 
                ? 'সঠিক পজিশন সাইজ ও সুনির্দিষ্ট রিস্ক-টু-রিওয়ার্ড ক্যালকুলেশন' 
                : 'Institutional risk sizing, leverage margin, & multi-tier profit targets'}
            </p>
          </div>
        </div>

        {/* Long / Short Switch */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => {
              setDirection('LONG');
              const curDec = asset?.decimals ?? 2;
              if (stopLossPrice >= entryPrice) setStopLossPrice(+((entryPrice || 0) * 0.985).toFixed(curDec));
              if (takeProfit2Price <= entryPrice) setTakeProfit2Price(+((entryPrice || 0) * 1.045).toFixed(curDec));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              direction === 'LONG'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t.long}</span>
          </button>
          <button
            onClick={() => {
              setDirection('SHORT');
              const curDec = asset?.decimals ?? 2;
              if (stopLossPrice <= entryPrice) setStopLossPrice(+((entryPrice || 0) * 1.015).toFixed(curDec));
              if (takeProfit2Price >= entryPrice) setTakeProfit2Price(+((entryPrice || 0) * 0.955).toFixed(curDec));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              direction === 'SHORT'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t.short}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) vs Output Analytics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Inputs (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Account Balance & Risk % */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.accountBalance}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {t.riskPercent}
                </label>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  ${calcResult.maxLossUsd} Risk
                </span>
              </div>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.1"
                  value={riskPercentage}
                  onChange={(e) => setRiskPercentage(Math.max(0.1, Math.min(25, Number(e.target.value))))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Risk Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
            {presetRiskPcts.map((pct) => (
              <button
                key={pct}
                onClick={() => setRiskPercentage(pct)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  riskPercentage === pct
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Entry, Stop Loss & Take Profits */}
          <div className="space-y-3 pt-1">
            {/* Entry Price */}
            <div>
              <label className="block text-xs font-semibold text-cyan-400 mb-1">
                {t.currentPrice} / {t.entryZone} ($)
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Stop Loss Price */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-rose-400">
                  {t.stopLoss} ($)
                </label>
                <span className="text-[11px] font-mono text-rose-400 font-bold">
                  -{calcResult.lossPercent}%
                </span>
              </div>
              <input
                type="number"
                step="any"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-rose-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Take Profit Targets */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                  {t.takeProfit1}
                </label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit1Price}
                  onChange={(e) => setTakeProfit1Price(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-400 font-mono">+{calcResult.gainTp1Percent}%</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                  {t.takeProfit2} (Target)
                </label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit2Price}
                  onChange={(e) => setTakeProfit2Price(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-400 font-mono font-bold">+{calcResult.gainTp2Percent}%</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                  {t.takeProfit3}
                </label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit3Price}
                  onChange={(e) => setTakeProfit3Price(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-emerald-400 font-mono">+{calcResult.gainTp3Percent}%</span>
              </div>
            </div>

            {/* Leverage Slider */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-semibold text-slate-300">{t.leverage}:</span>
                <span className="font-mono font-extrabold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  {leverage}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                {presetLeverages.map((lev) => (
                  <button
                    key={lev}
                    onClick={() => setLeverage(lev)}
                    className="hover:text-slate-300"
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Calculation Dashboard (7 cols) */}
        <div className="lg:col-span-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === 'bn' ? 'ক্যালকুলেশন ফলাফল' : 'Position Summary'}
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                R:R 1 : {calcResult.riskRewardRatio}
              </span>
            </div>

            {/* Big Position Sizing Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Position Size */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">{t.calculatedPosition}</div>
                <div className="text-base sm:text-lg font-mono font-extrabold text-white">
                  ${calcResult.positionSizeUsd.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ≈ {calcResult.positionSizeUnits} {asset.symbol}
                </div>
              </div>

              {/* Margin Required */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">{t.marginRequired} ({leverage}x)</div>
                <div className="text-base sm:text-lg font-mono font-extrabold text-amber-400">
                  ${calcResult.marginRequiredUsd.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Balance Share: {((calcResult.marginRequiredUsd / accountBalance) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Profit Targets & Max Loss Breakdown */}
            <div className="space-y-2 mt-3 text-xs">
              {/* Max Risk Loss */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t.maxLossUsd}</span>
                </div>
                <div className="text-right font-mono font-bold text-rose-300">
                  -${calcResult.maxLossUsd} ({riskPercentage}%)
                </div>
              </div>

              {/* TP1 Profit */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-300 font-medium">{t.takeProfit1} Profit:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +${calcResult.profitTp1Usd} (+{calcResult.gainTp1Percent}%)
                </span>
              </div>

              {/* TP2 Target Profit */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 ring-1 ring-emerald-500/20">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t.targetProfit} (TP 2):</span>
                </div>
                <div className="text-right font-mono font-extrabold text-emerald-400 text-sm">
                  +${calcResult.profitTp2Usd} (+{calcResult.gainTp2Percent}%)
                </div>
              </div>

              {/* TP3 Runner Profit */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-300 font-medium">{t.takeProfit3} Profit:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +${calcResult.profitTp3Usd} (+{calcResult.gainTp3Percent}%)
                </span>
              </div>

              {/* Liquidation Price */}
              {leverage > 1 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-[11px]">
                  <span>{t.liquidationPrice}:</span>
                  <span className="font-mono font-semibold text-rose-400">
                    ${calcResult.liquidationPrice}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 1-Click Launch Paper Trade with Calculated Parameters */}
          {onOpenPaperTradeWithParams && (
            <button
              id="btn-calc-launch-paper-trade"
              onClick={() => {
                onOpenPaperTradeWithParams({
                  symbol: asset.symbol,
                  direction,
                  entry: entryPrice,
                  sl: stopLossPrice,
                  tp1: takeProfit1Price,
                  tp2: takeProfit2Price,
                  tp3: takeProfit3Price,
                  margin: calcResult.marginRequiredUsd,
                  leverage,
                });
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 fill-slate-950" />
              <span>
                {language === 'bn' ? 'এই ক্যালকুলেশন দিয়ে পেপার ট্রেড শুরু করুন' : 'Launch Paper Trade with this Sizing'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
