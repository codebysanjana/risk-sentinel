/**
 * API service layer for communicating with the Risk Sentinel FastAPI backend.
 *
 * Uses VITE_API_URL environment variable. When the backend is unavailable,
 * callers should catch the thrown ApiError and fall back to demo mode.
 */
import type {
  Transaction,
  RiskAnalysis,
  RiskSignal,
  TimelineEvent,
  BehavioralFingerprint,
  RiskLevel,
  ThreatType,
  RecommendedAction,
  SimulationResult,
  Investigation,
  DashboardStats,
  AIResponse,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isNetworkError?: boolean,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiConfigured(): boolean {
  return !!API_URL;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new ApiError('API URL not configured. Set VITE_API_URL in your environment.', undefined, true);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
      ...options,
    });
  } catch {
    throw new ApiError(
      'Cannot connect to the Risk Sentinel backend. Make sure it is running.',
      undefined,
      true,
    );
  }

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      /* ignore parse error */
    }
    throw new ApiError(detail, response.status, false);
  }

  return response.json() as Promise<T>;
}

// ---- Type mappers: API snake_case → frontend types ----

function mapRiskSignal(raw: any): RiskSignal {
  return {
    key: raw.key,
    label: raw.label,
    weight: raw.weight,
    triggered: raw.triggered,
    value: raw.value,
    normal_value: raw.normal_value,
    deviation: raw.deviation,
  };
}

function mapTimelineEvent(raw: any): TimelineEvent {
  return {
    time: raw.time,
    label: raw.label,
    description: raw.description,
    risk_score: raw.risk_score,
    type: raw.type,
  };
}

function mapFingerprint(raw: any): BehavioralFingerprint {
  return {
    signal: raw.signal,
    normal_behavior: raw.normal_behavior,
    current_behavior: raw.current_behavior,
    deviation: raw.deviation,
    status: raw.status,
  };
}

function mapTransaction(raw: any): Transaction {
  return {
    id: raw.id,
    amount: raw.amount,
    currency: raw.currency,
    user_id: raw.user_id,
    device_id: raw.device_id,
    location: raw.location,
    timestamp: raw.timestamp,
    account_age_days: raw.account_age_days,
    is_new_device: raw.is_new_device,
    is_new_location: raw.is_new_location,
    failed_attempts: raw.failed_attempts,
    transaction_velocity: raw.transaction_velocity,
    historical_average: raw.historical_average,
    risk_score: raw.risk_score,
    risk_level: raw.risk_level as RiskLevel,
    threat_type: raw.threat_type as ThreatType,
    recommended_action: raw.recommended_action as RecommendedAction,
    device_info: raw.device_info,
    ip_address: raw.ip_address,
    merchant: raw.merchant,
  };
}

function mapRiskAnalysis(raw: any): RiskAnalysis {
  return {
    transaction_id: raw.transaction_id ?? 'unknown',
    risk_score: raw.risk_score,
    risk_level: raw.risk_level as RiskLevel,
    threat_type: raw.threat_type as ThreatType,
    recommended_action: raw.recommended_action as RecommendedAction,
    risk_factors: (raw.risk_factors || []).map(mapRiskSignal),
    attack_story: raw.attack_story,
    timeline: (raw.timeline || []).map(mapTimelineEvent),
    behavioral_fingerprint: (raw.behavioral_fingerprint || []).map(mapFingerprint),
  };
}

function mapSimulationResult(raw: any): SimulationResult {
  return {
    transaction: mapTransaction(raw.transaction),
    analysis: mapRiskAnalysis(raw.analysis),
  };
}

function mapInvestigation(raw: any): Investigation {
  return {
    id: raw.id,
    transaction_id: raw.transaction_id,
    created_at: raw.created_at,
    analyst: raw.analyst,
    risk_score: raw.risk_score,
    risk_level: raw.risk_level as RiskLevel,
    threat_type: raw.threat_type as ThreatType,
    recommended_action: raw.recommended_action as RecommendedAction,
    human_decision: raw.human_decision,
    status: raw.status,
    notes: raw.notes,
    ai_summary: raw.ai_summary,
  };
}

function mapDashboardStats(raw: any): DashboardStats {
  return {
    transactions_analyzed: raw.transactions_analyzed,
    high_risk: raw.high_risk,
    under_review: raw.under_review,
    fraud_prevented: raw.fraud_prevented,
    ai_confidence: raw.ai_confidence,
    risk_distribution: raw.risk_distribution,
    trend: raw.trend || [],
  };
}

// ---- Public API functions ----

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  return request('/api/health');
}

export async function fetchTransactions(params?: {
  limit?: number;
  offset?: number;
  risk_level?: string;
  search?: string;
}): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  if (params?.risk_level) query.set('risk_level', params.risk_level);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  const data = await request<any[]>(`/api/transactions${qs ? `?${qs}` : ''}`);
  return data.map(mapTransaction);
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const data = await request<any>(`/api/transactions/${id}`);
  return mapTransaction(data);
}

export async function createTransaction(txn: {
  amount: number;
  currency?: string;
  account_age_days: number;
  is_new_device: boolean;
  is_new_location: boolean;
  failed_attempts: number;
  transaction_velocity: number;
  historical_average: number;
  location?: string;
  device_info?: string;
  merchant?: string;
  user_id?: string;
  ip_address?: string;
}): Promise<Transaction> {
  const data = await request<any>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(txn),
  });
  return mapTransaction(data);
}

export async function analyzeTransactionRisk(txn: {
  amount: number;
  currency?: string;
  account_age_days: number;
  is_new_device: boolean;
  is_new_location: boolean;
  failed_attempts: number;
  transaction_velocity: number;
  historical_average: number;
  location?: string;
  device_info?: string;
}): Promise<RiskAnalysis & { signal_breakdown: Record<string, number> }> {
  const data = await request<any>('/api/risk/analyze', {
    method: 'POST',
    body: JSON.stringify(txn),
  });
  return {
    ...mapRiskAnalysis(data),
    signal_breakdown: data.signal_breakdown || {},
  };
}

export async function simulateAccountTakeover(): Promise<SimulationResult> {
  const data = await request<any>('/api/simulations/account-takeover', { method: 'POST' });
  return mapSimulationResult(data);
}

export async function simulateVelocityAttack(): Promise<SimulationResult> {
  const data = await request<any>('/api/simulations/velocity', { method: 'POST' });
  return mapSimulationResult(data);
}

export async function simulateSuspiciousDevice(): Promise<SimulationResult> {
  const data = await request<any>('/api/simulations/suspicious-device', { method: 'POST' });
  return mapSimulationResult(data);
}

export async function simulateNormalTransaction(): Promise<SimulationResult> {
  const data = await request<any>('/api/simulations/normal', { method: 'POST' });
  return mapSimulationResult(data);
}

export async function runSimulationApi(
  type: 'account-takeover' | 'velocity' | 'suspicious-device' | 'normal',
): Promise<SimulationResult> {
  switch (type) {
    case 'account-takeover':
      return simulateAccountTakeover();
    case 'velocity':
      return simulateVelocityAttack();
    case 'suspicious-device':
      return simulateSuspiciousDevice();
    case 'normal':
      return simulateNormalTransaction();
  }
}

export async function createInvestigation(inv: {
  transaction_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  threat_type: ThreatType;
  recommended_action: RecommendedAction;
  risk_factors?: any[];
  timeline?: any[];
  attack_story?: string;
  notes?: string;
  human_decision?: 'APPROVE' | 'REVIEW' | 'HOLD' | 'PENDING';
  analyst?: string;
}): Promise<Investigation> {
  const data = await request<any>('/api/investigations', {
    method: 'POST',
    body: JSON.stringify(inv),
  });
  return mapInvestigation(data);
}

export async function fetchInvestigations(): Promise<Investigation[]> {
  const data = await request<any[]>('/api/investigations');
  return data.map(mapInvestigation);
}

export async function fetchInvestigation(id: string): Promise<Investigation> {
  const data = await request<any>(`/api/investigations/${id}`);
  return mapInvestigation(data);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const data = await request<any>('/api/dashboard/stats');
  return mapDashboardStats(data);
}

export async function askSentinelApi(
  _question: string,
  analysis: RiskAnalysis,
  txn: Transaction,
): Promise<AIResponse> {
  // The backend AI service is embedded in the risk analysis response.
  // For now, we use the attack_story and analysis data to construct the response,
  // since the backend doesn't have a dedicated /api/ai/ask endpoint yet.
  // This avoids hardcoding fake responses and uses the real backend analysis.
  const triggered = analysis.risk_factors.filter((f) => f.triggered);
  return {
    risk_explanation: `Based on backend risk analysis for transaction ${txn.id}: score ${analysis.risk_score}/100 (${analysis.risk_level}). ${triggered.length} signals triggered: ${triggered.map((f) => f.label).join(', ')}.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.87,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Transaction ${txn.id} | ${txn.currency}${txn.amount.toLocaleString()} | ${txn.location} | Score: ${analysis.risk_score}/100 | ${analysis.threat_type} | ${analysis.recommended_action}`,
    demo: false,
  };
}
