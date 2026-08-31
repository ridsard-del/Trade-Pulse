import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  MarketAsset, 
  Candle, 
  TradeSignal, 
  Timeframe, 
  PaperTrade, 
  Language, 
  TradeDirection 
} from './types';
import { translations } from './utils/translations';
import { Header } from './components/Header';
import { AssetSelector } from './components/AssetSelector';
import { InteractiveChart } from './components/InteractiveChart';
import { TradePredictionCard } from './components/TradePredictionCard';
import { EntryExitCalculator } from './components/EntryExitCalculator';
import { MarketScanner } from './components/MarketScanner';
import { PaperTradingPanel } from './components/PaperTradingPanel';
import { AiTradingChat } from './components/AiTradingChat';
import { useMarketWebSocket, PriceTick } from './hooks/useMarketWebSocket';

const INITIAL_ASSETS: MarketAsset[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'crypto', price: 94250.00, change24h: 2.85, high24h: 95400, low24h: 91800, volume24h: 4280000000, decimals: 2 },
  { symbol: 'ETHUSDT', name: 'Ethereum', category: 'crypto', price: 3420.50, change24h: 4.15, high24h: 3480, low24h: 3260, volume24h: 2150000000, decimals: 2 },
  { symbol: 'SOLUSDT', name: 'Solana', category: 'crypto', price: 198.40, change24h: 6.70, high24h: 204.50, low24h: 184.20, volume24h: 1450000000, decimals: 2 },
  { symbol: 'BNBUSDT', name: 'BNB', category: 'crypto', price: 685.20, change24h: 1.45, high24h: 695.00, low24h: 672.00, volume24h: 480000000, decimals: 2 },
  { symbol: 'XRPUSDT', name: 'Ripple', category: 'crypto', price: 2.38, change24h: -1.80, high24h: 2.52, low24h: 2.30, volume24h: 890000000, decimals: 4 },
  { symbol: 'XAUUSD', name: 'Gold Spot USD', category: 'commodity', price: 2915.50, change24h: 0.95, high24h: 2928.00, low24h: 2895.00, volume24h: 18500000000, decimals: 2 },
  { symbol: 'EURUSD', name: 'EUR / USD', category: 'forex', price: 1.0450, change24h: -0.15, high24h: 1.0495, low24h: 1.0420, volume24h: 45000000000, decimals: 4 },
  { symbol: 'NVDA', name: 'Nvidia Corp', category: 'stock', price: 138.50, change24h: 3.40, high24h: 141.20, low24h: 135.80, volume24h: 12400000000, decimals: 2 },
];

export default function App() {
  const [language, setLanguage] = useState<Language>('bn'); // Bengali by default as user requested
  const [activeTab, setActiveTab] = useState<'terminal' | 'calculator' | 'scanner' | 'mentor' | 'portfolio'>('terminal');
  
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(INITIAL_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [candles, setCandles] = useState<Candle[]>([]);
  
  const [activeSignal, setActiveSignal] = useState<TradeSignal | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  const [scannedSetups, setScannedSetups] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>([]);
  const [simulatedBalance, setSimulatedBalance] = useState<number>(10000);

  const t = translations[language];

  // 1. WebSocket Callbacks for Real-Time Streaming
  const handleWsTickers = useCallback((updatedTickers: MarketAsset[]) => {
    setAssets(updatedTickers);
    setSelectedAsset((prev) => {
      const found = updatedTickers.find((a) => a.symbol === prev.symbol);
      return found ? { ...found } : prev;
    });
  }, []);

  const handleWsPriceTick = useCallback((tick: PriceTick) => {
    // Update active candle in real-time
    setCandles((prevCandles) => {
      if (prevCandles.length === 0) return prevCandles;
      const last = prevCandles[prevCandles.length - 1];
      const newHigh = Math.max(last.high, tick.price);
      const newLow = Math.min(last.low, tick.price);
      const updatedLast: Candle = {
        ...last,
        close: tick.price,
        high: newHigh,
        low: newLow,
      };
      return [...prevCandles.slice(0, -1), updatedLast];
    });

    // Update selected asset price
    setSelectedAsset((prev) => {
      if (prev.symbol === tick.symbol) {
        return {
          ...prev,
          price: tick.price,
          change24h: tick.change24h,
          high24h: tick.high24h,
          low24h: tick.low24h,
          volume24h: tick.volume24h,
        };
      }
      return prev;
    });
  }, []);

  // Hook up WebSocket Connection Handler
  const { isConnected: wsConnected, latency } = useMarketWebSocket({
    symbol: selectedAsset.symbol,
    timeframe,
    onTickers: handleWsTickers,
    onPriceTick: handleWsPriceTick,
  });

  // Fallback initial ticker fetch (if needed before socket establishes)
  const fetchTickers = useCallback(async () => {
    try {
      const res = await fetch('/api/market/tickers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tickers) {
          setAssets(data.tickers);
          setSelectedAsset((prev) => {
            const updated = data.tickers.find((a: MarketAsset) => a.symbol === prev.symbol);
            return updated || prev;
          });
        }
      }
    } catch (err) {
      console.error('Ticker fetch error:', err);
    }
  }, []);

  // 2. Fetch Kline Candlestick data for selected asset & timeframe
  const fetchKlines = useCallback(async (symbol: string, tf: Timeframe) => {
    try {
      const res = await fetch(`/api/market/klines?symbol=${symbol}&timeframe=${tf}&count=80`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.candles) {
          setCandles(data.candles);
        }
      }
    } catch (err) {
      console.error('Kline fetch error:', err);
    }
  }, []);

  // 3. Run AI Trade Prediction using Gemini 3.7
  const runAiPrediction = useCallback(async (targetSymbol?: string, targetTf?: Timeframe) => {
    const symbolToUse = targetSymbol || selectedAsset.symbol;
    const tfToUse = targetTf || timeframe;
    setIsPredicting(true);
    try {
      const res = await fetch('/api/ai/analyze-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbolToUse,
          timeframe: tfToUse,
          userStrategy: 'Price Action, Support/Resistance & Momentum',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.signal) {
          setActiveSignal(data.signal);
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsPredicting(false);
    }
  }, [selectedAsset.symbol, timeframe]);

  // Unified loader to transition any trade setup / asset directly to Terminal with synchronized candles and AI prediction
  const handleLoadTradeOrAssetToTerminal = useCallback((symbol: string) => {
    const cleanSym = symbol.toUpperCase().replace(/[\/\-_]/g, '');
    const found = assets.find((a) => a.symbol === cleanSym || a.symbol === symbol) ||
      INITIAL_ASSETS.find((a) => a.symbol === cleanSym || a.symbol === symbol);

    if (found) {
      setSelectedAsset(found);
    }
    setActiveTab('terminal');
    fetchKlines(found?.symbol || symbol, timeframe);
    runAiPrediction(found?.symbol || symbol, timeframe);
  }, [assets, timeframe, fetchKlines, runAiPrediction]);

  // 4. Fetch Market Scanner Setups
  const fetchScannerSetups = useCallback(async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/ai/scan-all');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.setups) {
          setScannedSetups(data.setups);
        }
      }
    } catch (err) {
      console.error('Scanner fetch error:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Initial Boot: fetch initial snapshots (real-time stream takes over immediately via WebSocket)
  useEffect(() => {
    fetchTickers();
    fetchKlines(selectedAsset.symbol, timeframe);
    runAiPrediction(selectedAsset.symbol, timeframe);
    fetchScannerSetups();
  }, []);

  // When symbol or timeframe changes, refresh chart and prediction
  useEffect(() => {
    fetchKlines(selectedAsset.symbol, timeframe);
  }, [selectedAsset.symbol, timeframe, fetchKlines]);

  // Update Paper Trades live PnL and check automated TP/SL hits
  useEffect(() => {
    if (paperTrades.length === 0) return;

    setPaperTrades((prevTrades) => {
      let triggerConfetti = false;

      const updated = prevTrades.map((trade) => {
        if (trade.status !== 'OPEN') return trade;

        const currentAsset = assets.find((a) => a.symbol === trade.symbol);
        const livePrice = currentAsset ? currentAsset.price : trade.currentPrice;
        const isLong = trade.direction === 'LONG';

        const priceDelta = isLong ? livePrice - trade.entryPrice : trade.entryPrice - livePrice;
        const pnlPercent = (priceDelta / trade.entryPrice) * 100 * trade.leverage;
        const pnlUsd = (trade.marginUsd * pnlPercent) / 100;

        let status = trade.status;

        // Check TP2 Target Hit
        if (isLong && livePrice >= trade.takeProfit2) {
          status = 'TP2_HIT';
          triggerConfetti = true;
        } else if (!isLong && livePrice <= trade.takeProfit2) {
          status = 'TP2_HIT';
          triggerConfetti = true;
        }
        // Check Stop Loss Hit
        else if (isLong && livePrice <= trade.stopLoss) {
          status = 'SL_HIT';
        } else if (!isLong && livePrice >= trade.stopLoss) {
          status = 'SL_HIT';
        }

        return {
          ...trade,
          currentPrice: livePrice,
          pnlUsd: +(pnlUsd || 0).toFixed(2),
          pnlPercent: +(pnlPercent || 0).toFixed(2),
          status,
          closeTime: status !== 'OPEN' ? Date.now() : undefined,
        };
      });

      if (triggerConfetti) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      return updated;
    });
  }, [assets]);

  // Handlers
  const handleSelectAsset = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    fetchKlines(asset.symbol, timeframe);
    runAiPrediction(asset.symbol, timeframe);
  };

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    fetchKlines(selectedAsset.symbol, tf);
    runAiPrediction(selectedAsset.symbol, tf);
  };

  const handleApplyToCalculator = (signal: TradeSignal) => {
    setActiveTab('calculator');
  };

  const handleOpenPaperTrade = (signal: TradeSignal) => {
    const margin = 100; // $100 default margin
    const leverage = 10;
    const isLong = signal.direction === 'LONG';
    const totalSizeUsd = margin * leverage;
    const entryIdeal = signal.entryZone?.ideal || signal.currentPrice || 1;
    const units = totalSizeUsd / entryIdeal;

    const newTrade: PaperTrade = {
      id: `trade-${Date.now()}`,
      symbol: signal.symbol,
      assetName: signal.assetName,
      direction: signal.direction,
      entryPrice: entryIdeal,
      currentPrice: signal.currentPrice,
      stopLoss: signal.stopLoss,
      takeProfit1: signal.takeProfit1,
      takeProfit2: signal.takeProfit2,
      takeProfit3: signal.takeProfit3,
      marginUsd: margin,
      leverage,
      units: +(units || 0).toFixed(4),
      totalSizeUsd,
      pnlUsd: 0,
      pnlPercent: 0,
      status: 'OPEN',
      openTime: Date.now(),
    };

    setPaperTrades((prev) => [newTrade, ...prev]);
    setActiveTab('portfolio');
  };

  const handleOpenPaperTradeWithCustomParams = (params: {
    symbol: string;
    direction: TradeDirection;
    entry: number;
    sl: number;
    tp1: number;
    tp2: number;
    tp3: number;
    margin: number;
    leverage: number;
  }) => {
    const totalSizeUsd = params.margin * params.leverage;
    const entryPrice = params.entry || 1;
    const units = totalSizeUsd / entryPrice;

    const newTrade: PaperTrade = {
      id: `trade-${Date.now()}`,
      symbol: params.symbol,
      assetName: selectedAsset.name,
      direction: params.direction,
      entryPrice: params.entry,
      currentPrice: selectedAsset.price,
      stopLoss: params.sl,
      takeProfit1: params.tp1,
      takeProfit2: params.tp2,
      takeProfit3: params.tp3,
      marginUsd: params.margin,
      leverage: params.leverage,
      units: +(units || 0).toFixed(4),
      totalSizeUsd,
      pnlUsd: 0,
      pnlPercent: 0,
      status: 'OPEN',
      openTime: Date.now(),
    };

    setPaperTrades((prev) => [newTrade, ...prev]);
    setActiveTab('portfolio');
  };

  const handleCloseTrade = (tradeId: string) => {
    setPaperTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, status: 'CLOSED', closeTime: Date.now() } : t))
    );
  };

  const handleClearHistory = () => {
    setPaperTrades((prev) => prev.filter((t) => t.status === 'OPEN'));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <Header
        assets={assets}
        selectedAsset={selectedAsset}
        onSelectAsset={handleSelectAsset}
        language={language}
        onToggleLanguage={setLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPredicting={isPredicting}
        onRunPrediction={() => runAiPrediction(selectedAsset.symbol, timeframe)}
        wsConnected={wsConnected}
        latency={latency}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* TAB 1: TERMINAL & CHART (Main Trading Desk) */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            {/* Top Toolbar: Asset Selector & Quick Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
              <AssetSelector
                assets={assets}
                selectedAsset={selectedAsset}
                onSelectAsset={handleSelectAsset}
                language={language}
              />

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="hidden sm:block">
                  <span className="text-slate-500 mr-1.5">24h High:</span>
                  <span className="text-slate-200 font-bold">${selectedAsset.high24h.toLocaleString()}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-slate-500 mr-1.5">24h Low:</span>
                  <span className="text-slate-200 font-bold">${selectedAsset.low24h.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 mr-1.5">24h Vol:</span>
                  <span className="text-emerald-400 font-bold">${((selectedAsset.volume24h || 0) / 1e6).toFixed(1)}M</span>
                </div>
              </div>
            </div>

            {/* Interactive Candlestick Chart */}
            <InteractiveChart
              candles={candles}
              asset={selectedAsset}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              activeSignal={activeSignal}
              language={language}
              onRunPrediction={() => runAiPrediction(selectedAsset.symbol, timeframe)}
              isPredicting={isPredicting}
            />

            {/* AI Trade Prediction & Strategy Setup Card */}
            <TradePredictionCard
              signal={activeSignal}
              asset={selectedAsset}
              isPredicting={isPredicting}
              onRunPrediction={() => runAiPrediction(selectedAsset.symbol, timeframe)}
              onApplyToCalculator={handleApplyToCalculator}
              onOpenPaperTrade={handleOpenPaperTrade}
              language={language}
            />
          </div>
        )}

        {/* TAB 2: POSITION & RISK CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <AssetSelector
                assets={assets}
                selectedAsset={selectedAsset}
                onSelectAsset={handleSelectAsset}
                language={language}
              />
            </div>

            <EntryExitCalculator
              asset={selectedAsset}
              activeSignal={activeSignal}
              language={language}
              onOpenPaperTradeWithParams={handleOpenPaperTradeWithCustomParams}
            />
          </div>
        )}

        {/* TAB 3: AI SCANNER */}
        {activeTab === 'scanner' && (
          <MarketScanner
            scannedSetups={scannedSetups}
            onSelectAndAnalyze={handleLoadTradeOrAssetToTerminal}
            language={language}
            isLoading={isScanning}
            onRefreshScan={fetchScannerSetups}
          />
        )}

        {/* TAB 4: AI TRADING MENTOR */}
        {activeTab === 'mentor' && (
          <AiTradingChat
            asset={selectedAsset}
            activeSignal={activeSignal}
            language={language}
          />
        )}

        {/* TAB 5: PAPER TRADING PORTFOLIO */}
        {activeTab === 'portfolio' && (
          <PaperTradingPanel
            paperTrades={paperTrades}
            onCloseTrade={handleCloseTrade}
            onClearHistory={handleClearHistory}
            language={language}
            simulatedBalance={simulatedBalance}
            onSelectTradeForTerminal={handleLoadTradeOrAssetToTerminal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          TradePulse AI • Real-Time Market Analysis & Trade Calculator Engine • Always practice strict risk management (1-2% rule).
        </p>
      </footer>
    </div>
  );
}
