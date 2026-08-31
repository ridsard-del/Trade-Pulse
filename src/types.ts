export type AssetCategory = 'crypto' | 'forex' | 'commodity' | 'stock';

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export type TradeDirection = 'LONG' | 'SHORT';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  decimals: number;
  icon?: string;
  baseAsset?: string;
  quoteAsset?: string;
  dataSource?: string;
  dataStatus?: 'LIVE' | 'STALE' | 'OFFLINE';
  lastUpdated?: number;
}

export interface Candle {
  time: number; // timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bb?: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr?: number;
}

export interface TradeSignal {
  id: string;
  symbol: string;
  assetName: string;
  timeframe: Timeframe;
  signalType: SignalType;
  direction: TradeDirection;
  confidence: number; // Quantitative confluence score 0 - 100
  confluenceScore?: number;
  dataSource?: string;
  dataStatus?: 'LIVE' | 'STALE' | 'OFFLINE';
  analysisEngine?: 'GEMINI_AI' | 'QUANT_TECHNICAL_ENGINE';
  currentPrice: number;
  entryZone: {
    min: number;
    max: number;
    ideal: number;
  };
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  potentialGainPercent: number;
  potentialLossPercent: number;
  marketStructure: string;
  patternIdentified: string;
  trendDirection: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  keyConfluences: string[];
  riskWarning: string;
  reasoning: string;
  bengaliSummary: {
    prediction: string;
    entryAdvice: string;
    exitAdvice: string;
    riskAdvice: string;
  };
  generatedAt: number;
  indicators: {
    rsi14: number;
    macdTrend: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL';
    emaTrend: 'ABOVE_ALL' | 'BELOW_ALL' | 'MIXED';
    supportZone: number;
    resistanceZone: number;
    volatility: 'HIGH' | 'MEDIUM' | 'LOW';
    atr?: number;
  };
}

export interface PositionCalcInput {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  takeProfit2Price?: number;
  takeProfit3Price?: number;
  leverage: number;
  direction: TradeDirection;
  assetDecimals?: number;
}

export interface PositionCalcResult {
  maxLossUsd: number;
  positionSizeUsd: number;
  positionSizeUnits: number;
  marginRequiredUsd: number;
  riskRewardRatio: number;
  profitTp1Usd: number;
  profitTp2Usd: number;
  profitTp3Usd: number;
  gainTp1Percent: number;
  gainTp2Percent: number;
  gainTp3Percent: number;
  lossPercent: number;
  liquidationPrice: number;
  effectiveLeverage: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  assetName: string;
  direction: TradeDirection;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  marginUsd: number;
  leverage: number;
  units: number;
  totalSizeUsd: number;
  pnlUsd: number;
  pnlPercent: number;
  status: 'OPEN' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'SL_HIT' | 'CLOSED';
  openTime: number;
  closeTime?: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  suggestedAction?: {
    symbol?: string;
    signal?: Partial<TradeSignal>;
  };
}

export type Language = 'bn' | 'en';
