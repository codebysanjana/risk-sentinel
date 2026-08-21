"""Tests for the Risk Sentinel API."""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "risk-sentinel-api"


from services.risk_engine import analyze_risk, classify_risk_level, recommend_action


class TestRiskEngine:
    """Test the risk scoring engine directly."""

    def test_normal_transaction_is_low(self):
        result = analyze_risk({
            "amount": 1000, "historical_average": 1000,
            "account_age_days": 365, "is_new_device": False, "is_new_location": False,
            "failed_attempts": 0, "transaction_velocity": 1,
        })
        assert result["risk_score"] <= 30
        assert result["risk_level"] == "LOW"
        assert result["recommended_action"] == "APPROVE"
        assert result["threat_type"] == "Normal Transaction"

    def test_account_takeover_is_critical(self):
        result = analyze_risk({
            "amount": 20000, "historical_average": 2000,
            "account_age_days": 200, "is_new_device": True, "is_new_location": True,
            "failed_attempts": 5, "transaction_velocity": 7,
        })
        assert result["risk_score"] >= 61
        assert result["risk_level"] in ("HIGH", "CRITICAL")
        assert result["recommended_action"] == "HOLD"
        assert result["threat_type"] == "Possible Account Takeover"

    def test_velocity_attack(self):
        result = analyze_risk({
            "amount": 8000, "historical_average": 1500,
            "account_age_days": 60, "is_new_device": True, "is_new_location": False,
            "failed_attempts": 0, "transaction_velocity": 10,
        })
        assert result["risk_score"] >= 61
        assert result["risk_level"] in ("HIGH", "CRITICAL")
        assert result["recommended_action"] == "HOLD"

    def test_suspicious_device(self):
        result = analyze_risk({
            "amount": 3000, "historical_average": 2000,
            "account_age_days": 100, "is_new_device": True, "is_new_location": False,
            "failed_attempts": 0, "transaction_velocity": 2,
        })
        assert result["risk_score"] > 0
        assert result["threat_type"] == "Suspicious Device"

    def test_multiple_failed_attempts(self):
        result = analyze_risk({
            "amount": 2000, "historical_average": 2000,
            "account_age_days": 100, "is_new_device": False, "is_new_location": False,
            "failed_attempts": 5, "transaction_velocity": 2,
        })
        assert result["risk_score"] > 0
        assert result["threat_type"] == "Multiple Failed Attempts"

    def test_classification_thresholds(self):
        assert classify_risk_level(0) == "LOW"
        assert classify_risk_level(30) == "LOW"
        assert classify_risk_level(31) == "MEDIUM"
        assert classify_risk_level(60) == "MEDIUM"
        assert classify_risk_level(61) == "HIGH"
        assert classify_risk_level(80) == "HIGH"
        assert classify_risk_level(81) == "CRITICAL"
        assert classify_risk_level(100) == "CRITICAL"

    def test_recommend_action(self):
        assert recommend_action("LOW") == "APPROVE"
        assert recommend_action("MEDIUM") == "REVIEW"
        assert recommend_action("HIGH") == "HOLD"
        assert recommend_action("CRITICAL") == "HOLD"

    def test_signal_breakdown_present(self):
        result = analyze_risk({
            "amount": 5000, "historical_average": 1000,
            "account_age_days": 30, "is_new_device": True, "is_new_location": True,
            "failed_attempts": 3, "transaction_velocity": 5,
        })
        assert "signal_breakdown" in result
        assert "transaction_amount_anomaly" in result["signal_breakdown"]
        assert "new_device" in result["signal_breakdown"]
        assert "failed_attempts" in result["signal_breakdown"]

    def test_risk_factors_list(self):
        result = analyze_risk({
            "amount": 5000, "historical_average": 1000,
            "account_age_days": 30, "is_new_device": True, "is_new_location": True,
            "failed_attempts": 3, "transaction_velocity": 5,
        })
        assert len(result["risk_factors"]) == 7
        for f in result["risk_factors"]:
            assert "key" in f
            assert "label" in f
            assert "weight" in f
            assert "triggered" in f
            assert "deviation" in f

    def test_timeline_generated(self):
        result = analyze_risk({
            "amount": 10000, "historical_average": 1000,
            "account_age_days": 200, "is_new_device": True, "is_new_location": True,
            "failed_attempts": 4, "transaction_velocity": 7,
        })
        assert len(result["timeline"]) > 0
        assert all("time" in e and "label" in e and "risk_score" in e for e in result["timeline"])

    def test_behavioral_fingerprint(self):
        result = analyze_risk({
            "amount": 5000, "historical_average": 1000,
            "account_age_days": 30, "is_new_device": True, "is_new_location": True,
            "failed_attempts": 3, "transaction_velocity": 5,
        })
        fps = result["behavioral_fingerprint"]
        assert len(fps) == 6
        assert all("signal" in fp and "normal_behavior" in fp and "current_behavior" in fp for fp in fps)


class TestTransactionAPI:
    def test_list_transactions(self):
        response = client.get("/api/transactions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert "id" in data[0]
        assert "risk_score" in data[0]

    def test_list_transactions_with_limit(self):
        response = client.get("/api/transactions?limit=5")
        assert response.status_code == 200
        assert len(response.json()) <= 5

    def test_get_transaction_by_id(self):
        # First get list to find an ID
        txns = client.get("/api/transactions").json()
        txn_id = txns[0]["id"]
        response = client.get(f"/api/transactions/{txn_id}")
        assert response.status_code == 200
        assert response.json()["id"] == txn_id

    def test_get_nonexistent_transaction(self):
        response = client.get("/api/transactions/TXN-999999")
        assert response.status_code == 404

    def test_create_transaction(self):
        response = client.post("/api/transactions", json={
            "amount": 1500, "currency": "₹", "account_age_days": 100,
            "is_new_device": False, "is_new_location": False,
            "failed_attempts": 0, "transaction_velocity": 1,
            "historical_average": 1200, "location": "Mumbai, IN",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["amount"] == 1500
        assert "risk_score" in data

    def test_create_transaction_invalid_amount(self):
        response = client.post("/api/transactions", json={
            "amount": -100, "account_age_days": 100,
            "is_new_device": False, "is_new_location": False,
            "failed_attempts": 0, "transaction_velocity": 1,
        })
        assert response.status_code == 422


class TestRiskAnalysisAPI:
    def test_analyze_normal(self):
        response = client.post("/api/risk/analyze", json={
            "amount": 1000, "account_age_days": 365,
            "is_new_device": False, "is_new_location": False,
            "failed_attempts": 0, "transaction_velocity": 1,
            "historical_average": 1000,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] <= 30
        assert data["risk_level"] == "LOW"
        assert "signal_breakdown" in data

    def test_analyze_suspicious(self):
        response = client.post("/api/risk/analyze", json={
            "amount": 20000, "account_age_days": 200,
            "is_new_device": True, "is_new_location": True,
            "failed_attempts": 5, "transaction_velocity": 7,
            "historical_average": 2000,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] >= 61
        assert data["recommended_action"] == "HOLD"

    def test_analyze_invalid_input(self):
        response = client.post("/api/risk/analyze", json={
            "amount": -50, "account_age_days": 100,
        })
        assert response.status_code == 422


class TestSimulationAPI:
    def test_account_takeover_simulation(self):
        response = client.post("/api/simulations/account-takeover")
        assert response.status_code == 200
        data = response.json()
        assert "transaction" in data
        assert "analysis" in data
        assert "events" in data
        assert data["analysis"]["risk_score"] >= 61
        assert data["transaction"]["is_new_device"] is True

    def test_velocity_simulation(self):
        response = client.post("/api/simulations/velocity")
        assert response.status_code == 200
        data = response.json()
        assert data["transaction"]["transaction_velocity"] >= 7

    def test_suspicious_device_simulation(self):
        response = client.post("/api/simulations/suspicious-device")
        assert response.status_code == 200
        data = response.json()
        assert data["transaction"]["is_new_device"] is True

    def test_normal_simulation(self):
        response = client.post("/api/simulations/normal")
        assert response.status_code == 200
        data = response.json()
        assert data["analysis"]["risk_score"] <= 30


class TestInvestigationAPI:
    def test_create_investigation(self):
        response = client.post("/api/investigations", json={
            "transaction_id": "TXN-000001",
            "risk_score": 94,
            "risk_level": "CRITICAL",
            "threat_type": "Possible Account Takeover",
            "recommended_action": "HOLD",
            "risk_factors": [{"key": "new_device", "triggered": True}],
            "timeline": [{"time": "10:31 PM", "label": "New device"}],
            "attack_story": "Suspicious activity detected.",
            "notes": "Reviewing for potential fraud.",
            "human_decision": "PENDING",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["transaction_id"] == "TXN-000001"
        assert data["status"] == "open"
        assert "id" in data

    def test_list_investigations(self):
        # Create one first
        client.post("/api/investigations", json={
            "transaction_id": "TXN-000002",
            "risk_score": 50,
            "risk_level": "MEDIUM",
            "threat_type": "Unusual Amount",
            "recommended_action": "REVIEW",
            "human_decision": "APPROVE",
        })
        response = client.get("/api/investigations")
        assert response.status_code == 200
        assert len(response.json()) > 0

    def test_get_investigation_by_id(self):
        create_resp = client.post("/api/investigations", json={
            "transaction_id": "TXN-000003",
            "risk_score": 80,
            "risk_level": "HIGH",
            "threat_type": "Velocity Attack",
            "recommended_action": "HOLD",
            "human_decision": "HOLD",
        })
        inv_id = create_resp.json()["id"]
        response = client.get(f"/api/investigations/{inv_id}")
        assert response.status_code == 200
        assert response.json()["id"] == inv_id

    def test_get_nonexistent_investigation(self):
        response = client.get("/api/investigations/INV-NONEXISTENT")
        assert response.status_code == 404


class TestDashboardStats:
    def test_dashboard_stats(self):
        response = client.get("/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "transactions_analyzed" in data
        assert "high_risk" in data
        assert "risk_distribution" in data
        assert "trend" in data
        assert data["transactions_analyzed"] > 0
