"""Risk analysis API routes."""
from fastapi import APIRouter
from schemas import TransactionInput, RiskAnalysisResponse
from services.risk_engine import analyze_risk

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.post("/analyze", response_model=RiskAnalysisResponse)
async def analyze_transaction(txn_input: TransactionInput):
    """
    Analyze a transaction and return a full risk assessment.

    The risk engine evaluates 7 weighted signals:
    - transaction_amount_anomaly (22)
    - transaction_velocity (18)
    - new_device (14)
    - new_location (12)
    - account_age (10)
    - failed_attempts (14)
    - historical_behavior_deviation (10)

    Returns risk_score (0-100), risk_level, risk_factors, threat_type,
    recommended_action, and signal_breakdown.
    """
    data = txn_input.model_dump()
    result = analyze_risk(data)
    return {
        "transaction_id": None,
        **result,
    }
