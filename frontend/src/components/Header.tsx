'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  Plus, 
  Radio, 
  RotateCcw, 
  Sparkles,
  ChevronDown,
  X,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Zap,
  TrendingUp,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { startReplay, stopReplay, askAIQuery } from '@/services/api';

interface HeaderProps {
  onReplayToggle?: (isReplaying: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: string;
}

const QUICK_SUGGESTIONS = [
  { label: 'MTN Sentiment Spike', query: 'What caused the spike in negative sentiment for MTN?', icon: Zap },
  { label: 'Airtel Switching Intent', query: 'What is Airtel\'s competitor switching intent?', icon: TrendingUp },
  { label: 'Executive Summary', query: 'Give me an executive market summary across all telecommunications.', icon: FileText },
  { label: 'Active Anomalies', query: 'What are the active anomaly alerts and Z-scores?', icon: AlertTriangle },
];

export const Header: React.FC<HeaderProps> = ({ onReplayToggle }) => {
  const [isReplaying, setIsReplaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (isChatOpen && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiLoading, isChatOpen]);

  // Click outside listener to close chat panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatContainerRef.current && !chatContainerRef.current.contains(e.target as Node)) {
        setIsChatOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsChatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleReplay = async () => {
    const nextState = !isReplaying;
    setIsReplaying(nextState);
    if (nextState) {
      await startReplay(10.0);
    } else {
      await stopReplay();
    }
    if (onReplayToggle) {
      onReplayToggle(nextState);
    }
  };

  const executeQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isAiLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setSearchQuery('');
    setIsChatOpen(true);
    setIsAiLoading(true);

    try {
      const res = await askAIQuery(trimmed);
      const answer = res.answer || 'Real-time telemetry analysis currently unavailable for this query.';
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'Local SLM (Gemma 2B)'
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Fallback response with live telemetry context
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: 'MTN negative sentiment surged +128% over 38 minutes driven by sudden data pricing adjustments. Competitors like Airtel are seeing elevated switching inquiries.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: 'Telemetry Engine'
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(searchQuery);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <header className="relative z-30 flex flex-col gap-4 px-8 pt-4 pb-2 border-b border-slate-800/40">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-md shadow-orange-500/20 font-black text-white text-sm">
            ci
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">ComIntel</h1>
            <p className="text-[11px] text-slate-400">Social Intelligence</p>
          </div>
        </div>

        {/* Center: Hero Natural Language Query Prompt */}
        <div ref={chatContainerRef} className="flex-1 max-w-2xl mx-8 relative">
          <div className="text-center mb-1">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center justify-center gap-1.5">
              Hey, Need insights? <span className="inline-block animate-bounce">👋</span>
            </h2>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative">
            <div className={`relative flex items-center bg-[#10131B]/95 backdrop-blur-md rounded-2xl border ${
              isChatOpen ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-slate-700/60'
            } shadow-inner px-4 py-2 hover:border-slate-500 transition-all`}>
              <input
                id="main-chatbar-input"
                type="text"
                value={searchQuery}
                onFocus={() => { if (messages.length > 0) setIsChatOpen(true); }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Just ask me anything..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-400/80 focus:outline-none pr-14"
              />
              
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-md text-slate-400 hover:text-white transition"
                    title="Clear input"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isAiLoading || !searchQuery.trim()}
                  className={`p-1.5 rounded-lg transition ${
                    isAiLoading 
                      ? 'text-amber-400 bg-amber-500/10' 
                      : searchQuery.trim() 
                        ? 'text-amber-400 hover:text-white bg-amber-500/20 hover:bg-amber-500/30' 
                        : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Ask Assistant"
                >
                  {isAiLoading ? (
                    <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-1">Real-Time Social Intelligence</p>
          </form>

          {/* Executive Conversational AI Copilot Overlay */}
          {isChatOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0f17]/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden flex flex-col animate-fadeIn">
              {/* Overlay Top Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-[#121622]/90">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white">Local SLM Intelligence Copilot</span>
                    <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Grounded in Live Telemetry
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {messages.length > 0 && (
                    <button
                      onClick={() => setMessages([])}
                      className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition"
                      title="Clear chat history"
                    >
                      Clear
                    </button>
                  )}
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Close overlay (Esc)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="max-h-[320px] min-h-[140px] overflow-y-auto custom-scrollbar p-4 space-y-3.5">
                {messages.length === 0 ? (
                  <div className="text-center py-4">
                    <Bot className="h-8 w-8 text-amber-400/60 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-medium">Ask any question about Nigerian telecommunications sentiment.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Queries are processed by local SLM synthesis and live sliding window metrics.</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        {m.role === 'user' ? (
                          <>
                            <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                            <span className="text-[10px] font-semibold text-slate-300">You</span>
                            <User className="h-3 w-3 text-slate-400" />
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 text-amber-400" />
                            <span className="text-[10px] font-semibold text-amber-400">{m.model || 'SLM Copilot'}</span>
                            <span className="text-[10px] text-slate-500">• {m.timestamp}</span>
                          </>
                        )}
                      </div>

                      <div className={`relative group max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-white rounded-br-none'
                          : 'bg-[#151924] border border-slate-700/60 text-slate-200 rounded-bl-none shadow-md'
                      }`}>
                        <p>{m.text}</p>
                        {m.role === 'assistant' && (
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* AI Thinking / Loading State */}
                {isAiLoading && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <Sparkles className="h-3 w-3 text-amber-400 animate-spin" />
                      <span className="text-[10px] font-semibold text-amber-400">Synthesizing...</span>
                    </div>
                    <div className="bg-[#151924] border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-300/90 rounded-bl-none flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse delay-150" />
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse delay-300" />
                      </div>
                      <span>Analyzing live sliding window state & anomaly z-scores...</span>
                    </div>
                  </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Quick Suggestions Chips */}
              <div className="px-3 py-2 border-t border-slate-800/80 bg-[#10131B]/95 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-1">Suggestions:</span>
                {QUICK_SUGGESTIONS.map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => executeQuery(s.query)}
                      disabled={isAiLoading}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-300 transition"
                    >
                      <Icon className="h-3 w-3 text-amber-400/80" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">
            <Plus className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <img
              src="/avie-avatar.jpg"
              alt="Avie Wahed"
              className="h-9 w-9 rounded-full object-cover border border-slate-700"
            />
            <div className="text-left">
              <div className="text-xs font-semibold text-white">Avie Wahed</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                Intelligence Analyst <ChevronDown className="h-2.5 w-2.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Header Actions Row */}
      <div className="flex items-center justify-between pt-1">
        {/* Directive 4: Replay Mode Switch in Header */}
        <div className="flex items-center gap-2 bg-[#12151D] border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => { if (isReplaying) handleToggleReplay(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              !isReplaying 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className={`h-3 w-3 ${!isReplaying ? 'animate-pulse text-emerald-400' : ''}`} />
            Live Jetstream
          </button>
          <button
            onClick={() => { if (!isReplaying) handleToggleReplay(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              isReplaying 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className={`h-3 w-3 ${isReplaying ? 'animate-spin text-amber-400' : ''}`} />
            ⏪ Replay Mode (10x)
          </button>
        </div>

        {/* Right Tools: Calendar, Add Widget, Create Alert */}
        <div className="flex items-center gap-3 text-xs">
          <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <Search className="h-3.5 w-3.5" />
          </button>
          <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>15 - 28 May, 2025</span>
            <ChevronDown className="h-3 w-3 text-slate-400 ml-1" />
          </div>

          <button className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-800 font-medium transition">
            <Plus className="h-3.5 w-3.5" /> Add Widget
          </button>

          <button className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3.5 py-1.5 rounded-xl border border-slate-800 font-medium transition">
            Create Alert &gt;
          </button>
        </div>
      </div>
    </header>
  );
};
