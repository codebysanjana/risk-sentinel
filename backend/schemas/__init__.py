"""Pydantic schemas for Risk Sentinel API."""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
RecommendedAction = Literal["APPROVE", "REVIEW", "HOLD"]
ThreatType = Literal[
    "Normal Transaction",
    "Possible Account Takeover",
    "Velocity Attack",
    "Suspicious Device",
    "Unusual Amount",
    "Multiple Failed Attempts",
    "Potential Synthetic Identity",
]


class TransactionInput(BaseModel):
    """Validated transaction input for risk analysis. No card numbers or credentials allowed."""
    amount: float = Field(..., gt=0, le=10000000, description="Transaction amount (must be positive, max 10M)")
    currency: str = Field(default="₹", max_length=5)
    account_age_days: int = Field(..., ge=0, le=36500, description="Account age in days")
    is_new_device: bool = False
    is_new_location: bool = False
    failed_attempts: int = Field(default=0, ge=0, le=50)
    transaction_velocity: int = Field(default=0, ge=0, le=100, description="Transactions per 10 min")
    historical_average: float = Field(default=1000, gt=0, le=10000000)
    location: str = Field(default="Unknown", max_length=100)
    device_info: str = Field(default="unknown", max_length=200)
    merchant: Optional[str] = Field(default=None, max_length=100)
    user_id: Optional[str] = Field(default=None, max_length=50)
    ip_address: Optional[str] = Field(default=None, max_length=45)

    @field_validator("amount", "historical_average")
    @classmethod
    def must_be_finite(cls, v):
        import math
        if not math.isfinite(v):
            raise ValueError("must be a finite number")
        return v


class TransactionCreate(TransactionInput):
    """Full transaction creation (extends input with optional fields)."""
    pass


class TransactionResponse(BaseModel):
    id: str
    amount: float
    currency: str
    user_id: str = Field(default="USR-000000")
    device_id: str = Field(default="DEV-000000")
    location: str
    timestamp: str
    account_age_days: int
    is_new_device: bool
    is_new_location: bool
    failed_attempts: int
    transaction_velocity: int
    historical_average: float
    risk_score: int
    risk_level: RiskLevel
    threat_type: ThreatType
    recommended_action: RecommendedAction
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    merchant: Optional[str] = None


class RiskSignal(BaseModel):
    key: str
    label: str
    weight: int
    triggered: bool
    value: str
    normal_value: str
    deviation: float


class TimelineEvent(BaseModel):
    time: str
    label: str
    description: str
    risk_score: int
    type: Literal["info", "warning", "critical", "success"]


class BehavioralFingerprint(BaseModel):
    signal: str
    normal_behavior: str
    current_behavior: str
    deviation: float
    status: Literal["normal", "elevated", "high", "critical"]


class RiskAnalysisResponse(BaseModel):
    transaction_id: Optional[str] = None
    risk_score: int
    risk_level: RiskLevel
    threat_type: ThreatType
    recommended_action: RecommendedAction
    risk_factors: list[RiskSignal]
    attack_story: str
    timeline: list[TimelineEvent]
    behavioral_fingerprint: list[BehavioralFingerprint]
    signal_breakdown: dict[str, float]


class SimulationResponse(BaseModel):
    transaction: TransactionResponse
    analysis: RiskAnalysisResponse
    events: list[dict]


class InvestigationCreate(BaseModel):
    transaction_id: str = Field(..., max_length=50)
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    threat_type: ThreatType
    recommended_action: RecommendedAction
    risk_factors: list[dict] = Field(default_factory=list)
    timeline: list[dict] = Field(default_factory=list)
    attack_story: str = ""
    notes: str = Field(default="", max_length=2000)
    human_decision: Literal["APPROVE", "REVIEW", "HOLD", "PENDING"] = "PENDING"
    analyst: str = Field(default="Risk Analyst", max_length=100)


class InvestigationResponse(BaseModel):
    id: str
    transaction_id: str
    created_at: str
    analyst: str
    risk_score: int
    risk_level: RiskLevel
    threat_type: ThreatType
    recommended_action: RecommendedAction
    human_decision: Literal["APPROVE", "REVIEW", "HOLD", "PENDING"]
    status: Literal["open", "reviewing", "resolved"]
    notes: str
    ai_summary: str
    risk_factors: list[dict] = Field(default_factory=list)
    timeline: list[dict] = Field(default_factory=list)


class DashboardStatsResponse(BaseModel):
    transactions_analyzed: int
    high_risk: int
    under_review: int
    fraud_prevented: int
    ai_confidence: float
    risk_distribution: dict[str, int]
    trend: list[dict]


class HealthResponse(BaseModel):
    status: str
    service: str


class AIResponse(BaseModel):
    risk_explanation: str
    attack_story: str
    threat_type: ThreatType
    confidence: float
    recommended_action: RecommendedAction
    investigation_summary: str
    demo: bool
