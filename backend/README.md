# Risk Sentinel Backend

FastAPI backend for the Risk Sentinel payment risk intelligence platform.

## Overview

This backend provides a REST API for:
- Transaction management (synthetic data only)
- Risk scoring and analysis (transparent, explainable engine)
- Attack simulations (account takeover, velocity, suspicious device, normal)
- Investigation management (create, list, retrieve)

All data is **synthetic**. No real card numbers, CVVs, passwords, or payment credentials are processed or stored.

## Setup

### 1. Install Python dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env as needed
```

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Comma-separated CORS origins |
| `API_TITLE` | `Risk Sentinel API` | API title in docs |
| `AI_API_KEY` | (unset) | Optional external AI key |
| `AI_API_URL` | (unset) | Optional external AI endpoint |

### 3. Run the backend

```bash
uvicorn main:app --reload
```

The API runs on `http://localhost:8000`.

### 4. Verify

- Health check: `GET http://localhost:8000/api/health`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/transactions` | List transactions (supports `limit`, `offset`, `risk_level`, `search`) |
| GET | `/api/transactions/{id}` | Get single transaction |
| POST | `/api/transactions` | Create transaction (validated, no card data) |
| POST | `/api/risk/analyze` | Analyze transaction risk |
| POST | `/api/simulations/account-takeover` | Simulate account takeover |
| POST | `/api/simulations/velocity` | Simulate velocity attack |
| POST | `/api/simulations/suspicious-device` | Simulate suspicious device |
| POST | `/api/simulations/normal` | Simulate normal transaction |
| POST | `/api/investigations` | Create investigation |
| GET | `/api/investigations` | List investigations |
| GET | `/api/investigations/{id}` | Get investigation |

## Risk Engine

The risk engine uses 7 weighted signals:

| Signal | Weight |
|--------|--------|
| Transaction Amount Anomaly | 22 |
| Transaction Velocity | 18 |
| New Device | 14 |
| New Location | 12 |
| Account Age | 10 |
| Failed Attempts | 14 |
| Historical Behavior Deviation | 10 |

Classification:
- 0–30: LOW → APPROVE
- 31–60: MEDIUM → REVIEW
- 61–80: HIGH → HOLD
- 81–100: CRITICAL → HOLD

## Testing

```bash
cd backend
pytest -v
```

## Security

- All inputs validated with Pydantic
- No card numbers, CVVs, or payment credentials accepted
- CORS configured via environment variables
- AI output treated as advisory (not executable)
- No secrets exposed in code
