import type {
  RiskAnalysis,
  RiskLevel,
  RecommendedAction,
  RiskSignal,
  ThreatType,
  TimelineEvent,
  BehavioralFingerprint,
} from '@/types';

export interface RiskEngineInput {
  amount: number;
  currency?: string;
  account_age_days: number;
  is_new_device: boolean;
  is_new_location: boolean;
  failed_attempts: number;
  transaction_velocity: number;
  historical_average: number;
  transaction_id?: string;
  timestamp?: string;
  location?: string;
  device_info?: string;
}

export interface RiskEngineResult {
  risk_score: number;
  risk_level: RiskLevel;
  threat_type: ThreatType;
  recommended_action: RecommendedAction;
  risk_factors: RiskSignal[];
  attack_story: string;
  timeline: TimelineEvent[];
  behavioral_fingerprint: BehavioralFingerprint[];
}

const SIGNAL_WEIGHTS = {
  transaction_amount_anomaly: 22,
  transaction_velocity: 18,
  new_device: 14,
  new_location: 12,
  account_age: 10,
  failed_attempts: 14,
  historical_behavior_deviation: 10,
} as const;

const MAX_SCORE = Object.values(SIGNAL_WEIGHTS).reduce((a, b) => a + b, 0);

export function classifyRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

export function recommendAction(level: RiskLevel): RecommendedAction {
  switch (level) {
    case 'LOW':
      return 'APPROVE';
    case 'MEDIUM':
      return 'REVIEW';
    case 'HIGH':
    case 'CRITICAL':
      return 'HOLD';
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function roundTo(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function analyzeRisk(input: RiskEngineInput): RiskEngineResult {
  const signals: RiskSignal[] = [];

  // 1. Transaction amount anomaly
  const avg = input.historical_average || 1000;
  const amountRatio = input.amount / avg;
  const amountAnomalyScore = amountRatio > 1 ? clamp((amountRatio - 1) * 30, 0, 100) : 0;
  const amountTriggered = amountRatio > 2.5;
  signals.push({
    key: 'transaction_amount_anomaly',
    label: 'Transaction Amount Anomaly',
    weight: SIGNAL_WEIGHTS.transaction_amount_anomaly,
    triggered: amountTriggered,
    value: `${input.currency || '₹'}${input.amount.toLocaleString()}`,
    normal_value: `${input.currency || '₹'}${avg.toLocaleString()}`,
    deviation: roundTo(amountAnomalyScore, 1),
  });

  // 2. Transaction velocity
  const velocityScore = clamp(input.transaction_velocity * 12, 0, 100);
  const velocityTriggered = input.transaction_velocity >= 5;
  signals.push({
    key: 'transaction_velocity',
    label: 'Transaction Velocity',
    weight: SIGNAL_WEIGHTS.transaction_velocity,
    triggered: velocityTriggered,
    value: `${input.transaction_velocity} txns / 10 min`,
    normal_value: '0–2 txns / 10 min',
    deviation: roundTo(velocityScore, 1),
  });

  // 3. New device
  signals.push({
    key: 'new_device',
    label: 'New Device',
    weight: SIGNAL_WEIGHTS.new_device,
    triggered: input.is_new_device,
    value: input.is_new_device ? 'New device detected' : 'Known device',
    normal_value: 'Known device',
    deviation: input.is_new_device ? 100 : 0,
  });

  // 4. New location
  signals.push({
    key: 'new_location',
    label: 'New Location',
    weight: SIGNAL_WEIGHTS.new_location,
    triggered: input.is_new_location,
    value: input.is_new_location ? `${input.location || 'New location'}` : 'Known location',
    normal_value: 'Known location',
    deviation: input.is_new_location ? 100 : 0,
  });

  // 5. Account age
  const ageScore = clamp((30 - input.account_age_days) * 3.3, 0, 100);
  const ageTriggered = input.account_age_days < 7;
  signals.push({
    key: 'account_age',
    label: 'Account Age',
    weight: SIGNAL_WEIGHTS.account_age,
    triggered: ageTriggered,
    value: `${input.account_age_days} days`,
    normal_value: '> 90 days',
    deviation: roundTo(ageScore, 1),
  });

  // 6. Failed attempts
  const failedScore = clamp(input.failed_attempts * 20, 0, 100);
  const failedTriggered = input.failed_attempts >= 3;
  signals.push({
    key: 'failed_attempts',
    label: 'Failed Authentication Attempts',
    weight: SIGNAL_WEIGHTS.failed_attempts,
    triggered: failedTriggered,
    value: `${input.failed_attempts} attempts`,
    normal_value: '0 attempts',
    deviation: roundTo(failedScore, 1),
  });

  // 7. Historical behavior deviation (composite)
  const compositeDeviation =
    (amountAnomalyScore * 0.3 +
      velocityScore * 0.25 +
      (input.is_new_device ? 100 : 0) * 0.15 +
      (input.is_new_location ? 100 : 0) * 0.15 +
      ageScore * 0.05 +
      failedScore * 0.1) /
    1.0;
  const histTriggered = compositeDeviation > 50;
  signals.push({
    key: 'historical_behavior_deviation',
    label: 'Historical Behavior Deviation',
    weight: SIGNAL_WEIGHTS.historical_behavior_deviation,
    triggered: histTriggered,
    value: `${roundTo(compositeDeviation, 1)}% deviation`,
    normal_value: '< 20% deviation',
    deviation: roundTo(compositeDeviation, 1),
  });

  // Weighted score
  let rawScore = 0;
  for (const s of signals) {
    rawScore += (s.deviation / 100) * s.weight;
  }
  const risk_score = clamp(roundTo((rawScore / MAX_SCORE) * 100, 0), 0, 100);
  const risk_level = classifyRiskLevel(risk_score);
  const recommended_action = recommendAction(risk_level);

  // Threat classification
  const threat_type = classifyThreat(input, signals);

  // Attack story
  const attack_story = generateAttackStory(input, signals, threat_type);

  // Timeline
  const timeline = generateTimeline(input, risk_score);

  // Behavioral fingerprint
  const behavioral_fingerprint = generateFingerprint(input, signals);

  return {
    risk_score,
    risk_level,
    threat_type,
    recommended_action,
    risk_factors: signals,
    attack_story,
    timeline,
    behavioral_fingerprint,
  };
}

function classifyThreat(
  input: RiskEngineInput,
  signals: RiskSignal[]
): ThreatType {
  const newDevice = input.is_new_device;
  const newLocation = input.is_new_location;
  const failed = input.failed_attempts >= 3;
  const highVelocity = input.transaction_velocity >= 5;
  const youngAccount = input.account_age_days < 7;
  const highAmount = input.amount / (input.historical_average || 1000) > 3;

  const triggered = signals.filter((s) => s.triggered).map((s) => s.key);

  if (triggered.length === 0 || (triggered.length === 1 && triggered[0] === 'account_age' && !youngAccount)) {
    return 'Normal Transaction';
  }

  if (newDevice && newLocation && failed) return 'Possible Account Takeover';
  if (highVelocity && highAmount) return 'Velocity Attack';
  if (newDevice && !newLocation && !failed) return 'Suspicious Device';
  if (highAmount && !newDevice && !newLocation) return 'Unusual Amount';
  if (failed && !newDevice && !newLocation) return 'Multiple Failed Attempts';
  if (youngAccount && (newDevice || newLocation)) return 'Potential Synthetic Identity';

  if (newDevice && newLocation) return 'Possible Account Takeover';
  if (highVelocity) return 'Velocity Attack';
  if (newDevice) return 'Suspicious Device';

  return 'Unusual Amount';
}

function generateAttackStory(
  input: RiskEngineInput,
  signals: RiskSignal[],
  threat: ThreatType
): string {
  if (threat === 'Normal Transaction') {
    return 'This transaction appears consistent with the customer\'s historical behavior. No significant anomalies were detected across device, location, amount, or velocity signals. The risk engine recommends approval with standard monitoring.';
  }

  const parts: string[] = [];

  if (input.is_new_device) {
    parts.push('A previously unseen device was used to initiate this transaction');
  }
  if (input.is_new_location) {
    parts.push(`the transaction originated from a new geographic location (${input.location || 'unrecognized region'})`);
  }
  if (input.failed_attempts >= 3) {
    parts.push(`${input.failed_attempts} failed authentication attempts preceded the successful transaction`);
  }
  if (input.transaction_velocity >= 5) {
    parts.push(`${input.transaction_velocity} transactions were attempted within a short 10-minute window, significantly above the expected baseline`);
  }
  const ratio = input.amount / (input.historical_average || 1000);
  if (ratio > 2.5) {
    parts.push(`the transaction amount of ${input.currency || '₹'}${input.amount.toLocaleString()} is ${ratio.toFixed(1)}× the customer's historical average of ${input.currency || '₹'}${input.historical_average.toLocaleString()}`);
  }
  if (input.account_age_days < 7) {
    parts.push(`the account was created only ${input.account_age_days} day(s) ago, limiting the availability of historical behavior data`);
  }

  const triggeredCount = signals.filter((s) => s.triggered).length;

  let story = 'This transaction deviates from the customer\'s established behavioral baseline. ';
  if (parts.length > 0) {
    story += parts.join(', ') + '. ';
  }
  story += `In combination, ${triggeredCount} risk signal(s) were triggered, producing a composite pattern that may indicate ${threat.toLowerCase()}. `;
  story += 'This analysis is a recommendation based on synthetic behavioral signals and should be reviewed by a human analyst before any action is taken. ';

  return story;
}

function generateTimeline(input: RiskEngineInput, finalScore: number): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const baseTime = input.timestamp ? new Date(input.timestamp) : new Date();
  let t = new Date(baseTime.getTime() - 6 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });

  let score = 12;

  if (input.is_new_device) {
    events.push({ time: fmt(t), label: 'New device login', description: `Device fingerprint not previously associated with this account.`, risk_score: score, type: 'warning' });
    t = new Date(t.getTime() + 60 * 1000);
    score += 16;
  }

  if (input.is_new_location) {
    events.push({ time: fmt(t), label: 'New location detected', description: `Transaction originated from ${input.location || 'an unrecognized geographic region'}.`, risk_score: score, type: 'warning' });
    t = new Date(t.getTime() + 60 * 1000);
    score += 13;
  }

  if (input.failed_attempts >= 3) {
    events.push({ time: fmt(t), label: 'Failed authentication', description: `${input.failed_attempts} failed login attempts before success.`, risk_score: score, type: 'critical' });
    t = new Date(t.getTime() + 60 * 1000);
    score += 14;
  }

  const avg = input.historical_average || 1000;
  const smallAmt = Math.round(avg * 0.5);
  events.push({ time: fmt(t), label: `Initial transaction`, description: `${input.currency || '₹'}${smallAmt.toLocaleString()} transaction processed.`, risk_score: score, type: 'info' });
  t = new Date(t.getTime() + 60 * 1000);
  score += 9;

  if (input.transaction_velocity >= 3) {
    events.push({ time: fmt(t), label: 'Velocity increasing', description: `${input.transaction_velocity} transactions within 10 minutes — above normal baseline.`, risk_score: score, type: 'warning' });
    t = new Date(t.getTime() + 60 * 1000);
    score += 15;
  }

  if (input.amount > avg * 2.5) {
    events.push({ time: fmt(t), label: 'High-value transaction', description: `${input.currency || '₹'}${input.amount.toLocaleString()} — ${((input.amount / avg)).toFixed(1)}× historical average.`, risk_score: score, type: 'critical' });
    t = new Date(t.getTime() + 60 * 1000);
    score += 12;
  }

  events.push({ time: fmt(t), label: 'Risk engine triggered', description: 'Risk Sentinel engine evaluated all signals and computed composite score.', risk_score: finalScore, type: 'critical' });
  t = new Date(t.getTime() + 30 * 1000);

  const action = recommendAction(classifyRiskLevel(finalScore));
  events.push({ time: fmt(t), label: `AI recommends ${action}`, description: `Based on the composite risk score of ${finalScore}/100, the AI investigation agent recommends ${action}.`, risk_score: finalScore, type: action === 'APPROVE' ? 'success' : 'critical' });

  return events;
}

function generateFingerprint(input: RiskEngineInput, signals: RiskSignal[]): BehavioralFingerprint[] {
  const avg = input.historical_average || 1000;
  const amountDeviation = input.amount > avg ? Math.min(((input.amount - avg) / avg) * 100, 100) : 0;
  const velocityDeviation = Math.min(input.transaction_velocity * 15, 100);
  const failedDeviation = Math.min(input.failed_attempts * 25, 100);

  const status = (d: number): BehavioralFingerprint['status'] => {
    if (d >= 75) return 'critical';
    if (d >= 50) return 'high';
    if (d >= 25) return 'elevated';
    return 'normal';
  };

  return [
    {
      signal: 'Transaction Amount',
      normal_behavior: `${input.currency || '₹'}${avg.toLocaleString()}`,
      current_behavior: `${input.currency || '₹'}${input.amount.toLocaleString()}`,
      deviation: roundTo(amountDeviation, 1),
      status: status(amountDeviation),
    },
    {
      signal: 'Transaction Frequency',
      normal_behavior: '0–2 per 10 min',
      current_behavior: `${input.transaction_velocity} per 10 min`,
      deviation: roundTo(velocityDeviation, 1),
      status: status(velocityDeviation),
    },
    {
      signal: 'Device',
      normal_behavior: 'Known device',
      current_behavior: input.is_new_device ? 'New device' : 'Known device',
      deviation: input.is_new_device ? 100 : 0,
      status: input.is_new_device ? 'critical' : 'normal',
    },
    {
      signal: 'Location',
      normal_behavior: 'Known location',
      current_behavior: input.is_new_location ? (input.location || 'New location') : 'Known location',
      deviation: input.is_new_location ? 100 : 0,
      status: input.is_new_location ? 'critical' : 'normal',
    },
    {
      signal: 'Account Age',
      normal_behavior: '> 90 days',
      current_behavior: `${input.account_age_days} days`,
      deviation: roundTo(Math.min((90 - input.account_age_days) / 90 * 100, 100), 1),
      status: input.account_age_days < 7 ? 'critical' : input.account_age_days < 30 ? 'elevated' : 'normal',
    },
    {
      signal: 'Failed Attempts',
      normal_behavior: '0 attempts',
      current_behavior: `${input.failed_attempts} attempts`,
      deviation: roundTo(failedDeviation, 1),
      status: status(failedDeviation),
    },
  ];
}

export function buildAnalysis(input: RiskEngineInput): RiskAnalysis {
  const result = analyzeRisk(input);
  return {
    transaction_id: input.transaction_id || 'unknown',
    ...result,
  };
}
