import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import {
  liveAssetPrices,
  pollCryptoTickers,
  pollNonCryptoTickers,
  fetchRealCandles,
  resolveAsset,
  computeQuantitativeSetup,
} from './server/exchangeService';
import { TickerData } from './server/marketData';

dotenv.config();

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Initial Exchange Fetch & Intervals
pollCryptoTickers();
pollNonCryptoTickers();

setInterval(async () => {
  const updated = await pollCryptoTickers();
  if (updated) broadcastRealMarketUpdates();
}, 4000);

setInterval(async () => {
  const updated = await pollNonCryptoTickers();
  if (updated) broadcastRealMarketUpdates();
}, 8000);

// ---------------- WEBSOCKET REAL-TIME STREAMING ----------------
interface ClientSession {
  ws: WebSocket;
  isAlive: boolean;
  subscribedSymbol: string;
  subscribedTimeframe: string;
}

const activeWsClients = new Set<ClientSession>();

wss.on('connection', (ws: WebSocket) => {
  const session: ClientSession = {
    ws,
    isAlive: true,
    subscribedSymbol: 'BTCUSDT',
    subscribedTimeframe: '15m',
  };
  activeWsClients.add(session);

  // Send immediate initial real tickers payload on connection
  try {
    ws.send(
      JSON.stringify({
        type: 'tickers',
        tickers: Array.from(liveAssetPrices.values()),
        timestamp: Date.now(),
      })
    );
  } catch {}

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.action === 'subscribe') {
        if (parsed.symbol) session.subscribedSymbol = parsed.symbol;
        if (parsed.timeframe) session.subscribedTimeframe = parsed.timeframe;

        const asset = resolveAsset(session.subscribedSymbol);
        ws.send(
          JSON.stringify({
            type: 'subscribed',
            symbol: session.subscribedSymbol,
            timeframe: session.subscribedTimeframe,
            asset,
            timestamp: Date.now(),
          })
        );
      } else if (parsed.action === 'ping') {
        session.isAlive = true;
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch {}
  });

  ws.on('pong', () => {
    session.isAlive = true;
  });

  ws.on('close', () => {
    activeWsClients.delete(session);
  });

  ws.on('error', () => {
    activeWsClients.delete(session);
  });
});

// Periodic WebSocket heartbeat & cleanup
setInterval(() => {
  for (const session of activeWsClients) {
    if (!session.isAlive) {
      session.ws.terminate();
      activeWsClients.delete(session);
      continue;
    }
    session.isAlive = false;
    try {
      session.ws.ping();
    } catch {
      activeWsClients.delete(session);
    }
  }
}, 30000);

// Real-time broadcast engine: push authentic exchange updates without synthetic Math.random
function broadcastRealMarketUpdates() {
  if (activeWsClients.size === 0) return;

  const tickerList = Array.from(liveAssetPrices.values());
  const tickersPayload = JSON.stringify({
    type: 'tickers',
    tickers: tickerList,
    timestamp: Date.now(),
  });

  for (const session of activeWsClients) {
    if (session.ws.readyState === WebSocket.OPEN) {
      try {
        session.ws.send(tickersPayload);

        // Send focused price tick for subscriber's active asset
        const currentAsset = liveAssetPrices.get(session.subscribedSymbol);
        if (currentAsset) {
          session.ws.send(
            JSON.stringify({
              type: 'price_tick',
              symbol: session.subscribedSymbol,
              timeframe: session.subscribedTimeframe,
              price: currentAsset.price,
              change24h: currentAsset.change24h,
              high24h: currentAsset.high24h,
              low24h: currentAsset.low24h,
              volume24h: currentAsset.volume24h,
              dataSource: currentAsset.dataSource,
              dataStatus: currentAsset.dataStatus,
              timestamp: currentAsset.lastUpdated,
            })
          );
        }
      } catch {}
    }
  }
}

// ---------------- REST API ROUTES ----------------

// 1. Get all authentic tickers
app.get('/api/market/tickers', (_req: Request, res: Response) => {
  const list = Array.from(liveAssetPrices.values());
  res.json({
    success: true,
    count: list.length,
    tickers: list,
    timestamp: Date.now(),
  });
});

// 2. Get genuine Kline / Candlestick chart data from Exchange API
app.get('/api/market/klines', async (req: Request, res: Response) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTCUSDT';
    const timeframe = (req.query.timeframe as string) || '15m';
    const count = parseInt((req.query.count as string) || '80', 10);

    const asset = resolveAsset(symbol);
    const result = await fetchRealCandles(asset.symbol, timeframe, Math.min(count, 200));

    if (!result.success || result.candles.length === 0) {
      return res.status(503).json({
        success: false,
        error: result.error || `Unable to load genuine market candles for ${symbol}`,
        dataStatus: result.dataStatus,
        dataSource: result.dataSource,
      });
    }

    res.json({
      success: true,
      symbol: asset.symbol,
      timeframe,
      asset,
      candles: result.candles,
      dataSource: result.dataSource,
      dataStatus: result.dataStatus,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Kline fetch error' });
  }
});

// 3. AI Smart Trade Prediction & Entry/Exit Analysis with Gemini (grounded in real OHLCV data)
app.post('/api/ai/analyze-trade', async (req: Request, res: Response) => {
  try {
    const { symbol = 'BTCUSDT', timeframe = '15m', userStrategy = 'Price Action, Support/Resistance & Momentum' } = req.body;
    const asset = resolveAsset(symbol);
    const resolvedSymbol = asset.symbol;

    // 1. Fetch REAL historical candles from exchange
    const klineResult = await fetchRealCandles(resolvedSymbol, timeframe, 60);
    const candles = klineResult.candles;

    if (!klineResult.success || candles.length === 0) {
      return res.status(503).json({
        success: false,
        error: klineResult.error || `Exchange data unavailable for ${resolvedSymbol}`,
        dataStatus: 'OFFLINE',
      });
    }

    // Always compute the deterministic quantitative baseline
    const quantBaseline = computeQuantitativeSetup(asset, candles, timeframe);
    const lastCandle = candles[candles.length - 1];
    const currentPrice = asset.price;
    const decimals = asset.decimals;

    const rsiVal = lastCandle.rsi ?? 50;
    const ema20Val = lastCandle.ema20 ?? currentPrice;
    const ema50Val = lastCandle.ema50 ?? currentPrice;
    const ema200Val = lastCandle.ema200 ?? currentPrice;
    const macdHist = lastCandle.macd?.histogram ?? 0;
    const atrVal = lastCandle.atr ?? currentPrice * 0.015;

    // Construct high-precision prompt with genuine timestamped candles and metrics
    const recentCandlesText = candles
      .slice(-6)
      .map(
        (c) =>
          `[${new Date(c.time).toISOString()}] Open: ${c.open}, High: ${c.high}, Low: ${c.low}, Close: ${c.close}, Vol: ${c.volume}`
      )
      .join('\n');

    const promptContext = `
You are an institutional quantitative risk analyst. Analyze the following REAL market data from ${klineResult.dataSource}.
Zero look-ahead bias: All metrics reflect strictly completed historical and active ticks.

Asset: ${asset.name} (${resolvedSymbol})
Category: ${asset.category}
Timeframe: ${timeframe}
Current Real Price: ${currentPrice}
24h Change: ${asset.change24h}% | 24h High: ${asset.high24h} | 24h Low: ${asset.low24h} | 24h Vol: ${asset.volume24h}
Real Calculated Indicators:
- RSI (14): ${rsiVal.toFixed(1)}
- 20 EMA: ${ema20Val}
- 50 EMA: ${ema50Val}
- 200 EMA: ${ema200Val}
- MACD Histogram: ${macdHist > 0 ? 'Bullish (' + macdHist + ')' : 'Bearish (' + macdHist + ')'}
- Average True Range (14): ${atrVal}
Recent 6 Candles (Real Time-Series):
${recentCandlesText}

User Strategy Focus: ${userStrategy}

Task:
Calculate an exact, mathematically coherent trade setup based on these real price levels.
Strict Rules:
1. Signal must be one of: "STRONG_BUY", "BUY", "NEUTRAL", "SELL", "STRONG_SELL"
2. Direction: "LONG" or "SHORT"
3. Invalidation / Stop Loss:
   - For LONG: Stop loss MUST be strictly lower than Entry (anchored below recent low: ~${quantBaseline.stopLoss}).
   - For SHORT: Stop loss MUST be strictly higher than Entry (anchored above recent high: ~${quantBaseline.stopLoss}).
4. Take Profit 1 (Conservative, ~1:1.5 R:R), Take Profit 2 (Target, ~1:2.8 R:R), Take Profit 3 (Runner, ~1:4.0 R:R).
5. Confidence (0 to 100): Represents quantitative confluence rating of technical alignment.
6. Provide comprehensive summary in Bengali (বাংলা) and English explaining: Market structure prediction, Entry zone advice, Exit targets, and Strict Capital Risk Management (1-2% risk).
`;

    // Attempt Gemini Generation
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptContext,
          config: {
            systemInstruction:
              'You are an institutional trading quantitative model. Always respond with pure valid JSON matching the schema. Calculate accurate Stop Loss and Take Profit levels strictly aligned with the provided real exchange prices.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                signalType: { type: Type.STRING, description: 'STRONG_BUY | BUY | NEUTRAL | SELL | STRONG_SELL' },
                direction: { type: Type.STRING, description: 'LONG | SHORT' },
                confidence: { type: Type.NUMBER, description: 'Confluence Rating 50 to 95' },
                entryZone: {
                  type: Type.OBJECT,
                  properties: {
                    min: { type: Type.NUMBER },
                    max: { type: Type.NUMBER },
                    ideal: { type: Type.NUMBER },
                  },
                  required: ['min', 'max', 'ideal'],
                },
                stopLoss: { type: Type.NUMBER },
                takeProfit1: { type: Type.NUMBER },
                takeProfit2: { type: Type.NUMBER },
                takeProfit3: { type: Type.NUMBER },
                riskRewardRatio: { type: Type.NUMBER },
                marketStructure: { type: Type.STRING },
                patternIdentified: { type: Type.STRING },
                trendDirection: { type: Type.STRING, description: 'BULLISH | BEARISH | SIDEWAYS' },
                keyConfluences: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                riskWarning: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                bengaliSummary: {
                  type: Type.OBJECT,
                  properties: {
                    prediction: { type: Type.STRING },
                    entryAdvice: { type: Type.STRING },
                    exitAdvice: { type: Type.STRING },
                    riskAdvice: { type: Type.STRING },
                  },
                  required: ['prediction', 'entryAdvice', 'exitAdvice', 'riskAdvice'],
                },
              },
              required: [
                'signalType',
                'direction',
                'confidence',
                'entryZone',
                'stopLoss',
                'takeProfit1',
                'takeProfit2',
                'takeProfit3',
                'riskRewardRatio',
                'marketStructure',
                'patternIdentified',
                'trendDirection',
                'keyConfluences',
                'riskWarning',
                'reasoning',
                'bengaliSummary',
              ],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout after 6s')), 6000)
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);

        let rawText = response.text || '{}';
        rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(rawText);

        const isLong = parsed?.direction === 'LONG';
        const entry = Number(parsed?.entryZone?.ideal) || currentPrice;
        const entryMin = Number(parsed?.entryZone?.min) || quantBaseline.entryZone.min;
        const entryMax = Number(parsed?.entryZone?.max) || quantBaseline.entryZone.max;

        // Sanitize SL and TP against real price direction
        let sl = Number(parsed?.stopLoss) || quantBaseline.stopLoss;
        if (isLong && sl >= entry) sl = quantBaseline.stopLoss;
        if (!isLong && sl <= entry) sl = quantBaseline.stopLoss;

        let tp1 = Number(parsed?.takeProfit1) || quantBaseline.takeProfit1;
        let tp2 = Number(parsed?.takeProfit2) || quantBaseline.takeProfit2;
        let tp3 = Number(parsed?.takeProfit3) || quantBaseline.takeProfit3;

        const potentialGain = Math.abs((tp2 - entry) / (entry || 1)) * 100;
        const potentialLoss = Math.abs((entry - sl) / (entry || 1)) * 100;
        const rr = +(Math.abs(tp2 - entry) / Math.max(Math.abs(entry - sl), 0.0001)).toFixed(2);

        const tradeSignal = {
          id: `SIG-${resolvedSymbol}-${Date.now()}`,
          symbol: resolvedSymbol,
          assetName: asset.name,
          timeframe,
          currentPrice,
          signalType: parsed?.signalType || quantBaseline.signalType,
          direction: isLong ? 'LONG' : 'SHORT',
          confidence: Number(parsed?.confidence) || quantBaseline.confluenceScore,
          confluenceScore: Number(parsed?.confidence) || quantBaseline.confluenceScore,
          dataSource: klineResult.dataSource,
          dataStatus: klineResult.dataStatus,
          analysisEngine: 'GEMINI_AI',
          entryZone: { min: entryMin, max: entryMax, ideal: entry },
          stopLoss: sl,
          takeProfit1: tp1,
          takeProfit2: tp2,
          takeProfit3: tp3,
          riskRewardRatio: rr,
          marketStructure: parsed?.marketStructure || quantBaseline.marketStructure,
          patternIdentified: parsed?.patternIdentified || quantBaseline.patternIdentified,
          trendDirection: parsed?.trendDirection || quantBaseline.trendDirection,
          keyConfluences: Array.isArray(parsed?.keyConfluences) ? parsed.keyConfluences : quantBaseline.keyConfluences,
          riskWarning: parsed?.riskWarning || quantBaseline.riskWarning,
          reasoning: parsed?.reasoning || quantBaseline.reasoning,
          bengaliSummary: parsed?.bengaliSummary || quantBaseline.bengaliSummary,
          potentialGainPercent: +potentialGain.toFixed(2),
          potentialLossPercent: +potentialLoss.toFixed(2),
          generatedAt: Date.now(),
          indicators: quantBaseline.indicators,
        };

        return res.json({ success: true, signal: tradeSignal });
      } catch (aiErr) {
        console.error('Gemini API call failed, deploying real Quantitative Technical Engine:', aiErr);
      }
    }

    // Deploy Deterministic Quantitative Technical Engine (Zero Math.random)
    const fallbackSignal = {
      id: `SIG-${resolvedSymbol}-${Date.now()}`,
      symbol: resolvedSymbol,
      assetName: asset.name,
      timeframe,
      signalType: quantBaseline.signalType,
      direction: quantBaseline.direction,
      confidence: quantBaseline.confluenceScore,
      confluenceScore: quantBaseline.confluenceScore,
      dataSource: klineResult.dataSource,
      dataStatus: klineResult.dataStatus,
      analysisEngine: 'QUANT_TECHNICAL_ENGINE',
      currentPrice,
      entryZone: quantBaseline.entryZone,
      stopLoss: quantBaseline.stopLoss,
      takeProfit1: quantBaseline.takeProfit1,
      takeProfit2: quantBaseline.takeProfit2,
      takeProfit3: quantBaseline.takeProfit3,
      riskRewardRatio: quantBaseline.riskRewardRatio,
      potentialGainPercent: quantBaseline.potentialGainPercent,
      potentialLossPercent: quantBaseline.potentialLossPercent,
      marketStructure: quantBaseline.marketStructure,
      patternIdentified: quantBaseline.patternIdentified,
      trendDirection: quantBaseline.trendDirection,
      keyConfluences: quantBaseline.keyConfluences,
      riskWarning: quantBaseline.riskWarning,
      reasoning: quantBaseline.reasoning,
      bengaliSummary: quantBaseline.bengaliSummary,
      generatedAt: Date.now(),
      indicators: quantBaseline.indicators,
    };

    res.json({ success: true, signal: fallbackSignal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// 4. Scan multiple top assets using REAL market data & indicators
app.get('/api/ai/scan-all', async (_req: Request, res: Response) => {
  try {
    const scannedSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XAUUSD', 'EURUSD', 'NVDA', 'BNBUSDT', 'DOGEUSDT'];
    const results = await Promise.all(
      scannedSymbols.map(async (sym) => {
        const asset = resolveAsset(sym);
        const klineRes = await fetchRealCandles(asset.symbol, '15m', 30);
        const setup = computeQuantitativeSetup(asset, klineRes.candles, '15m');

        return {
          symbol: asset.symbol,
          name: asset.name,
          category: asset.category,
          price: asset.price,
          change24h: asset.change24h,
          signalType: setup.signalType,
          direction: setup.direction,
          confidence: setup.confluenceScore,
          confluenceScore: setup.confluenceScore,
          entry: setup.entry,
          stopLoss: setup.stopLoss,
          takeProfit1: setup.takeProfit1,
          takeProfit2: setup.takeProfit2,
          takeProfit3: setup.takeProfit3,
          riskRewardRatio: setup.riskRewardRatio,
          marketStructure: setup.marketStructure,
          bengaliHeadline:
            setup.direction === 'LONG'
              ? `বুলিশ সেটআপ: ${asset.symbol} এ বাই (BUY) সংকেত`
              : `বেয়ারিশ সেটআপ: ${asset.symbol} এ সেল (SELL) সংকেত`,
          dataSource: klineRes.dataSource,
          dataStatus: klineRes.dataStatus,
        };
      })
    );

    res.json({ success: true, setups: results, timestamp: Date.now() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Scanner error' });
  }
});

// 5. AI Trading Mentor & Interactive Chat with Real Market Context
app.post('/api/ai/mentor-chat', async (req: Request, res: Response) => {
  try {
    const { message, activeSymbol = 'BTCUSDT', language = 'bn' } = req.body;
    const asset = resolveAsset(activeSymbol);
    const klineRes = await fetchRealCandles(asset.symbol, '15m', 20);
    const lastCandle = klineRes.candles[klineRes.candles.length - 1];
    const rsiStr = lastCandle?.rsi ? `RSI(14): ${lastCandle.rsi}` : '';
    const ema20Str = lastCandle?.ema20 ? `EMA20: $${lastCandle.ema20}` : '';

    const systemPrompt = `
You are TradePulse AI, an elite institutional trading mentor and technical analyst.
The user is currently viewing ${asset.name} (${asset.symbol}) with REAL market data from ${asset.dataSource}.
Current Real Price: $${asset.price} | 24h Change: ${asset.change24h}% | 24h High: $${asset.high24h} | 24h Low: $${asset.low24h}
${rsiStr} | ${ema20Str}

Language instructions:
If the user asks in Bengali or language is 'bn', answer in fluent, supportive, professional Bengali with correct trading terminology (এন্ট্রি, স্টপ লস, টেক প্রফিট, সাপোর্ট, রেজিস্ট্যান্স, রিস্ক-রিওয়ার্ড).
If asked in English, answer in English.

Guidelines:
1. Provide actionable advice on entry timing, stop-loss protection (swing low/ATR), and target scaling.
2. Emphasize risk management: never risk more than 1-2% of total equity per trade.
3. Be clear, concise, formatted with clean bullet points.
`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: message,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout after 6s')), 6000)
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);

        return res.json({ success: true, text: response.text || 'Analysis completed.' });
      } catch (geminiErr) {
        console.error('Gemini chat error:', geminiErr);
      }
    }

    // Fallback response in Bengali/English grounded in real price
    const isBn = language === 'bn' || /[\u0980-\u09FF]/.test(message);
    const fallbackText = isBn
      ? `**ট্রেডিং এনালাইসিস (${asset.name} - ${asset.symbol}):**\n\n- **রিয়েল মার্কেট প্রাইস:** ${asset.symbol} বর্তমানে $${asset.price} লেভেলে ট্রেড করছে (২৪ ঘণ্টার পরিবর্তন: ${asset.change24h >= 0 ? '+' : ''}${asset.change24h}%).\n- **ডাটা সোর্স:** ${asset.dataSource}\n- **এন্ট্রি পরামর্শ:** তাৎক্ষণিক ফোমো (FOMO) এড়িয়ে চলুন। চার্টে পুলব্যাক বা সাপোর্ট কনফার্মেশনের জন্য অপেক্ষা করুন।\n- **স্টপ লস (SL):** নিকটবর্তী সুইং লো বা কী-সাপোর্টের নিচে সেট করুন যাতে ক্যাপিটাল সুরক্ষিত থাকে।\n- **রিস্ক ম্যানেজমেন্ট রুল:** প্রতি ট্রেডে আপনার মোট একাউন্টের সর্বোচ্চ ১%-২% রিস্ক নিন। কমপক্ষে ১:২ রিস্ক-টু-রিওয়ার্ড রেশিও বজায় রাখুন।\n\nআপনি চাইলে নির্দিষ্ট কোনো টাইমফ্রেম (15m, 1h, 4h) বা সূচক (RSI, MACD, EMA) নিয়ে বিস্তারিত জানতে চাইতে পারেন!`
      : `**Trading Analysis (${asset.name} - ${asset.symbol}):**\n\n- **Real Market Price:** ${asset.symbol} is trading at $${asset.price} (${asset.change24h >= 0 ? '+' : ''}${asset.change24h}% 24h change).\n- **Data Source:** ${asset.dataSource}\n- **Entry Strategy:** Avoid chasing green candles (FOMO). Wait for a confirmed retest on key support or order blocks.\n- **Stop Loss:** Place your invalidation strictly beyond structural swing levels.\n- **Risk Management:** Strictly cap risk at 1-2% of total equity per setup with at least 1:2 Risk-to-Reward ratio.\n\nFeel free to ask for specific timeframe analysis or indicator confluence!`;

    res.json({ success: true, text: fallbackText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Chat error' });
  }
});

// ---------------- VITE MIDDLEWARE SETUP ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TradePulse AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
