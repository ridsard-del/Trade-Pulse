import React, { useState, useRef, useMemo } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Eye, 
  Maximize2, 
  Layers, 
  Activity, 
  Sliders, 
  HelpCircle,
  Crosshair,
  LineChart as LineChartIcon,
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Candle, MarketAsset, Timeframe, TradeSignal, Language } from '../types';
import { translations } from '../utils/translations';

interface InteractiveChartProps {
  candles: Candle[];
  asset: MarketAsset;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  activeSignal: TradeSignal | null;
  language: Language;
  onRunPrediction?: () => void;
  isPredicting?: boolean;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  candles,
  asset,
  timeframe,
  onTimeframeChange,
  activeSignal,
  language,
  onRunPrediction,
  isPredicting,
}) => {
  const [chartType, setChartType] = useState<'candlestick' | 'area'>('candlestick');
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showSignalLines, setShowSignalLines] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  // Chart dimensions & scaling math
  const chartHeight = 360;
  const subChartHeight = 85;
  const chartWidth = 800; // virtual SVG viewBox width

  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100, maxVol: 1000 };
    let min = Infinity;
    let max = -Infinity;
    let mVol = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.bb?.lower && showBB && c.bb.lower < min) min = c.bb.lower;
      if (c.bb?.upper && showBB && c.bb.upper > max) max = c.bb.upper;
      if (c.volume > mVol) mVol = c.volume;
    });

    // Also factor in active trade signal SL & TP lines so they fit on the chart!
    if (activeSignal && showSignalLines) {
      if (activeSignal.stopLoss < min) min = activeSignal.stopLoss;
      if (activeSignal.takeProfit3 > max) max = activeSignal.takeProfit3;
      if (activeSignal.takeProfit1 < min) min = activeSignal.takeProfit1;
      if (activeSignal.stopLoss > max) max = activeSignal.stopLoss;
    }

    const pad = (max - min) * 0.08 || 1;
    return { minPrice: min - pad, maxPrice: max + pad, maxVol: mVol || 1 };
  }, [candles, showBB, activeSignal, showSignalLines]);

  const priceToY = (price: number) => {
    if (maxPrice === minPrice) return chartHeight / 2;
    return chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * (chartHeight - 40) - 20;
  };

  const candleCount = candles.length;
  const candleSpacing = chartWidth / Math.max(candleCount, 1);
  const candleWidth = Math.max(candleSpacing * 0.65, 2.5);

  const activeCandle = hoverIndex !== null && candles[hoverIndex] ? candles[hoverIndex] : (candles.length > 0 ? candles[candles.length - 1] : null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const index = Math.floor(ratio * candleCount);
    if (index >= 0 && index < candleCount) {
      setHoverIndex(index);
    }
  };

  const handleMouseLeaveSyst = () => {
    setHoverIndex(null);
  };

  // Generate SVG Path for Area Chart
  const areaPath = useMemo(() => {
    if (candles.length < 2) return '';
    const points = candles.map((c, i) => {
      const x = i * candleSpacing + candleSpacing / 2;
      const y = priceToY(c.close);
      return `${x},${y}`;
    });
    return `M 0,${chartHeight} L ${points.join(' L ')} L ${chartWidth},${chartHeight} Z`;
  }, [candles, candleSpacing, minPrice, maxPrice]);

  const linePath = useMemo(() => {
    if (candles.length < 2) return '';
    return candles
      .map((c, i) => {
        const x = i * candleSpacing + candleSpacing / 2;
        const ywan = priceToY(c.close);
        return `${i === 0 ? 'M' : 'L'} ${x},${ywan}`;
      })
      .join(' ');
  }, [candles, candleSpacing, minPrice, maxPrice]);

  // Generate EMA paths
  const generateEmaPath = (emaKey: 'ema20' | 'ema50' | 'ema200') => {
    const validPoints = candles
      .map((c, i) => {
        const val = c[emaKey];
        if (val === undefined) return null;
        const x = i * candleSpacing + candleSpacing / 2;
        const y = priceToY(val);
        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (validPoints.length === 0) return '';
    return validPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  };

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D'];

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        {/* Left: Timeframe Switcher & Chart Style */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
            {timeframes.map((tf) => (
              <button
                key={tf}
                id={`tf-btn-${tf}`}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartType('candlestick')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'candlestick' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'area' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Smooth Line Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Technical Overlays Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              showEMA
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400 font-semibold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            EMA (20/50/200)
          </button>

          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              showBB
                ? 'bg-blue-950/60 border-blue-500/50 text-blue-400 font-semibold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            BB (20,2)
          </button>

          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              showRSI
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-400 font-semibold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            RSI (14)
          </button>

          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              showMACD
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-400 font-semibold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            MACD
          </button>

          {activeSignal && (
            <button
              onClick={() => setShowSignalLines(!showSignalLines)}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                showSignalLines
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>{language === 'bn' ? 'এআই টার্গেট লাইন' : 'AI Targets'}</span>
            </button>
          )}

          {onRunPrediction && (
            <button
              id="chart-predict-trade-btn"
              onClick={onRunPrediction}
              disabled={isPredicting}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 disabled:opacity-50"
              title={language === 'bn' ? 'বর্তমান চার্ট এনালাইজ করে নতুন ট্রেড প্রেডিকশন নিন' : 'Run instant AI technical analysis on this chart'}
            >
              {isPredicting ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{language === 'bn' ? 'এনালাইজ হচ্ছে...' : 'Predicting...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 fill-slate-950" />
                  <span>{language === 'bn' ? 'এআই প্রেডিক্ট' : 'Predict Trade'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Candle Hover Stats Bar (HUD) */}
      {activeCandle && (
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-mono bg-slate-950/70 py-1.5 px-3 rounded-xl border border-slate-800/60">
          <div className="text-slate-400">
            {new Date(activeCandle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div>
            <span className="text-slate-500 mr-1">O:</span>
            <span className="text-slate-200 font-bold">{(activeCandle.open ?? 0).toFixed(asset.decimals ?? 2)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">H:</span>
            <span className="text-emerald-400 font-bold">{(activeCandle.high ?? 0).toFixed(asset.decimals ?? 2)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">L:</span>
            <span className="text-rose-400 font-bold">{(activeCandle.low ?? 0).toFixed(asset.decimals ?? 2)}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">C:</span>
            <span className={(activeCandle.close ?? 0) >= (activeCandle.open ?? 0) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {(activeCandle.close ?? 0).toFixed(asset.decimals ?? 2)}
            </span>
          </div>
          {activeCandle.rsi !== undefined && showRSI && (
            <div className="hidden md:flex items-center gap-1">
              <span className="text-purple-400 font-semibold">RSI:</span>
              <span className={`font-bold ${activeCandle.rsi > 70 ? 'text-rose-400' : activeCandle.rsi < 30 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {activeCandle.rsi}
              </span>
            </div>
          )}
          {activeCandle.ema20 !== undefined && showEMA && (
            <div className="hidden lg:flex items-center gap-2 text-[11px]">
              <span className="text-cyan-400">EMA20: {activeCandle.ema20}</span>
              <span className="text-yellow-400">EMA50: {activeCandle.ema50}</span>
              <span className="text-purple-400">EMA200: {activeCandle.ema200}</span>
            </div>
          )}
        </div>
      )}

      {/* Main SVG Candlestick Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800/80 cursor-crosshair select-none"
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-72 sm:h-96"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeaveSyst}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Price Grid Lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = chartHeight * ratio;
            const priceLevel = maxPrice - ratio * (maxPrice - minPrice);
            return (
              <g key={ratio}>
                <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#1e293b" strokeDasharray="3,3" strokeWidth="0.8" />
                <text x={chartWidth - 5} y={y - 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                  {(priceLevel ?? 0).toFixed(asset?.decimals ?? 2)}
                </text>
              </g>
            );
          })}

          {/* Volume Histogram at bottom */}
          {showVolume &&
            candles.map((c, i) => {
              const x = i * candleSpacing + (candleSpacing - candleWidth) / 2;
              const volHeight = (c.volume / maxVol) * 60;
              const y = chartHeight - volHeight;
              const isUp = c.close >= c.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={volHeight}
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  opacity={0.2}
                />
              );
            })}

          {/* Bollinger Bands Fill & Lines */}
          {showBB && (
            <>
              {candles.map((c, i) => {
                if (!c.bb || i === 0) return null;
                const prev = candles[i - 1];
                if (!prev.bb) return null;
                const x1 = (i - 1) * candleSpacing + candleSpacing / 2;
                const x2Pos = i * candleSpacing + candleSpacing / 2;
                return (
                  <g key={`bb-${i}`}>
                    <line x1={x1} y1={priceToY(prev.bb.upper)} x2={x2Pos} y2={priceToY(c.bb.upper)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                    <line x1={x1} y1={priceToY(prev.bb.lower)} x2={x2Pos} y2={priceToY(c.bb.lower)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                    <line x1={x1} y1={priceToY(prev.bb.middle)} x2={x2Pos} y2={priceToY(c.bb.middle)} stroke="#60a5fa" strokeWidth="0.8" opacity="0.4" />
                  </g>
                );
              })}
            </>
          )}

          {/* EMA Curves */}
          {showEMA && (
            <>
              <path d={generateEmaPath('ema200')} fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.85" />
              <path d={generateEmaPath('ema50')} fill="none" stroke="#eab308" strokeWidth="1.2" opacity="0.9" />
              <path d={generateEmaPath('ema20')} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.95" />
            </>
          )}

          {/* Candlestick / Area Chart Render */}
          {chartType === 'area' ? (
            <>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" />
            </>
          ) : (
            candles.map((c, i) => {
              const x = i * candleSpacing + candleSpacing / 2;
              const isUp = c.close >= c.open;
              const color = isUp ? '#10b981' : '#f43f5e';
              const yOpen = priceToY(c.open);
              const yClose受到 = priceToY(c.close);
              const yHigh = priceToY(c.high);
              const yLow = priceToY(c.low);

              const bodyTop = Math.min(yOpen, yClose受到);
              const bodyHeight = Math.max(Math.abs(yClose受到 - yOpen), 1.5);

              return (
                <g key={`candle-${i}`}>
                  {/* High/Low Wick */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          )}

          {/* Active AI Signal Target & Invalidation Levels Overlay */}
          {activeSignal && showSignalLines && (
            <g className="ai-trade-overlay">
              {/* Entry Zone */}
              {activeSignal.entryZone && (
                <>
                  <line
                    x1="0"
                    y1={priceToY(activeSignal.entryZone.ideal ?? 0)}
                    x2={chartWidth}
                    y2={priceToY(activeSignal.entryZone.ideal ?? 0)}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                  />
                  <rect
                    x="8"
                    y={priceToY(activeSignal.entryZone.ideal ?? 0) - 10}
                    width="140"
                    height="18"
                    fill="#0369a1"
                    rx="3"
                    opacity="0.9"
                  />
                  <text
                    x="14"
                    y={priceToY(activeSignal.entryZone.ideal ?? 0) + 2}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ENTRY: ${(activeSignal.entryZone.ideal ?? 0).toFixed(asset?.decimals ?? 2)}
                  </text>
                </>
              )}

              {/* Stop Loss Line */}
              {activeSignal.stopLoss !== undefined && (
                <>
                  <line
                    x1="0"
                    y1={priceToY(activeSignal.stopLoss)}
                    x2={chartWidth}
                    y2={priceToY(activeSignal.stopLoss)}
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                  />
                  <rect
                    x="8"
                    y={priceToY(activeSignal.stopLoss) - 10}
                    width="155"
                    height="18"
                    fill="#be123c"
                    rx="3"
                    opacity="0.9"
                  />
                  <text
                    x="14"
                    y={priceToY(activeSignal.stopLoss) + 2}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    SL: ${(activeSignal.stopLoss ?? 0).toFixed(asset?.decimals ?? 2)} (-{activeSignal.potentialLossPercent ?? 0}%)
                  </text>
                </>
              )}

              {/* Take Profit 1 */}
              {activeSignal.takeProfit1 !== undefined && (
                <>
                  <line
                    x1="0"
                    y1={priceToY(activeSignal.takeProfit1)}
                    x2={chartWidth}
                    y2={priceToY(activeSignal.takeProfit1)}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="3,3"
                  />
                  <rect
                    x="8"
                    y={priceToY(activeSignal.takeProfit1) - 9}
                    width="135"
                    height="16"
                    fill="#047857"
                    rx="3"
                    opacity="0.9"
                  />
                  <text
                    x="14"
                    y={priceToY(activeSignal.takeProfit1) + 2}
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    TP 1: ${(activeSignal.takeProfit1 ?? 0).toFixed(asset?.decimals ?? 2)}
                  </text>
                </>
              )}

              {/* Take Profit 2 (Main Target) */}
              {activeSignal.takeProfit2 !== undefined && (
                <>
                  <line
                    x1="0"
                    y1={priceToY(activeSignal.takeProfit2)}
                    x2={chartWidth}
                    y2={priceToY(activeSignal.takeProfit2)}
                    stroke="#10b981"
                    strokeWidth="1.8"
                    strokeDasharray="5,3"
                  />
                  <rect
                    x="8"
                    y={priceToY(activeSignal.takeProfit2) - 10}
                    width="160"
                    height="18"
                    fill="#059669"
                    rx="3"
                    opacity="0.95"
                  />
                  <text
                    x="14"
                    y={priceToY(activeSignal.takeProfit2) + 2}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    TP 2 (TARGET): ${(activeSignal.takeProfit2 ?? 0).toFixed(asset?.decimals ?? 2)} (+{activeSignal.potentialGainPercent ?? 0}%)
                  </text>
                </>
              )}

              {/* Take Profit 3 (Runner) */}
              {activeSignal.takeProfit3 !== undefined && (
                <>
                  <line
                    x1="0"
                    y1={priceToY(activeSignal.takeProfit3)}
                    x2={chartWidth}
                    y2={priceToY(activeSignal.takeProfit3)}
                    stroke="#34d399"
                    strokeWidth="1.2"
                    strokeDasharray="2,2"
                  />
                  <rect
                    x="8"
                    y={priceToY(activeSignal.takeProfit3) - 9}
                    width="145"
                    height="16"
                    fill="#065f46"
                    rx="3"
                    opacity="0.9"
                  />
                  <text
                    x="14"
                    y={priceToY(activeSignal.takeProfit3) + 2}
                    fill="#ffffff"
                    fontSize="8.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    TP 3 (RUNNER): ${(activeSignal.takeProfit3 ?? 0).toFixed(asset?.decimals ?? 2)}
                  </text>
                </>
              )}
            </g>
          )}

          {/* Interactive Hover Crosshair */}
          {hoverIndex !== null && activeCandle && (
            <g>
              <line
                x1={hoverIndex * candleSpacing + candleSpacing / 2}
                y1="0"
                x2={hoverIndex * candleSpacing + candleSpacing / 2}
                y2={chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <line
                x1="0"
                y1={priceToY(activeCandle.close)}
                x2={chartWidth}
                y2={priceToY(activeCandle.close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Sub-Chart Pane 1: RSI (14) */}
      {showRSI && (
        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 select-none">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="font-semibold text-purple-300">RSI (14)</span>
            </span>
            <span className="font-bold text-slate-200">
              {activeCandle?.rsi !== undefined ? activeCandle.rsi : 50}
            </span>
          </div>

          <svg viewBox={`0 0 ${chartWidth} ${subChartHeight}`} className="w-full h-16 sm:h-20" preserveAspectRatio="none">
            {/* 70 Overbought & 30 Oversold lines */}
            <line x1="0" y1={subChartHeight * 0.3} x2={chartWidth} y2={subChartHeight * 0.3} stroke="#f43f5e" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.6" />
            <text x={chartWidth - 5} y={subChartHeight * 0.3 - 2} fill="#f43f5e" fontSize="8" textAnchor="end" fontFamily="monospace">70 (OB)</text>

            <line x1="0" y1={subChartHeight * 0.5} x2={chartWidth} y2={subChartHeight * 0.5} stroke="#334155" strokeDasharray="2,2" strokeWidth="0.6" />

            <line x1="0" y1={subChartHeight * 0.7} x2={chartWidth} y2={subChartHeight * 0.7} stroke="#10b981" strokeDasharray="3,3" strokeWidth="0.8" opacity="0.6" />
            <text x={chartWidth - 5} y={subChartHeight * 0.7 + 9} fill="#10b981" fontSize="8" textAnchor="end" fontFamily="monospace">30 (OS)</text>

            {/* RSI Line */}
            {(() => {
              const rsiPoints = candles
                .map((c, i) => {
                  if (c.rsi === undefined) return null;
                  const x = i * candleSpacing + candleSpacing / 2;
                  const y = subChartHeight - (c.rsi / 100) * subChartHeight;
                  return `${x},${y}`;
                })
                .filter((p): p is string => p !== null);

              if (rsiPoints.length < 2) return null;
              return <polyline points={rsiPoints.join(' ')} fill="none" stroke="#a855f7" strokeWidth="1.5" />;
            })()}
          </svg>
        </div>
      )}

      {/* Sub-Chart Pane 2: MACD */}
      {showMACD && (
        <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 select-none">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="font-semibold text-amber-300">MACD (12, 26, 9)</span>
            </span>
          </div>

          <svg viewBox={`0 0 ${chartWidth} ${subChartHeight}`} className="w-full h-16 sm:h-20" preserveAspectRatio="none">
            <line x1="0" y1={subChartHeight / 2} x2={chartWidth} y2={subChartHeight / 2} stroke="#334155" strokeWidth="1" />
            {candles.map((c, i) => {
              if (!c.macd) return null;
              const x = i * candleSpacing + candleSpacing / 2;
              const hist = c.macd.histogram;
              const isPos = hist >= 0;
              const barHeight = Math.min(Math.abs(hist) * 20, subChartHeight / 2 - 4);
              const y = isPos ? subChartHeight / 2 - barHeight : subChartHeight / 2;

              return (
                <rect
                  key={`macd-hist-${i}`}
                  x={x - candleWidth / 2}
                  y={y}
                  width={candleWidth}
                  height={barHeight}
                  fill={isPos ? '#10b981' : '#f43f5e'}
                  opacity={0.8}
                />
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
