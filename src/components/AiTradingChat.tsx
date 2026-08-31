import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  HelpCircle, 
  CornerDownLeft, 
  ShieldCheck, 
  Zap,
  TrendingUp
} from 'lucide-react';
import { ChatMessage, MarketAsset, Language, TradeSignal } from '../types';
import { translations } from '../utils/translations';

interface AiTradingChatProps {
  asset: MarketAsset;
  activeSignal: TradeSignal | null;
  language: Language;
}

export const AiTradingChat: React.FC<AiTradingChatProps> = ({
  asset,
  activeSignal,
  language,
}) => {
  const t = translations[language];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: language === 'bn'
        ? `👋 স্বাগতম! আমি **TradePulse AI** - আপনার স্মার্ট ট্রেডিং মেন্টর।\n\nআপনি বর্তমানে **${asset.name} (${asset.symbol})** দেখছেন। আমি মার্কেট স্ট্রাকচার, সঠিক এন্ট্রি জোন, স্টপ লস ও রিস্ক ম্যানেজমেন্ট সম্পর্কিত যেকোনো প্রশ্নের বিশদ উত্তর দিতে পারি।\n\nনিচের যেকোনো প্রশ্নে ক্লিক করুন বা নিজের মতো প্রশ্ন লিখুন!`
        : `👋 Welcome! I am **TradePulse AI** - your quantitative trading assistant.\n\nYou are analyzing **${asset.name} (${asset.symbol})**. Ask me anything regarding key support/resistance levels, entry timing, stop loss placement, indicator confluence, or risk management strategy.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = language === 'bn' ? [
    `এখন ${asset.symbol} এ লং নাকি শর্ট এন্ট্রি ঠিক হবে?`,
    `${asset.symbol} এ স্টপ লস (SL) কোথায় সেট করা উচিত?`,
    `১:৩ রিস্ক-রিওয়ার্ড রুল কী এবং কেন দরকার?`,
    `RSI এবং MACD দিয়ে কনফার্মেশন পাওয়ার উপায় কী?`,
    `ফোমো (FOMO) ট্রেডিং কীভাবে এড়ানো যায়?`,
  ] : [
    `Is ${asset.symbol} setting up for a Long or Short?`,
    `Where is the ideal invalidation / Stop Loss for ${asset.symbol}?`,
    `Explain the 1:3 Risk-to-Reward golden rule.`,
    `How to confirm breakout using RSI and EMA ribbons?`,
    `Best strategy to scale out profits at TP1 and TP2?`,
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          activeSymbol: asset.symbol,
          language,
        }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: data.text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Failed to generate response');
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: language === 'bn'
          ? `**${asset.symbol} ট্রেডিং নোট:**\n- বর্তমান মার্কেট প্রাইস: $${asset.price}\n- যেকোনো এন্ট্রি নেয়ার আগে পুলব্যাক এবং ভলিউম কনফার্মেশনের অপেক্ষা করুন।\n- স্টপ লস সবসময় নিকটবর্তী কী-সুইং পয়েন্টের নিচে রাখুন।`
          : `**${asset.symbol} Trading Note:**\n- Live Price: $${asset.price}\n- Prioritize waiting for high-timeframe confirmation before executing market orders. Maintain a minimum 1:2 R:R.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col h-[600px] justify-between">
      {/* Mentor Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.aiMentor}</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Gemini 3.7 Pro
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'বাংলা ও ইংরেজিতে ট্রেডিং স্ট্র্যাটেজি ও এন্ট্রি-এক্সিট বিষয়ক প্রশ্নোত্তর'
                : 'Real-time quantitative trade Q&A & price action mentor'}
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 hidden sm:block">
          Asset: <strong className="text-white">{asset.symbol}</strong>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                  isBot
                    ? 'bg-slate-950 border border-slate-800 text-slate-200'
                    : 'bg-emerald-600 text-slate-950 font-medium'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 font-mono ${isBot ? 'text-slate-500' : 'text-slate-900/80'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {!isBot && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{language === 'bn' ? 'মেন্টর এনালাইসিস লিখছে...' : 'Mentor analyzing market data...'}</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.quickQuestions}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-800 transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            placeholder={t.askMentor}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
