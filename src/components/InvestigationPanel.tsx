import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/store/AppContext';
import { cn } from '@/lib/cn';
import { analyzeRisk } from '@/lib/riskEngine';
import { createInvestigation as apiCreateInvestigation, isApiConfigured, ApiError } from '@/services/api';
import type { RiskAnalysis, RecommendedAction, Investigation } from '@/types';
import { formatCurrency, formatTime, riskBgColor, actionBgColor } from '@/lib/utils';
import {
  X,
  ShieldAlert,
  Clock,
  Fingerprint,
  Bot,
  AlertTriangle,
  CheckCircle,
  FileText,
  PlayCircle,
  ChevronRight,
} from 'lucide-react';

export function InvestigationPanel() {
  const {
    selectedTransaction,
    investigationPanelOpen,
    setInvestigationPanelOpen,
    setAttackReplayOpen,
    setCurrentPage,
    addInvestigation,
    addToast,
    investigations,
    settings,
  } = useApp();

  const [humanDecision, setHumanDecision] = useState<RecommendedAction | 'PENDING'>('PENDING');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const analysis: RiskAnalysis | null = useMemo(() => {
    if (!selectedTransaction) return null;
    const result = analyzeRisk({
      amount: selectedTransaction.amount,
      currency: selectedTransaction.currency,
      account_age_days: selectedTransaction.account_age_days,
      is_new_device: selectedTransaction.is_new_device,
      is_new_location: selectedTransaction.is_new_location,
      failed_attempts: selectedTransaction.failed_attempts,
      transaction_velocity: selectedTransaction.transaction_velocity,
      historical_average: selectedTransaction.historical_average,
      transaction_id: selectedTransaction.id,
      timestamp: selectedTransaction.timestamp,
      location: selectedTransaction.location,
      device_info: selectedTransaction.device_info,
    });
    return { transaction_id: selectedTransaction.id, ...result };
  }, [selectedTransaction]);

  if (!investigationPanelOpen || !selectedTransaction || !analysis) return null;

  const handleCreateInvestigation = async () => {
    setSaving(true);
    setSaveError(null);

    const invData = {
      transaction_id: selectedTransaction.id,
      risk_score: analysis.risk_score,
      risk_level: analysis.risk_level,
      threat_type: analysis.threat_type,
      recommended_action: analysis.recommended_action,
      risk_factors: analysis.risk_factors,
      timeline: analysis.timeline,
      attack_story: analysis.attack_story,
      notes,
      human_decision: humanDecision,
      analyst: 'Risk Analyst',
    };

    try {
      if (settings.apiMode && isApiConfigured()) {
        const created = await apiCreateInvestigation(invData);
        addInvestigation(created);
        addToast({
          type: 'success',
          title: 'Investigation Saved',
          message: `Investigation ${created.id} created for ${selectedTransaction.id}`,
        });
      } else {
        const inv: Investigation = {
          id: `INV-${Date.now()}`,
          transaction_id: selectedTransaction.id,
          created_at: new Date().toISOString(),
          analyst: 'Risk Analyst',
          risk_score: analysis.risk_score,
          risk_level: analysis.risk_level,
          threat_type: analysis.threat_type,
          recommended_action: analysis.recommended_action,
          human_decision: humanDecision,
          status: (humanDecision === 'PENDING' ? 'open' : 'resolved') as 'open' | 'reviewing' | 'resolved',
          notes,
          ai_summary: analysis.attack_story,
        };
        addInvestigation(inv);
        addToast({
          type: 'success',
          title: 'Investigation Saved',
          message: `Investigation ${inv.id} created for ${selectedTransaction.id}`,
        });
      }
    } catch (err) {
      const msg = err instanceof ApiError
        ? (err.isNetworkError ? 'Cannot connect to backend. Check if it is running.' : err.message)
        : 'Failed to save investigation.';
      setSaveError(msg);
      addToast({ type: 'error', title: 'Save Failed', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = () => {
    setInvestigationPanelOpen(false);
    setCurrentPage('reports');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setInvestigationPanelOpen(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl glass-strong border-l border-navy-600/30 overflow-y-auto scrollbar-thin animate-slide-in-right">
        <div className="sticky top-0 z-10 glass-strong border-b border-navy-600/30 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Transaction Investigation</h2>
              <p className="text-xs text-navy-300 font-mono">{selectedTransaction.id}</p>
            </div>
          </div>
          <button
            onClick={() => setInvestigationPanelOpen(false)}
            className="p-2 rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Risk Score Circle */}
          <RiskScoreCircle score={analysis.risk_score} level={analysis.risk_level} />

          {/* Threat Classification */}
          <div className="glass-card p-4">
            <div className="text-xs text-navy-300 uppercase tracking-wider mb-2">Threat Classification</div>
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn('w-5 h-5', analysis.threat_type === 'Normal Transaction' ? 'text-risk-low' : 'text-risk-critical')} />
              <span className="text-lg font-semibold text-white">{analysis.threat_type}</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-navy-300">AI Recommendation:</span>
              <span className={cn('px-2 py-1 rounded text-xs font-medium border', actionBgColor(analysis.recommended_action))}>
                {analysis.recommended_action}
              </span>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="glass-card p-4">
            <div className="text-xs text-navy-300 uppercase tracking-wider mb-3">Risk Factors</div>
            <div className="space-y-2">
              {analysis.risk_factors.map((f) => (
                <div key={f.key} className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
                  f.triggered ? 'bg-risk-critical/5 border-risk-critical/20' : 'bg-navy-800/30 border-navy-600/15'
                )}>
                  <div className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0',
                    f.triggered ? 'bg-risk-critical/10 text-risk-critical' : 'bg-risk-low/10 text-risk-low'
                  )}>
                    {f.triggered ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{f.label}</div>
                    <div className="text-xs text-navy-300">
                      {f.value} <span className="text-navy-400">vs</span> {f.normal_value}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-sm font-mono font-bold', f.triggered ? 'text-risk-critical' : 'text-risk-low')}>
                      {f.deviation}%
                    </div>
                    <div className="text-[10px] text-navy-300">deviation</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Attack Story */}
          <div className="glass-card p-4 border-cyan-400/15">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-cyan-400" />
              <div className="text-xs text-navy-300 uppercase tracking-wider">AI Attack Story</div>
              <span className="ml-auto text-[10px] font-mono text-amber-400/60 px-2 py-0.5 rounded bg-amber-400/5 border border-amber-400/20">
                DEMO · RECOMMENDATION
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{analysis.attack_story}</p>
            <div className="mt-3 text-xs text-amber-400/60 italic">
              This AI analysis is a recommendation based on synthetic behavioral signals, not absolute truth. Human review is required.
            </div>
          </div>

          {/* Risk Timeline */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div className="text-xs text-navy-300 uppercase tracking-wider">Risk Timeline</div>
            </div>
            <div className="space-y-3">
              {analysis.timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full border-2 flex-shrink-0',
                      event.type === 'critical' ? 'bg-risk-critical border-risk-critical/30' :
                      event.type === 'warning' ? 'bg-risk-medium border-risk-medium/30' :
                      event.type === 'success' ? 'bg-risk-low border-risk-low/30' :
                      'bg-cyan-400 border-cyan-400/30'
                    )} />
                    {i < analysis.timeline.length - 1 && <div className="w-px flex-1 bg-navy-600/30 mt-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">{event.label}</span>
                      <span className="text-xs text-navy-300 font-mono">{event.time}</span>
                    </div>
                    <p className="text-xs text-navy-300 mt-0.5">{event.description}</p>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] text-navy-400">Risk score:</span>
                      <span className={cn('text-xs font-mono font-bold',
                        event.risk_score > 80 ? 'text-risk-critical' :
                        event.risk_score > 60 ? 'text-risk-high' :
                        event.risk_score > 30 ? 'text-risk-medium' : 'text-risk-low'
                      )}>
                        {event.risk_score}/100
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Fingerprint */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              <div className="text-xs text-navy-300 uppercase tracking-wider">Behavioral Fingerprint</div>
            </div>
            <div className="space-y-2.5">
              {analysis.behavioral_fingerprint.map((fp) => (
                <div key={fp.signal} className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-xs text-slate-300 font-medium">{fp.signal}</div>
                  <div className="text-xs text-navy-300 text-right">
                    <span className="text-navy-400">Normal: </span>
                    {fp.normal_behavior}
                  </div>
                  <div className="text-right">
                    <div className={cn('text-xs font-medium',
                      fp.status === 'critical' ? 'text-risk-critical' :
                      fp.status === 'high' ? 'text-risk-high' :
                      fp.status === 'elevated' ? 'text-risk-medium' : 'text-risk-low'
                    )}>
                      {fp.current_behavior}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <div className="w-16 h-1 rounded-full bg-navy-700/50 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700',
                            fp.status === 'critical' ? 'bg-risk-critical' :
                            fp.status === 'high' ? 'bg-risk-high' :
                            fp.status === 'elevated' ? 'bg-risk-medium' : 'bg-risk-low'
                          )}
                          style={{ width: `${fp.deviation}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-navy-300">{fp.deviation}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="glass-card p-4">
            <div className="text-xs text-navy-300 uppercase tracking-wider mb-3">Transaction Details</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Amount" value={formatCurrency(selectedTransaction.amount, selectedTransaction.currency)} />
              <Detail label="Historical Avg" value={formatCurrency(selectedTransaction.historical_average, selectedTransaction.currency)} />
              <Detail label="Location" value={selectedTransaction.location} />
              <Detail label="Merchant" value={selectedTransaction.merchant || 'Unknown'} />
              <Detail label="Device" value={selectedTransaction.device_info || 'Unknown'} />
              <Detail label="IP Address" value={selectedTransaction.ip_address || 'Unknown'} />
              <Detail label="Account Age" value={`${selectedTransaction.account_age_days} days`} />
              <Detail label="Failed Attempts" value={`${selectedTransaction.failed_attempts}`} />
              <Detail label="Velocity" value={`${selectedTransaction.transaction_velocity} / 10 min`} />
              <Detail label="New Device" value={selectedTransaction.is_new_device ? 'Yes' : 'No'} />
              <Detail label="New Location" value={selectedTransaction.is_new_location ? 'Yes' : 'No'} />
              <Detail label="Timestamp" value={formatTime(selectedTransaction.timestamp)} />
            </div>
          </div>

          {/* Human Decision */}
          <div className="glass-card p-4">
            <div className="text-xs text-navy-300 uppercase tracking-wider mb-3">Human Decision</div>
            <div className="flex items-center gap-2 mb-3">
              {(['APPROVE', 'REVIEW', 'HOLD', 'PENDING'] as const).map((action) => (
                <button
                  key={action}
                  onClick={() => setHumanDecision(action)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200',
                    humanDecision === action
                      ? actionBgColor(action as RecommendedAction)
                      : 'bg-navy-800/40 border-navy-600/20 text-navy-300 hover:text-slate-200'
                  )}
                >
                  {action}
                </button>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add investigation notes..."
              className="w-full px-3 py-2 rounded-lg glass border border-navy-600/30 text-sm text-white placeholder-navy-300 focus:outline-none focus:border-cyan-400/40 transition-colors resize-none"
              rows={3}
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleCreateInvestigation}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
              >
                <CheckCircle className={cn('w-4 h-4', saving && 'animate-spin')} />
                {saving ? 'Saving...' : 'Save Investigation'}
              </button>
              <button
                onClick={() => { setAttackReplayOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700/40 border border-navy-600/30 text-slate-300 hover:text-cyan-300 text-sm font-medium transition-all duration-200"
              >
                <PlayCircle className="w-4 h-4" />
                Attack Replay
              </button>
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-700/40 border border-navy-600/30 text-slate-300 hover:text-cyan-300 text-sm font-medium transition-all duration-200 ml-auto"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            </div>
            {saveError && (
              <div className="mt-3 p-3 rounded-lg bg-risk-critical/5 border border-risk-critical/20">
                <div className="text-xs text-risk-critical mb-2">{saveError}</div>
                <button
                  onClick={handleCreateInvestigation}
                  className="text-xs px-3 py-1.5 rounded-lg bg-risk-critical/10 border border-risk-critical/30 text-risk-critical hover:bg-risk-critical/20 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function RiskScoreCircle({ score, level }: { score: number; level: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [score]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  const color = level === 'CRITICAL' ? '#ef4444' : level === 'HIGH' ? '#f97316' : level === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(74, 93, 138, 0.15)" strokeWidth="8" />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-100 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold font-mono text-white">{animatedScore}</div>
          <div className="text-sm text-navy-300">/ 100</div>
          <div className={cn('mt-2 px-3 py-1 rounded-full text-xs font-bold border', riskBgColor(level as never))}>
            {level}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-navy-300">{label}</div>
      <div className="text-sm text-white font-medium">{value}</div>
    </div>
  );
}
