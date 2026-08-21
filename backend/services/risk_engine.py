"""
Transparent, explainable risk scoring engine for Risk Sentinel.

7 weighted signals producing a 0-100 risk score.
This is a deterministic, explainable engine — not a black box.
"""
import math
from typing import Any

SIGNAL_WEIGHTS = {
    "transaction_amount_anomaly": 22,
    "transaction_velocity": 18,
    "new_device": 14,
    "new_location": 12,
    "account_age": 10,
    "failed_attempts": 14,
    "historical_behavior_deviation": 10,
}
MAX_SCORE = sum(SIGNAL_WEIGHTS.values())  # 100


def clamp(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))


def round_to(n: float, decimals: int = 0) -> float:
    factor = 10 ** decimals
    return round(n * factor) / factor


def classify_risk_level(score: float) -> str:
    if score <= 30:
        return "LOW"
    if score <= 60:
        return "MEDIUM"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


def recommend_action(level: str) -> str:
    return {
        "LOW": "APPROVE",
        "MEDIUM": "REVIEW",
        "HIGH": "HOLD",
        "CRITICAL": "HOLD",
    }[level]


def analyze_risk(data: dict[str, Any]) -> dict[str, Any]:
    """Analyze transaction risk and return full risk analysis."""
    amount = float(data["amount"])
    currency = data.get("currency", "₹")
    account_age_days = int(data["account_age_days"])
    is_new_device = bool(data["is_new_device"])
    is_new_location = bool(data["is_new_location"])
    failed_attempts = int(data["failed_attempts"])
    transaction_velocity = int(data["transaction_velocity"])
    historical_average = float(data.get("historical_average", 1000)) or 1000

    signals: list[dict] = []

    # 1. Transaction amount anomaly
    amount_ratio = amount / historical_average
    amount_anomaly_score = clamp((amount_ratio - 1) * 30, 0, 100) if amount_ratio > 1 else 0
    amount_triggered = amount_ratio > 2.5
    signals.append({
        "key": "transaction_amount_anomaly",
        "label": "Transaction Amount Anomaly",
        "weight": SIGNAL_WEIGHTS["transaction_amount_anomaly"],
        "triggered": amount_triggered,
        "value": f"{currency}{int(amount):,}",
        "normal_value": f"{currency}{int(historical_average):,}",
        "deviation": round_to(amount_anomaly_score, 1),
    })

    # 2. Transaction velocity
    velocity_score = clamp(transaction_velocity * 12, 0, 100)
    velocity_triggered = transaction_velocity >= 5
    signals.append({
        "key": "transaction_velocity",
        "label": "Transaction Velocity",
        "weight": SIGNAL_WEIGHTS["transaction_velocity"],
        "triggered": velocity_triggered,
        "value": f"{transaction_velocity} txns / 10 min",
        "normal_value": "0–2 txns / 10 min",
        "deviation": round_to(velocity_score, 1),
    })

    # 3. New device
    signals.append({
        "key": "new_device",
        "label": "New Device",
        "weight": SIGNAL_WEIGHTS["new_device"],
        "triggered": is_new_device,
        "value": "New device detected" if is_new_device else "Known device",
        "normal_value": "Known device",
        "deviation": 100.0 if is_new_device else 0.0,
    })

    # 4. New location
    location_str = data.get("location", "New location")
    signals.append({
        "key": "new_location",
        "label": "New Location",
        "weight": SIGNAL_WEIGHTS["new_location"],
        "triggered": is_new_location,
        "value": location_str if is_new_location else "Known location",
        "normal_value": "Known location",
        "deviation": 100.0 if is_new_location else 0.0,
    })

    # 5. Account age
    age_score = clamp((30 - account_age_days) * 3.3, 0, 100)
    age_triggered = account_age_days < 7
    signals.append({
        "key": "account_age",
        "label": "Account Age",
        "weight": SIGNAL_WEIGHTS["account_age"],
        "triggered": age_triggered,
        "value": f"{account_age_days} days",
        "normal_value": "> 90 days",
        "deviation": round_to(age_score, 1),
    })

    # 6. Failed attempts
    failed_score = clamp(failed_attempts * 20, 0, 100)
    failed_triggered = failed_attempts >= 3
    signals.append({
        "key": "failed_attempts",
        "label": "Failed Authentication Attempts",
        "weight": SIGNAL_WEIGHTS["failed_attempts"],
        "triggered": failed_triggered,
        "value": f"{failed_attempts} attempts",
        "normal_value": "0 attempts",
        "deviation": round_to(failed_score, 1),
    })

    # 7. Historical behavior deviation (composite)
    composite = (
        amount_anomaly_score * 0.3
        + velocity_score * 0.25
        + (100 if is_new_device else 0) * 0.15
        + (100 if is_new_location else 0) * 0.15
        + age_score * 0.05
        + failed_score * 0.1
    )
    hist_triggered = composite > 50
    signals.append({
        "key": "historical_behavior_deviation",
        "label": "Historical Behavior Deviation",
        "weight": SIGNAL_WEIGHTS["historical_behavior_deviation"],
        "triggered": hist_triggered,
        "value": f"{round_to(composite, 1)}% deviation",
        "normal_value": "< 20% deviation",
        "deviation": round_to(composite, 1),
    })

    # Weighted score
    raw_score = sum((s["deviation"] / 100) * s["weight"] for s in signals)
    risk_score = int(clamp(round_to((raw_score / MAX_SCORE) * 100, 0), 0, 100))
    risk_level = classify_risk_level(risk_score)
    recommended_action = recommend_action(risk_level)

    threat_type = _classify_threat(data, signals)
    attack_story = _generate_attack_story(data, signals, threat_type)
    timeline = _generate_timeline(data, risk_score)
    behavioral_fingerprint = _generate_fingerprint(data)
    signal_breakdown = {s["key"]: round(s["deviation"] * s["weight"] / 100, 1) for s in signals}

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "threat_type": threat_type,
        "recommended_action": recommended_action,
        "risk_factors": signals,
        "attack_story": attack_story,
        "timeline": timeline,
        "behavioral_fingerprint": behavioral_fingerprint,
        "signal_breakdown": signal_breakdown,
    }


def _classify_threat(data: dict, signals: list[dict]) -> str:
    is_new_device = bool(data["is_new_device"])
    is_new_location = bool(data["is_new_location"])
    failed = int(data["failed_attempts"]) >= 3
    high_velocity = int(data["transaction_velocity"]) >= 5
    young_account = int(data["account_age_days"]) < 7
    high_amount = float(data["amount"]) / (float(data.get("historical_average", 1000)) or 1000) > 3

    triggered = [s["key"] for s in signals if s["triggered"]]

    if not triggered or (len(triggered) == 1 and triggered[0] == "account_age" and not young_account):
        return "Normal Transaction"

    if is_new_device and is_new_location and failed:
        return "Possible Account Takeover"
    if high_velocity and high_amount:
        return "Velocity Attack"
    if is_new_device and not is_new_location and not failed:
        return "Suspicious Device"
    if high_amount and not is_new_device and not is_new_location:
        return "Unusual Amount"
    if failed and not is_new_device and not is_new_location:
        return "Multiple Failed Attempts"
    if young_account and (is_new_device or is_new_location):
        return "Potential Synthetic Identity"

    if is_new_device and is_new_location:
        return "Possible Account Takeover"
    if high_velocity:
        return "Velocity Attack"
    if is_new_device:
        return "Suspicious Device"

    return "Unusual Amount"


def _generate_attack_story(data: dict, signals: list[dict], threat: str) -> str:
    if threat == "Normal Transaction":
        return ("This transaction appears consistent with the customer's historical behavior. "
                "No significant anomalies were detected across device, location, amount, or velocity signals. "
                "The risk engine recommends approval with standard monitoring.")

    parts: list[str] = []
    currency = data.get("currency", "₹")
    amount = float(data["amount"])
    historical_average = float(data.get("historical_average", 1000)) or 1000

    if data["is_new_device"]:
        parts.append("A previously unseen device was used to initiate this transaction")
    if data["is_new_location"]:
        parts.append(f"the transaction originated from a new geographic location ({data.get('location', 'unrecognized region')})")
    if int(data["failed_attempts"]) >= 3:
        parts.append(f"{data['failed_attempts']} failed authentication attempts preceded the successful transaction")
    if int(data["transaction_velocity"]) >= 5:
        parts.append(f"{data['transaction_velocity']} transactions were attempted within a short 10-minute window, significantly above the expected baseline")
    ratio = amount / historical_average
    if ratio > 2.5:
        parts.append(f"the transaction amount of {currency}{int(amount):,} is {ratio:.1f}× the customer's historical average of {currency}{int(historical_average):,}")
    if int(data["account_age_days"]) < 7:
        parts.append(f"the account was created only {data['account_age_days']} day(s) ago, limiting the availability of historical behavior data")

    triggered_count = sum(1 for s in signals if s["triggered"])

    story = "This transaction deviates from the customer's established behavioral baseline. "
    if parts:
        story += ", ".join(parts) + ". "
    story += f"In combination, {triggered_count} risk signal(s) were triggered, producing a composite pattern that may indicate {threat.lower()}. "
    story += "This analysis is a recommendation based on synthetic behavioral signals and should be reviewed by a human analyst before any action is taken. "

    return story


def _format_time(dt) -> str:
    """Format datetime to 12-hour time string."""
    from datetime import timezone
    try:
        import zoneinfo
        tz = zoneinfo.ZoneInfo("America/New_York")
    except Exception:
        tz = timezone.utc
    return dt.astimezone(tz).strftime("%I:%M %p")


def _generate_timeline(data: dict, final_score: int) -> list[dict]:
    from datetime import datetime, timedelta, timezone

    ts = data.get("timestamp")
    if ts:
        try:
            base_time = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            base_time = datetime.now(timezone.utc)
    else:
        base_time = datetime.now(timezone.utc)

    t = base_time - timedelta(minutes=6)
    events: list[dict] = []
    score = 12
    currency = data.get("currency", "₹")

    if data["is_new_device"]:
        events.append({"time": _format_time(t), "label": "New device login", "description": "Device fingerprint not previously associated with this account.", "risk_score": score, "type": "warning"})
        t += timedelta(minutes=1)
        score += 16

    if data["is_new_location"]:
        events.append({"time": _format_time(t), "label": "New location detected", "description": f"Transaction originated from {data.get('location', 'an unrecognized geographic region')}.", "risk_score": score, "type": "warning"})
        t += timedelta(minutes=1)
        score += 13

    if int(data["failed_attempts"]) >= 3:
        events.append({"time": _format_time(t), "label": "Failed authentication", "description": f"{data['failed_attempts']} failed login attempts before success.", "risk_score": score, "type": "critical"})
        t += timedelta(minutes=1)
        score += 14

    avg = float(data.get("historical_average", 1000)) or 1000
    small_amt = round(avg * 0.5)
    events.append({"time": _format_time(t), "label": "Initial transaction", "description": f"{currency}{small_amt:,} transaction processed.", "risk_score": score, "type": "info"})
    t += timedelta(minutes=1)
    score += 9

    if int(data["transaction_velocity"]) >= 3:
        events.append({"time": _format_time(t), "label": "Velocity increasing", "description": f"{data['transaction_velocity']} transactions within 10 minutes — above normal baseline.", "risk_score": score, "type": "warning"})
        t += timedelta(minutes=1)
        score += 15

    if float(data["amount"]) > avg * 2.5:
        events.append({"time": _format_time(t), "label": "High-value transaction", "description": f"{currency}{int(data['amount']):,} — {(float(data['amount']) / avg):.1f}× historical average.", "risk_score": score, "type": "critical"})
        t += timedelta(minutes=1)
        score += 12

    events.append({"time": _format_time(t), "label": "Risk engine triggered", "description": "Risk Sentinel engine evaluated all signals and computed composite score.", "risk_score": final_score, "type": "critical"})
    t += timedelta(seconds=30)

    action = recommend_action(classify_risk_level(final_score))
    events.append({"time": _format_time(t), "label": f"AI recommends {action}", "description": f"Based on the composite risk score of {final_score}/100, the AI investigation agent recommends {action}.", "risk_score": final_score, "type": "success" if action == "APPROVE" else "critical"})

    return events


def _generate_fingerprint(data: dict) -> list[dict]:
    currency = data.get("currency", "₹")
    avg = float(data.get("historical_average", 1000)) or 1000
    amount = float(data["amount"])

    amount_deviation = min(((amount - avg) / avg) * 100, 100) if amount > avg else 0
    velocity_deviation = min(int(data["transaction_velocity"]) * 15, 100)
    failed_deviation = min(int(data["failed_attempts"]) * 25, 100)

    def status(d: float) -> str:
        if d >= 75:
            return "critical"
        if d >= 50:
            return "high"
        if d >= 25:
            return "elevated"
        return "normal"

    account_age_days = int(data["account_age_days"])
    age_dev = round_to(min((90 - account_age_days) / 90 * 100, 100), 1)
    age_status = "critical" if account_age_days < 7 else "elevated" if account_age_days < 30 else "normal"

    return [
        {"signal": "Transaction Amount", "normal_behavior": f"{currency}{int(avg):,}", "current_behavior": f"{currency}{int(amount):,}", "deviation": round_to(amount_deviation, 1), "status": status(amount_deviation)},
        {"signal": "Transaction Frequency", "normal_behavior": "0–2 per 10 min", "current_behavior": f"{data['transaction_velocity']} per 10 min", "deviation": round_to(velocity_deviation, 1), "status": status(velocity_deviation)},
        {"signal": "Device", "normal_behavior": "Known device", "current_behavior": "New device" if data["is_new_device"] else "Known device", "deviation": 100.0 if data["is_new_device"] else 0.0, "status": "critical" if data["is_new_device"] else "normal"},
        {"signal": "Location", "normal_behavior": "Known location", "current_behavior": data.get("location", "New location") if data["is_new_location"] else "Known location", "deviation": 100.0 if data["is_new_location"] else 0.0, "status": "critical" if data["is_new_location"] else "normal"},
        {"signal": "Account Age", "normal_behavior": "> 90 days", "current_behavior": f"{account_age_days} days", "deviation": age_dev, "status": age_status},
        {"signal": "Failed Attempts", "normal_behavior": "0 attempts", "current_behavior": f"{data['failed_attempts']} attempts", "deviation": round_to(failed_deviation, 1), "status": status(failed_deviation)},
    ]
