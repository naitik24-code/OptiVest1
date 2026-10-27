# OptiVest AI Version 1.0 — User & Developer Operations Guide

## 1. Quick Start Guide (Local Development Environment)

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Git

### Backend Setup
```bash
# Navigate to project root
cd StockProject

# Activate Python Virtual Environment
.\venv\Scripts\Activate.ps1

# Run Database Schema Migration / Seeding & Start Backend API Server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger API Documentation: `http://127.0.0.1:8000/api/v1/docs`

### Frontend Setup
```bash
# In a new terminal window, navigate to frontend directory
cd StockProject/frontend

# Install dependencies & start Vite dev server
npm install
npm run dev
```
- Access Platform Dashboard: `http://127.0.0.1:5173`

---

## 2. Docker Production Deployment

```bash
# Build and launch isolated multi-stage container environment
docker-compose up --build -d
```
- App & API Server container will be live at `http://localhost:8000`.

---

## 3. Running System Audit & Test Suites

```bash
# Run Master Release Qualification Suite (Phases 5, 6, 7)
python tests/test_v1_release_suite.py

# Run Full Stack HTTP API Audit
python audit_platform.py
```

---

## 4. Platform Navigation Summary
- **`/dashboard`**: Primary Investment Portfolio Overview & Market Tickers.
- **`/decision-center`**: APDE Portfolio Health & AI Recommendation Cards.
- **`/scenario-simulator`**: What-If Portfolio Reallocation Preview.
- **`/paper-trading`**: Enterprise Paper Trading Dashboard & Virtual Order Entry.
- **`/paper-wallet`**: Multi-Wallet Capital Reserve & Buying Power Allocation.
- **`/decision-replay`**: Step-by-Step Decision Lifecycle Replay.
- **`/research-analytics`**: Dissertation-Grade Alpha & Sharpe Ratio Analytics Report.
