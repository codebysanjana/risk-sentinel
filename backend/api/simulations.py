"""Simulation API routes — generate synthetic attack scenarios."""
import random
from datetime import datetime, timezone
from fastapi import APIRouter
from schemas import SimulationResponse
from services.risk_engine import analyze_risk
from api.transactions import _create_txn_from_input, _sim_counter, _gen_ip, add_transaction

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


def _gen_id(prefix: str, n: int) -> str:
    return f"{prefix}-{n:06d}"


def _build_events(txn: dict, analysis: dict) -> list[dict]:
    """Build the event sequence for the simulation."""
    events = []
    is_new_device = txn["is_new_device"]
    is_new_location = txn["is_new_location"]
    failed = txn["failed_attempts"]
    velocity = txn["transaction_velocity"]
    amount = txn["amount"]
    avg = txn["historical_average"]
    currency = txn.get("currency", "₹")

    if is_new_device:
        events.append({"step": 1, "event": "New device detected", "description": "Device fingerprint not previously associated with this account.", "risk_score": 12})
    if is_new_location:
        events.append({"step": 2, "event": "New location detected", "description": f"Transaction originated from {txn['location']}.", "risk_score": 28})
    if failed >= 3:
        events.append({"step": 3, "event": "Authentication failure", "description": f"{failed} failed login attempts before success.", "risk_score": 41})
    events.append({"step": 4, "event": "Small transaction", "description": f"{currency}{int(avg * 0.5):,} transaction processed.", "risk_score": 50})
    if velocity >= 3:
        events.append({"step": 5, "event": "Transaction velocity increases", "description": f"{velocity} transactions within 10 minutes.", "risk_score": 67})
    if amount > avg * 2.5:
        events.append({"step": 6, "event": "High-value transaction occurs", "description": f"{currency}{int(amount):,} — {(amount/avg):.1f}× historical average.", "risk_score": 82})
    events.append({"step": 7, "event": "Risk score reaches critical", "description": f"Composite risk score: {analysis['risk_score']}/100.", "risk_score": analysis["risk_score"]})
    events.append({"step": 8, "event": "AI investigation triggered", "description": "Risk Sentinel AI agent activated for deep analysis.", "risk_score": analysis["risk_score"]})
    events.append({"step": 9, "event": "Recommendation generated", "description": f"AI recommends {analysis['recommended_action']}.", "risk_score": analysis["risk_score"]})
    return events


@router.post("/account-takeover", response_model=SimulationResponse)
async def simulate_account_takeover():
    """Generate a synthetic account takeover scenario."""
    n = _sim_counter[0]
    _sim_counter[0] += 1
    avg = random.randint(1500, 4000)
    amount = random.randint(avg * 4, avg * 10)
    inp = {
        "amount": amount, "account_age_days": random.randint(120, 400),
        "is_new_device": True, "is_new_location": True, "failed_attempts": random.randint(4, 7),
        "transaction_velocity": random.randint(5, 9), "historical_average": avg,
        "location": "Unknown, ??", "device_info": "mobile / Android 14 / Chrome",
        "merchant": "Amazon Pay", "ip_address": _gen_ip(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": _gen_id("USR", random.randint(1, 200)),
    }
    txn = _create_txn_from_input(n, inp)
    add_transaction(txn)
    analysis = analyze_risk({**inp, "transaction_id": txn["id"]})
    events = _build_events(txn, analysis)
    return {"transaction": txn, "analysis": {"transaction_id": txn["id"], **analysis}, "events": events}


@router.post("/velocity", response_model=SimulationResponse)
async def simulate_velocity_attack():
    """Generate a synthetic velocity attack scenario."""
    n = _sim_counter[0]
    _sim_counter[0] += 1
    avg = random.randint(800, 2500)
    amount = random.randint(avg * 2, avg * 5)
    inp = {
        "amount": amount, "account_age_days": random.randint(60, 300),
        "is_new_device": random.random() > 0.5, "is_new_location": False, "failed_attempts": random.randint(0, 2),
        "transaction_velocity": random.randint(7, 14), "historical_average": avg,
        "location": "Mumbai, IN", "device_info": "desktop / macOS 14 / Chrome",
        "merchant": "Flipkart", "ip_address": _gen_ip(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": _gen_id("USR", random.randint(1, 200)),
    }
    txn = _create_txn_from_input(n, inp)
    add_transaction(txn)
    analysis = analyze_risk({**inp, "transaction_id": txn["id"]})
    events = _build_events(txn, analysis)
    return {"transaction": txn, "analysis": {"transaction_id": txn["id"], **analysis}, "events": events}


@router.post("/suspicious-device", response_model=SimulationResponse)
async def simulate_suspicious_device():
    """Generate a synthetic suspicious device scenario."""
    n = _sim_counter[0]
    _sim_counter[0] += 1
    avg = random.randint(1000, 3000)
    amount = random.randint(avg, round(avg * 2.5))
    inp = {
        "amount": amount, "account_age_days": random.randint(45, 250),
        "is_new_device": True, "is_new_location": False, "failed_attempts": random.randint(0, 2),
        "transaction_velocity": random.randint(1, 3), "historical_average": avg,
        "location": "Bengaluru, IN", "device_info": "tablet / iPadOS 17 / Safari",
        "merchant": "Swiggy", "ip_address": _gen_ip(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": _gen_id("USR", random.randint(1, 200)),
    }
    txn = _create_txn_from_input(n, inp)
    add_transaction(txn)
    analysis = analyze_risk({**inp, "transaction_id": txn["id"]})
    events = _build_events(txn, analysis)
    return {"transaction": txn, "analysis": {"transaction_id": txn["id"], **analysis}, "events": events}


@router.post("/normal", response_model=SimulationResponse)
async def simulate_normal_transaction():
    """Generate a synthetic normal transaction scenario."""
    n = _sim_counter[0]
    _sim_counter[0] += 1
    avg = random.randint(500, 2500)
    amount = random.randint(round(avg * 0.5), round(avg * 1.3))
    inp = {
        "amount": amount, "account_age_days": random.randint(120, 800),
        "is_new_device": False, "is_new_location": False, "failed_attempts": 0,
        "transaction_velocity": random.randint(0, 2), "historical_average": avg,
        "location": "Mumbai, IN", "device_info": "mobile / iOS 17.4 / Safari",
        "merchant": "PhonePe", "ip_address": _gen_ip(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": _gen_id("USR", random.randint(1, 200)),
    }
    txn = _create_txn_from_input(n, inp)
    add_transaction(txn)
    analysis = analyze_risk({**inp, "transaction_id": txn["id"]})
    events = _build_events(txn, analysis)
    return {"transaction": txn, "analysis": {"transaction_id": txn["id"], **analysis}, "events": events}
