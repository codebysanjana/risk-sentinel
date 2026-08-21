export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendedAction = 'APPROVE' | 'REVIEW' | 'HOLD';
export type ThreatType =
  | 'Normal Transaction'
  | 'Possible Account Takeover'
  | 'Velocity Attack'
  | 'Suspicious Device'
  | 'Unusual Amount'
  | 'Multiple Failed Attempts'
  | 'Potential Synthetic Identity';

export interface Device {
  id: string;
  device_fingerprint: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  first_seen: string;
  is_new: boolean;
}

export interface User {
  id: string;
  email: string;
  account_age_days: number;
  country: string;
  trust_score: number;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  user_id: string;
  device_id: string;
  location: string;
  timestamp: string;
  account_age_days: number;
  is_new_device: boolean;
  is_new_location: boolean;
  failed_attempts: number;
  transaction_velocity: number;
  historical_average: number;
  risk_score: number;
  risk_level: RiskLevel;
  threat_type: ThreatType;
  recommended_action: RecommendedAction;
  device_info?: string;
  ip_address?: string;
  merchant?: string;
}

export interface RiskSignal {
  key: string;
  label: string;
  weight: number;
  triggered: boolean;
  value: string;
  normal_value: string;
  deviation: number;
}

export interface RiskEvent {
  id: string;
  transaction_id: string;
  timestamp: string;
  event_type: string;
  description: string;
  risk_score_at_time: number;
}

export interface TimelineEvent {
  time: string;
  label: string;
  description: string;
  risk_score: number;
  type: 'info' | 'warning' | 'critical' | 'success';
}

export interface BehavioralFingerprint {
  signal: string;
  normal_behavior: string;
  current_behavior: string;
  deviation: number;
  status: 'normal' | 'elevated' | 'high' | 'critical';
}

export interface RiskAnalysis {
  transaction_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  threat_type: ThreatType;
  recommended_action: RecommendedAction;
  risk_factors: RiskSignal[];
  attack_story: string;
  timeline: TimelineEvent[];
  behavioral_fingerprint: BehavioralFingerprint[];
  ai_explanation?: string;
  ai_confidence?: number;
  investigation_summary?: string;
}

export interface Investigation {
  id: string;
  transaction_id: string;
  created_at: string;
  analyst: string;
  risk_score: number;
  risk_level: RiskLevel;
  threat_type: ThreatType;
  recommended_action: RecommendedAction;
  human_decision: RecommendedAction | 'PENDING';
  status: 'open' | 'reviewing' | 'resolved';
  notes: string;
  ai_summary: string;
}

export interface AIReport {
  id: string;
  transaction_id: string;
  investigation_id: string;
  created_at: string;
  risk_explanation: string;
  attack_story: string;
  threat_type: ThreatType;
  confidence: number;
  recommended_action: RecommendedAction;
  investigation_summary: string;
}

export interface DashboardStats {
  transactions_analyzed: number;
  high_risk: number;
  under_review: number;
  fraud_prevented: number;
  ai_confidence: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  trend: { hour: string; transactions: number; risk_score: number }[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'device' | 'ip' | 'location' | 'merchant' | 'transaction';
  x: number;
  y: number;
  suspicious: boolean;
  details?: Record<string, string>;
  risk_score?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  suspicious: boolean;
}

export interface RiskGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AIResponse {
  risk_explanation: string;
  attack_story: string;
  threat_type: ThreatType;
  confidence: number;
  recommended_action: RecommendedAction;
  investigation_summary: string;
  demo: boolean;
}

export interface SimulationRequest {
  type: 'account-takeover' | 'velocity' | 'suspicious-device' | 'normal';
}

export interface SimulationResult {
  transaction: Transaction;
  analysis: RiskAnalysis;
}
