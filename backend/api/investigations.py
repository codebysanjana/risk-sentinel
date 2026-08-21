"""Investigation API routes — store and retrieve investigations."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from schemas import InvestigationCreate, InvestigationResponse

router = APIRouter(prefix="/api/investigations", tags=["investigations"])

# In-memory storage for investigations
_investigations: dict[str, dict] = {}


@router.post("", response_model=InvestigationResponse, status_code=201)
async def create_investigation(inv_input: InvestigationCreate):
    """Create a new investigation record."""
    inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()

    human_decision = inv_input.human_decision
    status = "resolved" if human_decision != "PENDING" else "open"

    investigation = {
        "id": inv_id,
        "transaction_id": inv_input.transaction_id,
        "created_at": created_at,
        "analyst": inv_input.analyst,
        "risk_score": inv_input.risk_score,
        "risk_level": inv_input.risk_level,
        "threat_type": inv_input.threat_type,
        "recommended_action": inv_input.recommended_action,
        "human_decision": human_decision,
        "status": status,
        "notes": inv_input.notes,
        "ai_summary": inv_input.attack_story,
        "risk_factors": inv_input.risk_factors,
        "timeline": inv_input.timeline,
    }

    _investigations[inv_id] = investigation
    return investigation


@router.get("", response_model=list[InvestigationResponse])
async def list_investigations():
    """List all investigations."""
    return list(_investigations.values())


@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str):
    """Get a specific investigation by ID."""
    if investigation_id not in _investigations:
        raise HTTPException(status_code=404, detail=f"Investigation {investigation_id} not found")
    return _investigations[investigation_id]
