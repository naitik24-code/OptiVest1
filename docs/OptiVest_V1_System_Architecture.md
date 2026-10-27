# OptiVest AI Version 1.0 — Technical System Architecture Specification

## 1. Architectural Overview
OptiVest AI is engineered as a decoupled, asynchronous, service-oriented platform designed for quantitative portfolio optimization, machine learning inference, and simulated execution.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REACT 18 FRONTEND SPA                              │
│  (Decision Center • What-If Simulator • Paper Trading • Research Analytics) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / RESTful API (JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND CORE SERVICE                         │
│  ┌───────────────────────┬───────────────────────┬───────────────────────┐  │
│  │   Portfolio Router    │    AI Predict Router  │    APDE Engine Router │  │
│  └───────────┬───────────┴───────────┬───────────┴───────────┬───────────┘  │
│              │                       │                       │              │
│              ▼                       ▼                       ▼              │
│  ┌───────────────────────┐┌───────────────────────┐┌───────────────────────┐ │
│  │ Asset & Position Svc  ││ ML Training Pipeline  ││ APDE Decision Engine  │ │
│  └───────────────────────┘└───────────────────────┘└───────────────────────┘ │
│              │                       │                       │              │
│              ▼                       ▼                       ▼              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      PAPER TRADING ENGINE SERVICE                     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ SQLAlchemy ORM 2.0
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SQLITE / POSTGRESQL DATABASE                            │
│  (Portfolios • Trained Models • Decision Cards • Paper Wallets & Orders)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Key Backend Subsystems

### A. AI Prediction Engine (`app/services/multi_model_trainer.py`)
- Trains ensemble stacking pipelines combining XGBoost, LightGBM, Random Forest, and ARIMA.
- Logically decouples dataset versions and feature store artifacts for reproducibility.
- Integrates Walk-Forward Validation to prevent lookahead bias.

### B. Adaptive Portfolio Decision Engine (APDE) (`app/services/apde_engine.py`)
- Orchestrates 13 decision sub-engines evaluating asset weights, covariance matrices, and Sharpe ratios.
- Emits Explainable AI (XAI) "Decision Cards" requiring explicit governance approval.
- Runs non-destructive What-If simulations to test allocation outcomes before commitment.

### C. Paper Trading Engine (`app/services/paper_trading_service.py`)
- Manages virtual $100,000 cash balances, positions, orders, and P/L ledgers.
- Executes accepted APDE decision cards directly into virtual position adjustments.
- Provides 5-phase decision replay timelines and dissertation-grade research reports.

## 3. Database ERD & Schema Organization
- **Core Platform**: `users`, `portfolios`, `assets`, `holdings`, `transactions`, `watchlists`.
- **AI Infrastructure**: `trained_models`, `model_metrics`, `prediction_history`, `training_queue`, `market_regime_logs`.
- **APDE Engine**: `portfolio_health`, `decision_cards`, `decision_history`, `scenario_simulations`.
- **Paper Trading**: `paper_wallets`, `paper_orders`, `paper_positions`, `paper_transactions`, `paper_decisions`, `research_reports`.
