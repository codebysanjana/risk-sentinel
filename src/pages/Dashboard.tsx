import { useApp } from '@/store/AppContext';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { cn } from '@/lib/cn';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Bot,
  TrendingUp,
  Zap,
  PlayCircle,
  ChevronRight,
} from 'lucide-react';
import type { DashboardStats } from '@/types';
import { formatTime } from '@/lib/utils';

export function Dashboard() {
  const { stats, transactions, setCurrentPage, runSim, addToast, setAttackReplayOpen, setSelectedTransaction, simLoading, simError, retryLastSim, settings } = useApp();

  const recentHighRisk = transactions
    .filter((t) => t.risk_level === 'HIGH' || t.risk_level === 'CRITICAL')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Good morning, Risk Analyst.
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm md:text-base">
          Here's what your payment ecosystem looks like right now.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          icon={Activity}
          label="Transactions Analyzed"
          value={stats.transactions_analyzed}
          color="cyan"
          delay={0}
        />
        <StatCard
          icon={AlertTriangle}
          label="High Risk"
          value={stats.high_risk}
          color="critical"
          delay={100}
        />
        <StatCard
          icon={Eye}
          label="Under Review"
          value={stats.under_review}
          color="amber"
          delay={200}
        />
        <StatCard
          icon={ShieldCheck}
          label="Fraud Prevented"
          value={stats.fraud_prevented}
          color="green"
          delay={300}
        />
        <StatCard
          icon={Bot}
          label="AI Confidence"
          value={stats.ai_confidence}
          decimals={1}
          suffix="%"
          color="cyan"
          delay={400}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart */}
        <div className="lg:col-span-2 glass-card p-5 animate-fade-in-up animate-delay-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Risk Score Trend (24h)
              </h2>
              <p className="text-xs text-navy-300 mt-0.5">Average risk score per hour</p>
            </div>
            <span className="text-xs font-mono text-cyan-400/70">Live</span>
          </div>
          <TrendChart trend={stats.trend} />
        </div>

        {/* Risk distribution */}
        <div className="glass-card p-5 animate-fade-in-up animate-delay-300">
          <h2 className="text-sm font-semibold text-white mb-4">Risk Distribution</h2>
          <RiskDistributionChart distribution={stats.risk_distribution} total={stats.transactions_analyzed} />
        </div>
      </div>

      {/* Simulation buttons + recent high risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick simulations */}
        <div className="glass-card p-5 animate-fade-in-up animate-delay-300">
          <h2 className="text-sm font-semibold text-white mb-1">Threat Simulations</h2>
          <p className="text-xs text-navy-300 mb-4">Generate synthetic attack scenarios</p>
          <div className="space-y-2">
            <SimButton
              label="Simulate Account Takeover"
              icon={Bot}
              color="critical"
              loading={simLoading}
              onClick={async () => {
                try {
                  const result = await runSim('account-takeover');
                  setSelectedTransaction(result.transaction);
                  addToast({ type: 'warning', title: 'Simulation Complete', message: `${result.transaction.threat_type} — Score: ${result.analysis.risk_score}/100` });
                  setAttackReplayOpen(true);
                } catch { retryLastSim(); }
              }}
            />
            <SimButton
              label="Simulate Velocity Attack"
              icon={Zap}
              color="high"
              loading={simLoading}
              onClick={async () => {
                try {
                  const result = await runSim('velocity');
                  setSelectedTransaction(result.transaction);
                  addToast({ type: 'warning', title: 'Simulation Complete', message: `${result.transaction.threat_type} — Score: ${result.analysis.risk_score}/100` });
                  setAttackReplayOpen(true);
                } catch { retryLastSim(); }
              }}
            />
            <SimButton
              label="Simulate Suspicious Device"
              icon={PlayCircle}
              color="amber"
              loading={simLoading}
              onClick={async () => {
                try {
                  const result = await runSim('suspicious-device');
                  setSelectedTransaction(result.transaction);
                  addToast({ type: 'warning', title: 'Simulation Complete', message: `${result.transaction.threat_type} — Score: ${result.analysis.risk_score}/100` });
                  setAttackReplayOpen(true);
                } catch { retryLastSim(); }
              }}
            />
            <SimButton
              label="Simulate Normal Transaction"
              icon={ShieldCheck}
              color="green"
              loading={simLoading}
              onClick={async () => {
                try {
                  const result = await runSim('normal');
                  setSelectedTransaction(result.transaction);
                  addToast({ type: 'success', title: 'Simulation Complete', message: `${result.transaction.threat_type} — Score: ${result.analysis.risk_score}/100` });
                } catch { retryLastSim(); }
              }}
            />
          </div>
          {simError && (
            <div className="mt-3 p-3 rounded-lg bg-risk-critical/5 border border-risk-critical/20">
              <div className="text-xs text-risk-critical mb-2">{simError}</div>
              <button
                onClick={retryLastSim}
                className="text-xs px-3 py-1.5 rounded-lg bg-risk-critical/10 border border-risk-critical/30 text-risk-critical hover:bg-risk-critical/20 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Recent high-risk transactions */}
        <div className="lg:col-span-2 glass-card p-5 animate-fade-in-up animate-delay-400">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent High-Risk Activity</h2>
            <button
              onClick={() => setCurrentPage('live-monitor')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentHighRisk.length === 0 ? (
              <div className="text-center py-8 text-navy-300 text-sm">
                No high-risk transactions detected
              </div>
            ) : (
              recentHighRisk.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTransaction(t);
                    setCurrentPage('live-monitor');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-navy-800/40 hover:bg-navy-700/40 cursor-pointer transition-all duration-200 group"
                >
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg border text-xs font-bold font-mono',
                    t.risk_level === 'CRITICAL' ? 'bg-risk-critical/10 border-risk-critical/30 text-risk-critical' : 'bg-risk-high/10 border-risk-high/30 text-risk-high'
                  )}>
                    {t.risk_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{t.id}</div>
                    <div className="text-xs text-navy-300 truncate">
                      {t.currency}{t.amount.toLocaleString()} · {t.location} · {t.threat_type}
                    </div>
                  </div>
                  <div className="text-xs text-navy-300 hidden sm:block">
                    {formatTime(t.timestamp)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-navy-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: typeof Activity;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  color: 'cyan' | 'critical' | 'amber' | 'green';
  delay: number;
}

function StatCard({ icon: Icon, label, value, decimals = 0, suffix = '', color, delay }: StatCardProps) {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    critical: 'text-risk-critical bg-risk-critical/10 border-risk-critical/20',
    amber: 'text-risk-medium bg-risk-medium/10 border-risk-medium/20',
    green: 'text-risk-low bg-risk-low/10 border-risk-low/20',
  };

  return (
    <div
      className="glass-card glass-card-hover p-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg border', colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={cn('text-2xl md:text-3xl font-bold font-mono', colors[color].split(' ')[0])}>
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="text-xs text-navy-300 mt-1">{label}</div>
    </div>
  );
}

function TrendChart({ trend }: { trend: DashboardStats['trend'] }) {
  if (trend.length === 0) {
    return <div className="h-40 flex items-center justify-center text-navy-300 text-sm">Loading trend data...</div>;
  }

  const maxScore = 100;
  const width = 100;
  const height = 160;
  const padding = 4;

  const points = trend.map((d, i) => {
    const x = padding + (i / (trend.length - 1)) * (width - 2 * padding);
    const y = height - padding - (d.risk_score / maxScore) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(31, 199, 240, 0.3)" />
            <stop offset="100%" stopColor="rgba(31, 199, 240, 0)" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1fc7f0" />
            <stop offset="100%" stopColor="#4ddcff" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = height - padding - (v / maxScore) * (height - 2 * padding);
          return (
            <line key={v} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(74, 93, 138, 0.1)" strokeWidth="0.2" />
          );
        })}
        <path d={areaD} fill="url(#trendGradient)" />
        <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="0.8" fill="#4ddcff" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-navy-300 font-mono">
        <span>{trend[0]?.hour}</span>
        <span>{trend[Math.floor(trend.length / 2)]?.hour}</span>
        <span>{trend[trend.length - 1]?.hour}</span>
      </div>
    </div>
  );
}

function RiskDistributionChart({ distribution, total }: { distribution: DashboardStats['risk_distribution']; total: number }) {
  const segments = [
    { label: 'Low', value: distribution.low, color: '#10b981' },
    { label: 'Medium', value: distribution.medium, color: '#f59e0b' },
    { label: 'High', value: distribution.high, color: '#f97316' },
    { label: 'Critical', value: distribution.critical, color: '#ef4444' },
  ];

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36 mb-4">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {segments.map((seg) => {
            const len = (seg.value / total) * circumference;
            const circle = (
              <circle
                key={seg.label}
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            );
            offset += len;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-white font-mono">{total}</div>
          <div className="text-[10px] text-navy-300">Total</div>
        </div>
      </div>
      <div className="space-y-1.5 w-full">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-300">{seg.label}</span>
            </div>
            <span className="font-mono text-navy-300">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SimButtonProps {
  label: string;
  icon: typeof Bot;
  color: 'critical' | 'high' | 'amber' | 'green';
  onClick: () => void;
  loading?: boolean;
}

function SimButton({ label, icon: Icon, color, onClick, loading }: SimButtonProps) {
  const colors = {
    critical: 'bg-risk-critical/5 border-risk-critical/20 text-risk-critical hover:bg-risk-critical/10',
    high: 'bg-risk-high/5 border-risk-high/20 text-risk-high hover:bg-risk-high/10',
    amber: 'bg-risk-medium/5 border-risk-medium/20 text-risk-medium hover:bg-risk-medium/10',
    green: 'bg-risk-low/5 border-risk-low/20 text-risk-low hover:bg-risk-low/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 group',
        colors[color],
        loading && 'opacity-50 cursor-wait',
      )}
    >
      <Icon className={cn('w-4 h-4', loading ? 'animate-spin' : 'group-hover:scale-110 transition-transform')} />
      {loading ? 'Running simulation...' : label}
    </button>
  );
}
