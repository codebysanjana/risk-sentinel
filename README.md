# RISK SENTINEL

**AI-Powered Payment Risk Intelligence**

A premium fintech cybersecurity web application that analyzes synthetic payment transaction behavior, detects suspicious patterns, generates a 0–100 risk score, explains why a transaction is risky, identifies possible threat types, and recommends APPROVE / REVIEW / HOLD.

> **DEMO ENVIRONMENT — SYNTHETIC DATA**
> This is a prototype designed around payment-risk use cases. It is not affiliated with or connected to any payment processor's production systems. All transaction data is synthetic. No real card numbers or payment credentials are processed or stored.

---

## Project Overview

RISK SENTINEL is an AI-powered payment risk management platform built for merchants and risk analysts. It provides a transparent, explainable risk engine that scores transactions in real time, generates behavioral fingerprints, and produces professional investigation reports — all wrapped in a cinematic, enterprise-grade UI.

## Problem Statement

Payment fraud detection systems are often opaque black boxes. Risk analysts need to understand *why* a transaction was flagged, see the behavioral signals that contributed to the risk score, and make informed decisions with AI assistance — not blind automation. Existing tools lack explainability, produce generic dashboards, and don't provide the narrative context needed for thorough investigation.

## Solution

RISK SENTINEL provides:

1. **Transparent Risk Scoring** — A weighted, explainable scoring engine with 7 distinct signals, each contributing a visible portion of the final 0–100 score.
2. **AI Investigation Agent** — An AI assistant that reasons over structured risk signals to produce attack stories, threat classifications, and recommendations — clearly labeled as advisory.
3. **Attack Replay** — A cinematic timeline replay showing how a suspicious transaction unfolded, with the risk score evolving in real time.
4. **Behavioral Risk Graph** — An interactive network visualization connecting users, devices, IPs, locations, merchants, and transactions.
5. **Professional Reports** — Print-ready and downloadable investigation reports with full audit trails.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React + Vite)         │
│                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Dashboard │  │ Live      │  │ Risk Graph   │  │
│  │ + Charts  │  │ Monitor   │  │ (SVG Network) │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
│                                                   │
│  ┌──────────────────┐  ┌─────────────────────┐   │
│  │ Investigation    │  │ Attack Replay       │   │
│  │ Panel (Drawer)    │  │ (Animated Timeline) │   │
│  └──────────────────┘  └─────────────────────┘   │
│                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Ask      │  │ Reports   │  │ Settings     │  │
│  │ Sentinel │  │ (Print/DL) │  │              │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │         Risk Engine (src/lib/riskEngine.ts)  │ │
│  │  7 weighted signals → 0–100 score           │ │
│  │  Classification: LOW/MEDIUM/HIGH/CRITICAL    │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │    State Management (React Context API)      │ │
│  │    100+ synthetic seed transactions          │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3 with custom glassmorphism design system
- **Icons**: Lucide React
- **State**: React Context API with local demo state
- **Charts**: Custom SVG visualizations (no chart library dependency)
- **Risk Engine**: Transparent weighted scoring algorithm

## Features

### Core Features

- **Cinematic Initialization** — 4–6 second animated boot sequence with scanner, progress stages, and demo metrics
- **Dashboard** — Animated stat counters, 24h risk trend chart, risk distribution donut, recent high-risk activity
- **Live Monitor** — Sortable, searchable, filterable transaction table with pagination and risk color-coding
- **Investigation Panel** — Slide-out drawer with animated risk score circle, risk factors, AI attack story, risk timeline, behavioral fingerprint, and human decision workflow
- **Attack Replay** — Cinematic animated timeline showing risk score progression (12 → 28 → 41 → 67 → 82 → 94) with threat detection
- **Risk Graph** — Interactive SVG network visualization with zoom, pan, click-to-inspect node details
- **Ask Sentinel** — AI assistant panel with suggested questions, structured responses, and demo mode labeling
- **Reports** — Professional investigation report generation with print and download (text file) support
- **Settings** — Risk sensitivity, notifications, demo mode, and animation preferences
- **Simulations** — One-click synthetic attack scenarios (Account Takeover, Velocity Attack, Suspicious Device, Normal)

### Design

- Dark deep-navy/black background with subtle blue/cyan accents
- Glassmorphism cards with thin borders and backdrop blur
- Sophisticated typography (Inter + JetBrains Mono)
- Subtle glow effects on risk indicators
- Comprehensive 8px spacing system
- 6+ color ramps (primary, secondary, accent, success, warning, error)
- Fully responsive (desktop, tablet, mobile)
- `prefers-reduced-motion` support throughout

## AI Architecture

The AI investigation agent operates in **Demo Mode** using structured, rule-based responses that reason over the risk engine's output. The AI:

1. **Receives structured input** — Transaction data + risk engine signals (never raw user data)
2. **Returns structured JSON** containing:
   - `risk_explanation` — Why the transaction was flagged
   - `attack_story` — Narrative explanation of the behavioral pattern
   - `threat_type` — Classification (e.g., "Possible Account Takeover")
   - `confidence` — 0–1 confidence score
   - `recommended_action` — APPROVE / REVIEW / HOLD
   - `investigation_summary` — Condensed summary
3. **Uses cautious language** — "possible", "potential", "likely" — never claims definitive fraud
4. **Cannot execute payment actions** — AI output is advisory only; human approval is always required
5. **Has fallback responses** — When the AI service is unavailable, the rule-based engine provides baseline analysis

### Suggested Questions

- Why was this transaction flagged?
- What are the strongest risk signals?
- Summarize this investigation.
- What attack pattern is possible?
- What action do you recommend?

## Risk Scoring

The risk engine uses a **weighted scoring system** with 7 transparent signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Transaction Amount Anomaly | 22 | Amount deviation from historical average |
| Transaction Velocity | 18 | Transactions per 10-minute window |
| New Device | 14 | Previously unseen device fingerprint |
| New Location | 14 | Unrecognized geographic location |
| Account Age | 10 | Account creation recency |
| Failed Attempts | 14 | Failed authentication count |
| Historical Behavior Deviation | 10 | Composite behavioral deviation |

**Scoring**: Each signal produces a 0–100 deviation score, weighted by its importance, then normalized to produce a final 0–100 risk score.

**Classification**:
- 0–30: **LOW** → APPROVE
- 31–60: **MEDIUM** → REVIEW
- 61–80: **HIGH** → HOLD
- 81–100: **CRITICAL** → HOLD

## Security

- **No API keys in frontend** — All secrets managed via environment variables
- **Input validation** — Risk engine validates all transaction inputs
- **No real payment data** — Only synthetic transaction data is used
- **No card numbers stored** — No card numbers, CVVs, or payment credentials are processed
- **AI output treated as untrusted** — All AI responses are advisory and labeled as demo
- **AI cannot execute actions** — Human approval required for all decisions
- **Demo indicators** — Visible "DEMO ENVIRONMENT — SYNTHETIC DATA" badges throughout
- **Safe CORS** — Edge functions include proper CORS headers
- **No injection vulnerabilities** — All user input is sanitized before use

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are pre-configured in the project environment. No additional setup is required for the demo.

## Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Production build verification
npm run build
```

### What to Test

- Risk score calculation across all 6 scenarios
- Risk classification (LOW/MEDIUM/HIGH/CRITICAL)
- Transaction search and filtering
- Investigation creation and saving
- AI response validation (demo mode)
- Simulation flows (all 4 types)
- Dashboard statistics and counter animations
- Attack Replay timeline animation
- Risk Graph zoom/pan/click
- Report generation, print, and download
- Mobile responsiveness
- Empty states and error states

## Deployment

The project builds to a static `dist/` directory that can be deployed to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

```bash
npm run build  # outputs to dist/
```

## Demo Instructions

### Primary Demo Flow

1. **Open the website** — Watch the cinematic AI initialization sequence
2. **Dashboard** — Observe animated counters and risk distribution
3. **Simulate Account Takeover** — Click the simulation button in the sidebar
4. **Attack Replay** — Watch the animated timeline show the attack unfolding
5. **Risk Score Rises** — See the score climb from 12 to 94
6. **Investigation** — Click a transaction in Live Monitor to open the investigation panel
7. **AI Attack Story** — Read the AI's narrative explanation
8. **Behavioral Fingerprint** — Compare normal vs current behavior
9. **Risk Graph** — Navigate to the graph and click suspicious nodes
10. **Ask Sentinel** — Open the AI panel and ask a suggested question
11. **AI Recommendation** — Review the AI's APPROVE/REVIEW/HOLD recommendation
12. **Human Review** — Make a human decision and save the investigation

### Quick Simulations

Use the sidebar simulation buttons to instantly generate:
- Account Takeover (new device + new location + failed attempts + high velocity)
- Velocity Attack (many rapid transactions)
- Suspicious Device (new device, known location)
- Normal Transaction (all signals clear)

Each simulation updates the dashboard in real time and opens the Attack Replay for non-normal scenarios.

---

**RISK SENTINEL** — A prototype designed around payment-risk use cases. Not affiliated with any payment processor. All data is synthetic.
