import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/cn';

interface InitScreenProps {
  onComplete: () => void;
  animationsEnabled: boolean;
}

const STAGES = [
  'Connecting to Risk Engine',
  'Loading Behavioral Intelligence',
  'Calibrating Fraud Signals',
  'Activating AI Investigation Agent',
  'Secure Environment Ready',
];

const DEMO_METRICS = [
  { label: 'transactions analyzed', value: 12842 },
  { label: 'anomalies detected', value: 143 },
  { label: 'high-risk events prevented', value: 67 },
];

export function InitScreen({ onComplete, animationsEnabled }: InitScreenProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [metricsShown, setMetricsShown] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const complete = useCallback(() => {
    setFadeOut(true);
    setTimeout(onComplete, 600);
  }, [onComplete]);

  useEffect(() => {
    if (!animationsEnabled) {
      setProgress(100);
      setMetricsShown(true);
      setTimeout(complete, 500);
      return;
    }

    const stageDuration = 900;
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= STAGES.length - 1) {
          clearInterval(interval);
          setMetricsShown(true);
          setTimeout(complete, 1200);
          return prev;
        }
        return prev + 1;
      });
    }, stageDuration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (STAGES.length * (stageDuration / 50));
        return Math.min(next, 100);
      });
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [animationsEnabled, complete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950 grid-bg radial-glow overflow-hidden',
        fadeOut && 'transition-opacity duration-500 opacity-0'
      )}
    >
      {/* Scanning line */}
      {animationsEnabled && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-scan" />
        </div>
      )}

      {/* Central scanner */}
      <div className="relative flex items-center justify-center mb-12">
        <div className={cn(
          'relative w-48 h-48',
          animationsEnabled && 'animate-spin-slow'
        )}>
          {/* Outer ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="rgba(31, 199, 240, 0.15)"
              strokeWidth="2"
            />
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="rgba(31, 199, 240, 0.6)"
              strokeWidth="2"
              strokeDasharray="40 525"
              strokeLinecap="round"
              className={animationsEnabled ? 'animate-spin-slow' : ''}
              style={{ transformOrigin: 'center' }}
            />
            <circle
              cx="100" cy="100" r="70"
              fill="none"
              stroke="rgba(31, 199, 240, 0.1)"
              strokeWidth="1"
            />
            <circle
              cx="100" cy="100" r="50"
              fill="none"
              stroke="rgba(31, 199, 240, 0.08)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Inner content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={cn(
              'text-cyan-400 font-bold text-sm tracking-[0.3em] mb-1',
              animationsEnabled && 'animate-pulse'
            )}>
              SENTINEL
            </div>
            <div className="text-navy-300 text-xs font-mono">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        {/* Glow */}
        <div className="absolute w-64 h-64 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      {/* Title */}
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-3 text-glow-cyan">
        RISK SENTINEL
      </h1>
      <p className="text-cyan-300/70 text-sm md:text-base tracking-wide mb-10 font-light">
        AI-Powered Payment Risk Intelligence
      </p>

      {/* Stages */}
      <div className="w-full max-w-md space-y-2 px-8">
        {STAGES.map((stage, i) => (
          <div
            key={stage}
            className={cn(
              'flex items-center gap-3 text-sm transition-all duration-300',
              i <= currentStage ? 'opacity-100' : 'opacity-25',
              i === currentStage && animationsEnabled && 'translate-x-1'
            )}
          >
            <span className={cn(
              'flex items-center justify-center w-5 h-5 rounded-full border text-xs',
              i < currentStage
                ? 'border-risk-low/40 bg-risk-low/10 text-risk-low'
                : i === currentStage
                ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400'
                : 'border-navy-400/30 text-navy-400'
            )}>
              {i < currentStage ? '✓' : i === currentStage && animationsEnabled ? '●' : ''}
            </span>
            <span className={cn(
              'font-mono',
              i <= currentStage ? 'text-slate-300' : 'text-navy-300'
            )}>
              {stage}
            </span>
          </div>
        ))}
      </div>

      {/* Demo metrics */}
      {metricsShown && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 animate-fade-in-up">
          {DEMO_METRICS.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-cyan-300 font-mono">
                {m.value.toLocaleString()}
              </div>
              <div className="text-xs text-navy-300 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={complete}
        className="absolute bottom-8 right-8 text-navy-300 hover:text-cyan-300 text-sm font-mono transition-colors duration-200 flex items-center gap-1"
      >
        Skip <span className="text-lg">→</span>
      </button>

      {/* DEMO indicator */}
      <div className="absolute bottom-8 left-8 flex items-center gap-2 text-xs font-mono text-amber-400/60">
        <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-pulse" />
        DEMO ENVIRONMENT — SYNTHETIC DATA
      </div>
    </div>
  );
}
