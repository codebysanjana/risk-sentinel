"""Transaction API routes."""
import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from schemas import TransactionInput, TransactionCreate, TransactionResponse
from services.risk_engine import analyze_risk

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

# In-memory storage for demo
_transactions: list[dict] = []
_sim_counter = [100001]

LOCATIONS = [
    "Mumbai, IN", "Bengaluru, IN", "Delhi, IN", "Chennai, IN", "Hyderabad, IN",
    "Pune, IN", "Kolkata, IN", "Singapore, SG", "Dubai, AE", "London, UK",
    "New York, US", "Toronto, CA", "Frankfurt, DE", "Sydney, AU", "Tokyo, JP",
    "Lagos, NG", "São Paulo, BR", "Unknown, ??",
]

MERCHANTS = [
    "Amazon Pay", "Flipkart", "Swiggy", "Zomato", "BigBasket",
    "Myntra", "BookMyShow", "IRCTC", "Uber", "PhonePe",
    "Paytm Mall", "Nykaa", "CRED", "Groww", "Zerodha",
]

DEVICES = [
    ("mobile", "iOS 17.4", "Safari"),
    ("mobile", "Android 14", "Chrome"),
    ("desktop", "macOS 14", "Chrome"),
    ("desktop", "Windows 11", "Edge"),
    ("tablet", "iPadOS 17", "Safari"),
]


def _gen_id(prefix: str, n: int) -> str:
    return f"{prefix}-{n:06d}"


def _gen_ip() -> str:
    return f"{random.randint(1,255)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


def _gen_timestamp(days_ago: int = 0) -> str:
    d = datetime.now(timezone.utc) - timedelta(days=days_ago)
    d = d.replace(hour=random.randint(0, 23), minute=random.randint(0, 59), second=random.randint(0, 59))
    return d.isoformat()


def _create_txn_from_input(n: int, inp: dict) -> dict:
    txn_id = _gen_id("TXN", n)
    analysis = analyze_risk({**inp, "transaction_id": txn_id})
    return {
        "id": txn_id,
        "amount": inp["amount"],
        "currency": inp.get("currency", "₹"),
        "user_id": inp.get("user_id") or _gen_id("USR", random.randint(1, 200)),
        "device_id": _gen_id("DEV", n),
        "location": inp.get("location", "Unknown"),
        "timestamp": inp.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "account_age_days": inp["account_age_days"],
        "is_new_device": inp["is_new_device"],
        "is_new_location": inp["is_new_location"],
        "failed_attempts": inp["failed_attempts"],
        "transaction_velocity": inp["transaction_velocity"],
        "historical_average": inp.get("historical_average", 1000),
        "risk_score": analysis["risk_score"],
        "risk_level": analysis["risk_level"],
        "threat_type": analysis["threat_type"],
        "recommended_action": analysis["recommended_action"],
        "device_info": inp.get("device_info", "unknown"),
        "ip_address": inp.get("ip_address", _gen_ip()),
        "merchant": inp.get("merchant"),
    }


def _seed_transactions() -> None:
    """Generate 100+ synthetic seed transactions across 6 scenarios."""
    if _transactions:
        return
    n = 1

    # Scenario 1: Normal (50)
    for _ in range(50):
        dev = random.choice(DEVICES)
        avg = random.randint(500, 3000)
        amt = random.randint(round(avg * 0.5), round(avg * 1.5))
        _transactions.append(_create_txn_from_input(n, {
            "amount": amt, "account_age_days": random.randint(90, 800),
            "is_new_device": False, "is_new_location": False, "failed_attempts": 0,
            "transaction_velocity": random.randint(0, 2), "historical_average": avg,
            "location": random.choice(LOCATIONS[:5]),
            "device_info": f"{dev[0]} / {dev[1]} / {dev[2]}",
            "merchant": random.choice(MERCHANTS), "timestamp": _gen_timestamp(random.randint(0, 7)),
            "user_id": _gen_id("USR", random.randint(1, 200)),
        }))
        n += 1

    # Scenario 2: Account takeover (15)
    for _ in range(15):
        dev = random.choice(DEVICES)
        avg = random.randint(1000, 5000)
        amt = random.randint(round(avg * 3), round(avg * 8))
        _transactions.append(_create_txn_from_input(n, {
            "amount": amt, "account_age_days": random.randint(30, 500),
            "is_new_device": True, "is_new_location": True, "failed_attempts": random.randint(3, 7),
            "transaction_velocity": random.randint(4, 8), "historical_average": avg,
            "location": random.choice(LOCATIONS[8:14]),
            "device_info": f"{dev[0]} / {dev[1]} / {dev[2]}",
            "merchant": random.choice(MERCHANTS), "timestamp": _gen_timestamp(random.randint(0, 3)),
            "user_id": _gen_id("USR", random.randint(1, 200)),
        }))
        n += 1

    # Scenario 3: Velocity attack (12)
    for _ in range(12):
        dev = random.choice(DEVICES)
        avg = random.randint(800, 3000)
        amt = random.randint(round(avg * 2), round(avg * 5))
        _transactions.append(_create_txn_from_input(n, {
            "amount": amt, "account_age_days": random.randint(60, 400),
            "is_new_device": random.random() > 0.5, "is_new_location": False, "failed_attempts": random.randint(0, 2),
            "transaction_velocity": random.randint(6, 12), "historical_average": avg,
            "location": random.choice(LOCATIONS[:7]),
            "device_info": f"{dev[0]} / {dev[1]} / {dev[2]}",
            "merchant": random.choice(MERCHANTS), "timestamp": _gen_timestamp(random.randint(0, 2)),
            "user_id": _gen_id("USR", random.randint(1, 200)),
        }))
        n += 1

    # Scenario 4: Suspicious device (8)
    for _ in range(8):
        dev = random.choice(DEVICES)
        avg = random.randint(1000, 4000)
        amt = random.randint(round(avg * 0.8), round(avg * 2))
        _transactions.append(_create_txn_from_input(n, {
            "amount": amt, "account_age_days": random.randint(45, 300),
            "is_new_device": True, "is_new_location": False, "failed_attempts": random.randint(0, 2),
            "transaction_velocity": random.randint(1, 3), "historical_average": avg,
            "location": random.choice(LOCATIONS[:5]),
            "device_info": f"{dev[0]} / {dev[1]} / {dev[2]}",
            "merchant": random.choice(MERCHANTS), "timestamp": _gen_timestamp(random.randint(0, 4)),
            "user_id": _gen_id("USR", random.randint(1, 200)),
        }))
        n += 1

    # Scenario 5: Unusual amount (8)
    for _ in range(8):
        dev = random.choice(DEVICES)
        avg = random.randint(500, 2000)
        amt = random.randint(round(avg * 5), round(avg * 15))
        _transactions.append(_create_txn_from_input(n, {
            "amount": amt, "account_age_days": random.randint(100, 600),
            "is_new_device": False, "is_new_location": False, "failed_attempts": 0,
            "transaction_velocity": random.randint(0, 2), "historical_average": avg,
            "location": random.choice(LOCATIONS[:5]),
            "device_info": f"{dev[0]} / {dev[1]} / {dev[2]}",
            "merchant": random.choice(MERCHANTS), "timestamp": _gen_timestamp(random.randint(0, 5)),
            "user_id": _gen_id("USR", random.randint(1, 200)),
        }))
        n += 1

    # Scenario 6: Multiple failed attempts (7)
    for _ in range(7):
        dev = random.choice(DEVICES)
        avg = random.randint(1000, 4000)
        amt = random.randint(round(avg * 1), round(avg * 3))
        _transactions.append(_create_txn_from_input(n, {
            "amount": amt, "account_age_days": random.randint(20, 200),
            "is_new_device": False, "is_new_location": False, "failed_attempts": random.randint(3, 6),
            "transaction_velocity": random.randint(1, 4), "historical_average": avg,
            "location": random.choice(LOCATIONS[:5]),
            "device_info": f"{dev[0]} / {dev[1]} / {dev[2]}",
            "merchant": random.choice(MERCHANTS), "timestamp": _gen_timestamp(random.randint(0, 3)),
            "user_id": _gen_id("USR", random.randint(1, 200)),
        }))
        n += 1


def add_transaction(txn: dict) -> None:
    """Add a transaction to the in-memory store."""
    _transactions.insert(0, txn)


def get_all_transactions() -> list[dict]:
    return list(_transactions)


@router.on_event("startup")
async def _startup():
    _seed_transactions()


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    limit: int = 100,
    offset: int = 0,
    risk_level: str | None = None,
    search: str | None = None,
):
    _seed_transactions()
    result = _transactions

    if risk_level and risk_level != "ALL":
        result = [t for t in result if t["risk_level"] == risk_level]

    if search:
        q = search.lower()
        result = [t for t in result if q in t["id"].lower() or q in t["location"].lower() or q in t.get("threat_type", "").lower() or q in (t.get("merchant") or "").lower() or q in t.get("user_id", "").lower()]

    return result[offset:offset + limit]


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: str):
    _seed_transactions()
    for t in _transactions:
        if t["id"] == transaction_id:
            return t
    raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(txn_input: TransactionCreate):
    """Create a new synthetic transaction. Does NOT accept real card numbers or payment credentials."""
    n = _sim_counter[0]
    _sim_counter[0] += 1

    data = txn_input.model_dump()
    txn = _create_txn_from_input(n, data)
    _transactions.insert(0, txn)
    return txn
