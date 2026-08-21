import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { Bot, Zap, PlayCircle } from 'lucide-react';

export function TopBar() {
  const { settings, setAiPanelOpen, runSim, addToast, setAttackReplayOpen, setSelectedTransaction, setInvestigationPanelOpen } = useApp();

  const handleSim = (type: 'account-takeover' | 'velocity' | 'suspicious-device' | 'normal') => {
    const result = runSim(type);
    setSelectedTransaction(result.transaction);
    addToast({
      type: type === 'normal' ? 'success' : 'warning',
      title: 'Simulation Complete',
      message: `${result.transaction.threat_type} — Score: ${result.analysis.risk_score}/100`,
    });
    if (type !== 'normal') {
      setAttackReplayOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-navy-600/30">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-white tracking-wide">RISK SENTINEL</span>
        </div>

        {/* Right: status + actions */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {/* Mobile sim buttons */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => handleSim('account-takeover')}
              className="p-1.5 rounded-lg bg-risk-critical/10 border border-risk-critical/20 text-risk-critical"
              title="Simulate Account Takeover"
            >
              <Bot className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSim('velocity')}
              className="p-1.5 rounded-lg bg-risk-high/10 border border-risk-high/20 text-risk-high"
              title="Simulate Velocity Attack"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* AI Agent status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-risk-low/5 border border-risk-low/20">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
            </span>
            <span className="text-xs font-mono text-risk-low hidden sm:inline">AI Agent Online</span>
          </div>

          {/* Demo mode badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/5 border border-amber-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-mono text-amber-400/80 hidden sm:inline">Demo Mode</span>
          </div>

          {/* Ask Sentinel */}
          <button
            onClick={() => setAiPanelOpen(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 transition-all duration-200 group"
          >
            <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium hidden md:inline">Ask Sentinel</span>
          </button>
        </div>
      </div>
    </header>
  );
}
