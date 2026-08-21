"""
AI investigation service for Risk Sentinel.

In demo mode, produces structured responses based on risk engine output.
If an external AI API is configured (AI_API_KEY + AI_API_URL), it can be used.
The AI never invents transaction data — it only reasons over supplied signals.
All output uses cautious language: 'possible', 'potential', 'likely'.
"""
import os
from typing import Any


def _get_fallback_response(analysis: dict, txn: dict) -> dict:
    """Rule-based fallback when AI API is unavailable."""
    risk_score = analysis.get("risk_score", 0)
    risk_level = analysis.get("risk_level", "LOW")
    threat_type = analysis.get("threat_type", "Normal Transaction")
    recommended_action = analysis.get("recommended_action", "APPROVE")
    attack_story = analysis.get("attack_story", "")
    triggered = [f for f in analysis.get("risk_factors", []) if f.get("triggered")]
    txn_id = txn.get("id", "unknown")
    amount = txn.get("amount", 0)
    currency = txn.get("currency", "₹")
    location = txn.get("location", "Unknown")

    return {
        "risk_explanation": (
            f"Transaction {txn_id} for {currency}{int(amount):,} from {location} "
            f"was flagged with a risk score of {risk_score}/100 ({risk_level}). "
            f"{len(triggered)} risk signal(s) were triggered: "
            f"{', '.join(s['label'] for s in triggered) if triggered else 'none'}. "
            f"The most significant contributing factor is "
            f"{max(triggered, key=lambda x: x['deviation'])['label'] if triggered else 'behavioral deviation'}."
        ),
        "attack_story": attack_story,
        "threat_type": threat_type,
        "confidence": 0.87,
        "recommended_action": recommended_action,
        "investigation_summary": (
            f"Transaction {txn_id} | {currency}{int(amount):,} | {location} | "
            f"Score: {risk_score}/100 | Level: {risk_level} | "
            f"Threat: {threat_type} | Action: {recommended_action}"
        ),
        "demo": True,
    }


def get_ai_response(analysis: dict, txn: dict, question: str = "") -> dict:
    """
    Get AI investigation response.

    If AI_API_KEY and AI_API_URL are configured, calls external AI.
    Otherwise returns a structured demo/fallback response.
    """
    ai_api_key = os.environ.get("AI_API_KEY")
    ai_api_url = os.environ.get("AI_API_URL")

    if ai_api_key and ai_api_url:
        try:
            return _call_external_ai(ai_api_url, ai_api_key, analysis, txn, question)
        except Exception:
            return _get_fallback_response(analysis, txn)

    # Demo mode — structured responses based on question
    return _get_demo_response(analysis, txn, question)


def _get_demo_response(analysis: dict, txn: dict, question: str) -> dict:
    """Generate demo responses tailored to common questions."""
    risk_score = analysis.get("risk_score", 0)
    risk_level = analysis.get("risk_level", "LOW")
    threat_type = analysis.get("threat_type", "Normal Transaction")
    recommended_action = analysis.get("recommended_action", "APPROVE")
    attack_story = analysis.get("attack_story", "")
    triggered = [f for f in analysis.get("risk_factors", []) if f.get("triggered")]
    txn_id = txn.get("id", "unknown")
    amount = txn.get("amount", 0)
    currency = txn.get("currency", "₹")
    location = txn.get("location", "Unknown")

    q_lower = question.lower()

    if "flagged" in q_lower or "why" in q_lower:
        return {
            "risk_explanation": (
                f"This transaction was flagged because {', '.join(s['label'].lower() for s in triggered)} were detected. "
                f"The composite risk score is {risk_score}/100, classified as {risk_level}. "
                f"The most significant contributing signal is "
                f"{max(triggered, key=lambda x: x['deviation'])['label'] if triggered else 'behavioral deviation'}."
            ),
            "attack_story": attack_story,
            "threat_type": threat_type,
            "confidence": 0.87,
            "recommended_action": recommended_action,
            "investigation_summary": f"Transaction {txn_id} for {currency}{int(amount):,} from {location} triggered {len(triggered)} risk signals. Composite score: {risk_score}/100.",
            "demo": True,
        }

    if "strongest" in q_lower or "signal" in q_lower:
        top3 = sorted(triggered, key=lambda x: x["deviation"], reverse=True)[:3]
        return {
            "risk_explanation": (
                f"The strongest risk signals, ranked by deviation severity, are: "
                f"{', '.join(f'{i+1}. {s[\"label\"]} ({s[\"deviation\"]}% deviation)' for i, s in enumerate(top3))}. "
                f"These signals collectively contribute {sum(s['weight'] for s in top3)} points to the weighted risk score."
            ),
            "attack_story": attack_story,
            "threat_type": threat_type,
            "confidence": 0.91,
            "recommended_action": recommended_action,
            "investigation_summary": f"Top signals: {', '.join(s['label'] for s in top3)}.",
            "demo": True,
        }

    if "summar" in q_lower:
        return {
            "risk_explanation": (
                f"Investigation summary for transaction {txn_id}: A {currency}{int(amount):,} transaction from {location}. "
                f"Risk score: {risk_score}/100 ({risk_level}), {len(triggered)} triggered signals. "
                f"AI classifies this as potential {threat_type} and recommends {recommended_action}."
            ),
            "attack_story": attack_story,
            "threat_type": threat_type,
            "confidence": 0.89,
            "recommended_action": recommended_action,
            "investigation_summary": f"Transaction {txn_id} | {currency}{int(amount):,} | {location} | Score: {risk_score}/100 | {threat_type} | {recommended_action}",
            "demo": True,
        }

    if "attack" in q_lower or "pattern" in q_lower:
        return {
            "risk_explanation": (
                f"Based on the observed signal pattern — {', '.join(s['label'] for s in triggered)} — "
                f"the AI agent identifies a possible {threat_type}. "
                f"This pattern is consistent with known attack methodologies. "
                f"This is a probabilistic assessment, not a definitive determination."
            ),
            "attack_story": attack_story,
            "threat_type": threat_type,
            "confidence": 0.84,
            "recommended_action": recommended_action,
            "investigation_summary": f"Possible attack pattern: {threat_type}. Confidence: 84%.",
            "demo": True,
        }

    if "action" in q_lower or "recommend" in q_lower:
        return {
            "risk_explanation": (
                f"Given the composite risk score of {risk_score}/100 and threat classification of {threat_type}, "
                f"the AI investigation agent recommends {recommended_action}. "
                f"{'This transaction should be held pending additional verification.' if recommended_action == 'HOLD' else 'This transaction should be reviewed by a risk analyst.' if recommended_action == 'REVIEW' else 'This transaction appears consistent with normal behavior and can be approved.'} "
                f"This is a recommendation — human approval is required for any final action."
            ),
            "attack_story": attack_story,
            "threat_type": threat_type,
            "confidence": 0.93,
            "recommended_action": recommended_action,
            "investigation_summary": f"Recommendation: {recommended_action}. Rationale: {risk_score}/100 score, {risk_level} risk level. Human approval required.",
            "demo": True,
        }

    # Generic response
    return _get_fallback_response(analysis, txn)


def _call_external_ai(api_url: str, api_key: str, analysis: dict, txn: dict, question: str) -> dict:
    """
    Call external AI API if configured.

    The AI receives only structured risk-engine signals — never raw user data.
    Returns structured JSON with cautious language.
    """
    import json
    import urllib.request

    system_prompt = (
        "You are a payment risk investigation AI assistant. "
        "You receive structured transaction and risk-engine signals. "
        "You must ONLY reason over the supplied signals — never invent transaction data. "
        "Use cautious language: 'possible', 'potential', 'likely'. "
        "Never claim a transaction is definitely fraudulent. "
        "Return JSON with: risk_explanation, attack_story, threat_type, confidence (0-1), "
        "recommended_action (APPROVE/REVIEW/HOLD), investigation_summary. "
        "All output is advisory — human approval is required for any action."
    )

    user_content = json.dumps({
        "question": question,
        "transaction": {
            "id": txn.get("id"),
            "amount": txn.get("amount"),
            "currency": txn.get("currency", "₹"),
            "location": txn.get("location"),
        },
        "risk_analysis": {
            "risk_score": analysis.get("risk_score"),
            "risk_level": analysis.get("risk_level"),
            "threat_type": analysis.get("threat_type"),
            "recommended_action": analysis.get("recommended_action"),
            "triggered_signals": [s["label"] for s in analysis.get("risk_factors", []) if s.get("triggered")],
            "attack_story": analysis.get("attack_story"),
        },
    })

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.3,
        "max_tokens": 500,
    }).encode()

    req = urllib.request.Request(
        api_url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode())

    content = result["choices"][0]["message"]["content"]
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return _get_fallback_response(analysis, txn)

    parsed["demo"] = False
    return parsed
