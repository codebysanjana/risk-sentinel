import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { analyzeRisk } from '@/lib/riskEngine';
import type { TimelineEvent } from '@/types';
import { X, PlayCircle, AlertTriangle, ShieldAlert, Bot } from 'lucide-react';

const REPLAY_STEPS = [
  { label: 'New device detected', description: 'Device fingerprint not previously associated with this account.', type: 'warning' as const, score: 12 },
  { label: 'New location detected', description: 'Transaction originated from an unrecognized geographic region.', type: 'warning' as const, score: 28 },
  { label: 'Authentication failure', description: 'Multiple failed login attempts before successful authentication.', type: 'critical' as const, score: 41 },
  { label: 'Small initial transaction', description: '₹2,500 transaction processed — testing the account.', type: 'info' as const, score: 50 },
  { label: 'Transaction velocity increases', description: '7 transactions within 10 minutes — well above normal baseline.', type: 'warning' as const, score: 67 },
  { label: 'High-value transaction occurs', description: '₹45,000 transaction — 9× the customer\'s historical average.', type: 'critical' as const, score: 82 },
  { label: 'Risk score reaches critical', description: 'Composite risk score exceeds 90 — critical threshold.', type: 'critical' as const, score: 94 },
  { label: 'AI investigation triggered', description: 'Risk Sentinel AI agent activated for deep analysis.', type: 'critical' as const, score: 94 },
  { label: 'Recommendation generated', description: 'AI recommends HOLD + ADDITIONAL VERIFICATION.', type: 'critical' as const, score: 94 },
];

export function AttackReplay() {
  const { attackReplayOpen, setAttackReplayOpen, selectedTransaction } = useApp();
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setCompleted(false);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (attackReplayOpen) {
      reset();
      // Auto-start after a brief delay
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [attackReplayOpen, reset]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= REPLAY_STEPS.length - 1) {
      setCompleted(true);
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  if (!attackReplayOpen) return null;

  const currentScore = currentStep >= 0 ? REPLAY_STEPS[Math.min(currentStep, REPLAY_STEPS.length - 1)].score : 0;
  const scoreColor = currentScore > 80 ? '#ef4444' : currentScore > 60 ? '#f97316' : currentScore > 30 ? '#f59e0b' : '#10b981';

  return (
    <>
      <div
        className="fixed inset-0 z-[55] bg-navy-950/80 backdrop-blur-md animate-fade-in"
        onClick={() => setAttackReplayOpen(false)}
      />
      <div className="fixed inset-0 z-[56] flex items-center justify-center p-4 pointer-events-none">
        <div className="glass-strong border border-navy-600/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin pointer-events-auto animate-scale-in">
          {/* Header */}
          <div className="sticky top-0 z-10 glass-strong border-b border-navy-600/30 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-risk-critical/10 border border-risk-critical/30">
                <PlayCircle className="w-5 h-5 text-risk-critical" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Risk Attack Replay</h2>
                <p className="text-xs text-navy-300 font-mono">
                  {selectedTransaction ? selectedTransaction.id : 'TXN-DEMO'} · Synthetic scenario
                </p>
              </div>
            </div>
            <button
              onClick={() => setAttackReplayOpen(false)}
              className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Score visualization */}
            <div className="flex flex-col items-center py-4">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(74, 93, 138, 0.15)" strokeWidth="8" />
                  <circle
                    cx="100" cy="100" r="80"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 - (currentScore / 100) * 2 * Math.PI * 80}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                    style={{ filter: `drop-shadow(0 0 12px ${scoreColor}60)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold font-mono text-white transition-colors duration-300" style={{ color: currentScore > 0 ? scoreColor : '#e2e8f0' }}>
                    {currentScore}
                  </div>
                  <div className="text-xs text-navy-300">/ 100</div>
                </div>
              </div>
              <div className="mt-2 text-sm font-medium text-slate-300">
                {currentStep < 0 && 'Press play to begin replay'}
                {currentStep >= 0 && !completed && REPLAY_STEPS[currentStep]?.label}
                {completed && 'Replay complete'}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              {REPLAY_STEPS.map((step, i) => {
                const isPast = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-3 transition-all duration-300',
                      isPast ? 'opacity-100' : 'opacity-25',
                      isCurrent && 'translate-x-1'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                        isPast
                          ? step.type === 'critical' ? 'bg-risk-critical/10 border-risk-critical/40' :
                            step.type === 'warning' ? 'bg-risk-medium/10 border-risk-medium/40' :
                            'bg-cyan-400/10 border-cyan-400/40'
                          : 'border-navy-600/30'
                      )}>
                        {isPast && (
                          step.type === 'critical' ? <AlertTriangle className="w-4 h-4 text-risk-critical" /> :
                          step.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-risk-medium" /> :
                          <ShieldAlert className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      {i < REPLAY_STEPS.length - 1 && (
                        <div className={cn('w-px h-8 transition-colors duration-300', isPast ? 'bg-navy-500/40' : 'bg-navy-700/30')} />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-sm font-medium', isPast ? 'text-white' : 'text-navy-300')}>
                          {step.label}
                        </span>
                        <span className={cn('text-xs font-mono', isPast ? 'text-cyan-400' : 'text-navy-400')}>
                          {step.score}/100
                        </span>
                      </div>
                      <p className="text-xs text-navy-300 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion message */}
            {completed && (
              <div className="animate-fade-in-up space-y-3">
                <div className="glass-card p-4 border-risk-critical/20 glow-red">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-risk-critical" />
                    <span className="text-sm font-bold text-risk-critical">Potential attack pattern detected</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    The behavioral signals collectively form a pattern consistent with a known attack methodology.
                    This is a probabilistic assessment based on synthetic data.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card p-3">
                    <div className="text-xs text-navy-300 uppercase tracking-wider mb-1">Threat</div>
                    <div className="text-sm font-semibold text-white">Possible Account Takeover</div>
                  </div>
                  <div className="glass-card p-3">
                    <div className="text-xs text-navy-300 uppercase tracking-wider mb-1">Recommendation</div>
                    <div className="text-sm font-semibold text-risk-critical">HOLD + ADDITIONAL VERIFICATION</div>
                  </div>
                </div>
                <div className="glass-card p-3 border-cyan-400/15">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-navy-300">
                      AI recommends HOLD pending step-up authentication. Human approval required.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => { reset(); setTimeout(() => setIsPlaying(true), 100); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 text-sm font-medium transition-all duration-200"
              >
                <PlayCircle className="w-4 h-4" />
                Run Attack Replay
              </button>
              <button
                onClick={() => setAttackReplayOpen(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700/40 border border-navy-600/30 text-slate-300 hover:text-white text-sm font-medium transition-all duration-200 ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
