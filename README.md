# OptiVest AI — Explainable Adaptive Portfolio Optimization Platform

[![Phase](https://img.shields.io/badge/Phase-1%20Planning%20%26%20Architecture-blue.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20PostgreSQL%20%7C%20XGBoost%20%7C%20SHAP-green.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#)

## Overview
**OptiVest AI** is an AI-powered wealth management platform and research framework designed to optimize long-term portfolio performance through intelligent, risk-aware, and explainable asset reallocation. 

Rather than relying purely on stock price prediction, OptiVest AI introduces an **Explainable Adaptive Portfolio Decision Engine (APDE)**. APDE rebalances a user-defined percentage of portfolio capital under custom risk tolerance, sector constraints, and transaction friction models, providing transparent feature-attribution explanations via **SHAP (SHapley Additive exPlanations)**.

---

## Key Highlights & Innovations
- **Adaptive Portfolio Decision Engine (APDE)**: Novel multi-objective constrained optimization algorithm prioritizing risk-adjusted portfolio yield over raw prediction.
- **Explainable AI (XAI)**: Native SHAP integration explaining *why* reallocations are proposed using tree feature attribution.
- **Controlled Reallocation Cap**: Users specify the max % of total portfolio capital permitted to be rebalanced in any rebalancing event.
- **Paper Trading Engine**: Real-time simulation log testing strategy performance without exposing real capital.
- **Enterprise SaaS Foundation**: Production-ready layered FastAPI backend, React TypeScript frontend, and PostgreSQL database.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui, React Router v6, Recharts |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL 16 |
| **AI & Quantitative** | Pandas, NumPy, Scikit-Learn, XGBoost, SHAP |
| **DevOps & Infra** | Docker, Docker Compose, Git, GitHub Actions |

---

## Repository Structure

```
optivest-ai/
├── backend/          # Layered FastAPI backend (routers, services, repos, schemas)
├── frontend/         # Feature-first React + TypeScript SPA
├── database/         # PostgreSQL initialization, migrations & seeds
├── ml/               # Feature engineering, XGBoost models & APDE solver
├── docs/             # Technical architectural specifications & research papers
├── docker/           # Multi-stage Dockerfiles and docker-compose topology
├── tests/            # Pytest & Vitest test suites
├── scripts/          # Automation, backtesting, and maintenance scripts
└── .env.example      # Environment variables configuration template
```

---

## Documentation Index
- 📘 [System Architecture Specification](docs/ARCHITECTURE.md)
- 📙 [Adaptive Portfolio Decision Engine (APDE) Research Specification](docs/RESEARCH.md)
- 📗 [Database Design & Schema Dictionary](docs/DATABASE.md)
- 📕 [REST API Contract Documentation](docs/API.md)
- 📓 [Docker & Deployment Guide](docs/DEPLOYMENT.md)

---

## Phase 1 Status
This repository is currently in **Phase 1: Project Planning & Architecture Foundation**. Core business logic, APIs, ML models, and frontend UI views are strictly planned in specification documents prior to implementation.
