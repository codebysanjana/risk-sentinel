import type { RiskLevel, RecommendedAction, ThreatType } from '@/types';

export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'text-risk-low';
    case 'MEDIUM':
      return 'text-risk-medium';
    case 'HIGH':
      return 'text-risk-high';
    case 'CRITICAL':
      return 'text-risk-critical';
  }
}

export function riskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'bg-risk-low/10 text-risk-low border-risk-low/30';
    case 'MEDIUM':
      return 'bg-risk-medium/10 text-risk-medium border-risk-medium/30';
    case 'HIGH':
      return 'bg-risk-high/10 text-risk-high border-risk-high/30';
    case 'CRITICAL':
      return 'bg-risk-critical/10 text-risk-critical border-risk-critical/30';
  }
}

export function riskGlowClass(level: RiskLevel): string {
  switch (level) {
    case 'LOW':
      return 'glow-green';
    case 'MEDIUM':
      return 'glow-amber';
    case 'HIGH':
    case 'CRITICAL':
      return 'glow-red';
  }
}

export function actionColor(action: RecommendedAction): string {
  switch (action) {
    case 'APPROVE':
      return 'text-risk-low';
    case 'REVIEW':
      return 'text-risk-medium';
    case 'HOLD':
      return 'text-risk-critical';
  }
}

export function actionBgColor(action: RecommendedAction): string {
  switch (action) {
    case 'APPROVE':
      return 'bg-risk-low/10 text-risk-low border-risk-low/30';
    case 'REVIEW':
      return 'bg-risk-medium/10 text-risk-medium border-risk-medium/30';
    case 'HOLD':
      return 'bg-risk-critical/10 text-risk-critical border-risk-critical/30';
  }
}

export function threatIcon(threat: ThreatType): string {
  if (threat === 'Normal Transaction') return 'CheckCircle';
  if (threat.includes('Takeover')) return 'UserX';
  if (threat.includes('Velocity')) return 'Zap';
  if (threat.includes('Device')) return 'Smartphone';
  if (threat.includes('Amount')) return 'DollarSign';
  if (threat.includes('Failed')) return 'AlertTriangle';
  return 'ShieldAlert';
}
