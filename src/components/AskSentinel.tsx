import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { analyzeRisk } from '@/lib/riskEngine';
import { askSentinel, getSuggestedQuestions } from '@/lib/aiService';
import { askSentinelApi, isApiConfigured } from '@/services/api';
import type { AIResponse } from '@/types';
import { X, Bot, Send, Sparkles, AlertTriangle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  response?: AIResponse;
}

export function AskSentinel() {
  const { aiPanelOpen, setAiPanelOpen, selectedTransaction } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = getSuggestedQuestions();

  useEffect(() => {
    if (aiPanelOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Sentinel AI Investigation Agent online. I can analyze transaction risk signals, explain threat classifications, and recommend actions. Ask me anything about the current investigation.',
        },
      ]);
    }
  }, [aiPanelOpen, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!aiPanelOpen) return null;

  const handleAsk = async (question: string) => {
    if (!question.trim() || loading) return;

    const txn = selectedTransaction;
    if (!txn) {
      setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: 'Please select a transaction from Live Monitor to enable investigation analysis.' }]);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    const analysis = analyzeRisk({
      amount: txn.amount,
      currency: txn.currency,
      account_age_days: txn.account_age_days,
      is_new_device: txn.is_new_device,
      is_new_location: txn.is_new_location,
      failed_attempts: txn.failed_attempts,
      transaction_velocity: txn.transaction_velocity,
      historical_average: txn.historical_average,
      transaction_id: txn.id,
      timestamp: txn.timestamp,
      location: txn.location,
      device_info: txn.device_info,
    });

    try {
      const response = await askSentinel(question, { transaction_id: txn.id, ...analysis }, txn);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.risk_explanation, response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'AI service temporarily unavailable. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-navy-950/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setAiPanelOpen(false)}
      />
      <div className="fixed right-0 top-0 bottom-0 z-[56] w-full max-w-md glass-strong border-l border-navy-600/30 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="glass-strong border-b border-navy-600/30 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
              <Bot className="w-4.5 h-4.5 text-cyan-400" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-risk-low border-2 border-navy-900" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ask Sentinel</h2>
              <p className="text-[10px] text-risk-low font-mono">AI Agent Online · Demo Mode</p>
            </div>
          </div>
          <button
            onClick={() => setAiPanelOpen(false)}
            className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '')}>
              <div className={cn(
                'flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0',
                msg.role === 'assistant' ? 'bg-cyan-400/10 border border-cyan-400/30' : 'bg-navy-700/40 border border-navy-600/30'
              )}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-cyan-400" /> : <Sparkles className="w-3.5 h-3.5 text-slate-300" />}
              </div>
              <div className={cn(
                'max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm',
                msg.role === 'assistant'
                  ? 'glass-card text-slate-300 rounded-tl-sm'
                  : 'bg-cyan-400/10 border border-cyan-400/20 text-white rounded-tr-sm'
              )}>
                <p className="leading-relaxed">{msg.content}</p>
                {msg.response && (
                  <div className="mt-2.5 pt-2.5 border-t border-navy-600/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-navy-300">Threat:</span>
                      <span className="text-white font-medium">{msg.response.threat_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-navy-300">Confidence:</span>
                      <span className="text-cyan-400 font-mono">{(msg.response.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-navy-300">Action:</span>
                      <span className={cn('font-medium',
                        msg.response.recommended_action === 'APPROVE' ? 'text-risk-low' :
                        msg.response.recommended_action === 'REVIEW' ? 'text-risk-medium' : 'text-risk-critical'
                      )}>
                        {msg.response.recommended_action}
                      </span>
                    </div>
                    {msg.response.demo && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-amber-400/60">
                        <AlertTriangle className="w-3 h-3" />
                        Demo response · AI output is advisory only · Human approval required
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
                <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="glass-card px-3.5 py-2.5 rounded-xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="text-[10px] text-navy-300 uppercase tracking-wider mb-2">Suggested Questions</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="px-2.5 py-1.5 rounded-lg glass border border-navy-600/20 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-400/30 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-navy-600/30">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk(input)}
              placeholder="Ask about this transaction..."
              className="flex-1 px-3 py-2 rounded-lg glass border border-navy-600/30 text-sm text-white placeholder-navy-300 focus:outline-none focus:border-cyan-400/40 transition-colors"
            />
            <button
              onClick={() => handleAsk(input)}
              disabled={loading || !input.trim()}
              className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
