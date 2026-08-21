import { useApp, type Page } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import {
  LayoutDashboard,
  Activity,
  Search,
  Network,
  FileText,
  Settings,
  ShieldCheck,
  Bot,
  Zap,
  PlayCircle,
} from 'lucide-react';

const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live-monitor', label: 'Live Monitor', icon: Activity },
  { id: 'investigations', label: 'Investigations', icon: Search },
  { id: 'risk-graph', label: 'Risk Graph', icon: Network },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, settings } = useApp();

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 glass-strong border-r border-navy-600/30 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-navy-600/20">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div className="absolute inset-0 rounded-lg bg-cyan-400/5 blur-md" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide leading-tight">RISK SENTINEL</div>
            <div className="text-[10px] text-navy-300 font-mono">AI Risk Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20'
                  : 'text-navy-300 hover:text-slate-200 hover:bg-navy-700/40 border border-transparent'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-transform', active ? 'text-cyan-400' : 'group-hover:scale-110')} />
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </button>
          );
        })}
      </nav>

      {/* Simulations */}
      <div className="px-3 pb-3">
        <div className="text-[10px] uppercase tracking-wider text-navy-300 font-mono px-3 mb-2">Simulations</div>
        <SimulationButtons />
      </div>

      {/* Demo indicator */}
      {settings.demoMode && (
        <div className="px-3 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/5 border border-amber-400/20 text-[10px] font-mono text-amber-400/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            DEMO — SYNTHETIC DATA
          </div>
        </div>
      )}
    </aside>
  );
}

function SimulationButtons() {
  const { runSim, addToast, setAttackReplayOpen, setSelectedTransaction, setInvestigationPanelOpen } = useApp();

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

  const sims: { type: 'account-takeover' | 'velocity' | 'suspicious-device' | 'normal'; label: string; icon: typeof Zap }[] = [
    { type: 'account-takeover', label: 'Account Takeover', icon: Bot },
    { type: 'velocity', label: 'Velocity Attack', icon: Zap },
    { type: 'suspicious-device', label: 'Suspicious Device', icon: PlayCircle },
    { type: 'normal', label: 'Normal Transaction', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-1">
      {sims.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.type}
            onClick={() => handleSim(s.type)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-navy-300 hover:text-cyan-300 hover:bg-navy-700/40 transition-all duration-200 group"
          >
            <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function MobileNav() {
  const { currentPage, setCurrentPage } = useApp();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-navy-600/30">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
                active ? 'text-cyan-400' : 'text-navy-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
