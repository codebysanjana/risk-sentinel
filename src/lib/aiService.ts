import type { AIResponse, RiskAnalysis, Transaction } from '@/types';

const DEMO_RESPONSES: Record<string, (analysis: RiskAnalysis, txn: Transaction) => AIResponse> = {
  'Why was this transaction flagged?': (analysis, txn) => ({
    risk_explanation: `This transaction was flagged because ${analysis.risk_factors
      .filter((f) => f.triggered)
      .map((f) => f.label.toLowerCase())
      .join(', ')} were detected. The composite risk score is ${analysis.risk_score}/100, classified as ${analysis.risk_level}. The most significant contributing signal is ${analysis.risk_factors
      .filter((f) => f.triggered)
      .sort((a, b) => b.deviation - a.deviation)[0]?.label || 'behavioral deviation'}.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.87,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Transaction ${txn.id} for ${txn.currency}${txn.amount.toLocaleString()} from ${txn.location} triggered ${analysis.risk_factors.filter((f) => f.triggered).length} risk signals. Composite score: ${analysis.risk_score}/100. Threat classification: ${analysis.threat_type}.`,
    demo: true,
  }),

  'What are the strongest risk signals?': (analysis) => ({
    risk_explanation: `The strongest risk signals, ranked by deviation severity, are: ${analysis.risk_factors
      .filter((f) => f.triggered)
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, 3)
      .map((f, i) => `${i + 1}. ${f.label} (${f.deviation}% deviation)`)
      .join(', ')}. These signals collectively contribute ${(analysis.risk_factors
      .filter((f) => f.triggered)
      .reduce((sum, f) => sum + f.weight, 0))} points to the weighted risk score.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.91,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Top 3 signals: ${analysis.risk_factors.filter((f) => f.triggered).sort((a, b) => b.deviation - a.deviation).slice(0, 3).map((f) => f.label).join(', ')}.`,
    demo: true,
  }),

  'Summarize this investigation.': (analysis, txn) => ({
    risk_explanation: `Investigation summary for transaction ${txn.id}: A ${txn.currency}${txn.amount.toLocaleString()} transaction from ${txn.location} on ${new Date(txn.timestamp).toLocaleString()}. The risk engine computed a score of ${analysis.risk_score}/100 (${analysis.risk_level}), identifying ${analysis.risk_factors.filter((f) => f.triggered).length} triggered signals. The AI investigation agent classifies this as a potential ${analysis.threat_type} and recommends ${analysis.recommended_action}.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.89,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Transaction ${txn.id} | ${txn.currency}${txn.amount.toLocaleString()} | ${txn.location} | Score: ${analysis.risk_score}/100 | Level: ${analysis.risk_level} | Threat: ${analysis.threat_type} | Action: ${analysis.recommended_action} | Signals: ${analysis.risk_factors.filter((f) => f.triggered).length}`,
    demo: true,
  }),

  'What attack pattern is possible?': (analysis) => ({
    risk_explanation: `Based on the observed signal pattern — ${analysis.risk_factors
      .filter((f) => f.triggered)
      .map((f) => f.label)
      .join(', ')} — the AI agent identifies a possible ${analysis.threat_type}. This pattern is consistent with known attack methodologies where ${analysis.threat_type.toLowerCase().includes('takeover') ? 'an attacker gains access to a legitimate account from a new device and location, attempts authentication, and rapidly executes high-value transactions' : analysis.threat_type.toLowerCase().includes('velocity') ? 'multiple transactions are executed in rapid succession to exploit a compromised account before detection' : 'behavioral anomalies suggest deviation from established patterns'}. This is a probabilistic assessment, not a definitive determination.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.84,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Possible attack pattern: ${analysis.threat_type}. Confidence: 84%. Signals: ${analysis.risk_factors.filter((f) => f.triggered).map((f) => f.key).join(', ')}.`,
    demo: true,
  }),

  'What action do you recommend?': (analysis) => ({
    risk_explanation: `Given the composite risk score of ${analysis.risk_score}/100 and threat classification of ${analysis.threat_type}, the AI investigation agent recommends ${analysis.recommended_action}. ${analysis.recommended_action === 'HOLD' ? 'This transaction should be held pending additional verification (e.g., step-up authentication, manual review by a risk analyst). The combination of triggered signals suggests elevated fraud risk.' : analysis.recommended_action === 'REVIEW' ? 'This transaction should be flagged for manual review by a risk analyst before processing. Some behavioral anomalies were detected but do not meet the threshold for an automatic hold.' : 'This transaction appears consistent with normal behavior and can be approved with standard monitoring.'} This is a recommendation — human approval is required for any final action.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.93,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Recommendation: ${analysis.recommended_action}. Rationale: ${analysis.risk_score}/100 score, ${analysis.risk_level} risk level. Human approval required.`,
    demo: true,
  }),
};

const SUGGESTED_QUESTIONS = [
  'Why was this transaction flagged?',
  'What are the strongest risk signals?',
  'Summarize this investigation.',
  'What attack pattern is possible?',
  'What action do you recommend?',
];

export function getSuggestedQuestions(): string[] {
  return SUGGESTED_QUESTIONS;
}

export async function askSentinel(
  question: string,
  analysis: RiskAnalysis,
  txn: Transaction
): Promise<AIResponse> {
  // Demo mode — no external API call
  // In production this would call the backend edge function
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

  const handler = DEMO_RESPONSES[question];
  if (handler) {
    return handler(analysis, txn);
  }

  // Generic response for custom questions
  return {
    risk_explanation: `Based on the available risk signals for transaction ${txn.id}, the risk engine computed a score of ${analysis.risk_score}/100. ${analysis.risk_factors.filter((f) => f.triggered).length} signals were triggered: ${analysis.risk_factors.filter((f) => f.triggered).map((f) => f.label).join(', ')}. The threat is classified as ${analysis.threat_type} with a recommended action of ${analysis.recommended_action}.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.85,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Transaction ${txn.id} | Score: ${analysis.risk_score}/100 | ${analysis.threat_type} | ${analysis.recommended_action}`,
    demo: true,
  };
}

export function getFallbackAIResponse(analysis: RiskAnalysis, txn: Transaction): AIResponse {
  return {
    risk_explanation: `AI service is currently unavailable. Based on the rule-based risk engine, transaction ${txn.id} has a score of ${analysis.risk_score}/100 (${analysis.risk_level}). ${analysis.risk_factors.filter((f) => f.triggered).length} signals triggered. Manual review is recommended.`,
    attack_story: analysis.attack_story,
    threat_type: analysis.threat_type,
    confidence: 0.5,
    recommended_action: analysis.recommended_action,
    investigation_summary: `Fallback analysis | ${txn.id} | ${analysis.risk_score}/100 | ${analysis.threat_type} | ${analysis.recommended_action}`,
    demo: true,
  };
}
