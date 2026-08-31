import { useEffect, useRef, useState, useCallback } from 'react';
import { MarketAsset, Timeframe } from '../types';

export interface PriceTick {
  symbol: string;
  timeframe: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

interface UseMarketWebSocketOptions {
  symbol: string;
  timeframe: Timeframe;
  onTickers?: (tickers: MarketAsset[]) => void;
  onPriceTick?: (tick: PriceTick) => void;
}

export function useMarketWebSocket({
  symbol,
  timeframe,
  onTickers,
  onPriceTick,
}: UseMarketWebSocketOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(12);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isDestroyedRef = useRef<boolean>(false);
  const pingStartRef = useRef<number>(0);

  const onTickersRef = useRef(onTickers);
  const onPriceTickRef = useRef(onPriceTick);

  useEffect(() => {
    onTickersRef.current = onTickers;
  }, [onTickers]);

  useEffect(() => {
    onPriceTickRef.current = onPriceTick;
  }, [onPriceTick]);

  const sendSubscription = useCallback((s: string, tf: Timeframe) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            action: 'subscribe',
            symbol: s,
            timeframe: tf,
          })
        );
      } catch (e) {
        console.warn('WS send subscription failed:', e);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (isDestroyedRef.current) return;

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${wsProtocol}//${host}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isDestroyedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Immediately subscribe to active asset & timeframe
        sendSubscription(symbol, timeframe);

        // Ping for latency measurement
        pingStartRef.current = Date.now();
        try {
          ws.send(JSON.stringify({ action: 'ping' }));
        } catch {}
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'tickers' && Array.isArray(message.tickers)) {
            onTickersRef.current?.(message.tickers);
          } else if (message.type === 'price_tick') {
            onPriceTickRef.current?.(message);
          } else if (message.type === 'pong') {
            const rtt = Date.now() - pingStartRef.current;
            setLatency(Math.max(4, rtt));
          }
        } catch (err) {
          console.error('WS message parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (!isDestroyedRef.current) {
          // Exponential backoff reconnect: 1s, 2s, 4s, capped at 6s
          const delay = Math.min(6000, 1000 * Math.pow(1.5, reconnectAttemptsRef.current));
          reconnectAttemptsRef.current += 1;
          
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    } catch (err) {
      console.warn('WS initialization error:', err);
      // Fallback reconnect
      if (!isDestroyedRef.current) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    }
  }, [symbol, timeframe, sendSubscription]);

  // Handle active symbol / timeframe changes without full reconnect
  useEffect(() => {
    if (isConnected) {
      sendSubscription(symbol, timeframe);
    }
  }, [symbol, timeframe, isConnected, sendSubscription]);

  // Periodic heartbeat / ping every 15s to keep connection warm and measure latency
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        pingStartRef.current = Date.now();
        try {
          wsRef.current.send(JSON.stringify({ action: 'ping' }));
        } catch {}
      }
    }, 15000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Lifecycle connect / cleanup
  useEffect(() => {
    isDestroyedRef.current = false;
    connect();

    return () => {
      isDestroyedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    latency,
    reconnect: connect,
  };
}
