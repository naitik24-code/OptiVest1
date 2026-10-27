# OptiVest AI - Project Context for AI Agents

**To the AI Agent reading this:** You are tasked with generating, expanding, or formatting a research paper, documentation, or analytical report for the "OptiVest AI" project. This document contains the absolute ground truth regarding what the project is, the problems it solves, how the underlying architecture works, and the technology stack utilized. Use this context to ensure technical accuracy and consistency in all your generations.

---

## 1. What the Project Does
**OptiVest AI** is an advanced, end-to-end quantitative wealth management and portfolio optimization platform. It bridges the gap between raw machine learning price predictions and executable, risk-adjusted portfolio management. It takes raw market and fundamental data, discovers optimal investment candidates, and mathematically computes the exact asset weights required for a portfolio, while providing human-readable explanations for every decision.

---

## 2. The Core Problems It Solves
OptiVest explicitly solves two major failures in modern FinTech:
1. **The Prediction Fallacy**: Traditional ML papers focus solely on predicting stock prices (e.g., "Stock A will go up 5%"). However, retail and enterprise portfolios cannot trade on predictions alone. They require dynamic risk budgeting, strict execution constraints (e.g., no short-selling, turnover limits), and covariance (diversification) awareness. OptiVest shifts the focus from simple prediction to constrained multi-objective optimization.
2. **The Black-Box Dilemma**: Regulated environments reject complex ensemble or deep learning models because they cannot explain *why* a trade was made. OptiVest solves this by making every allocation mathematically transparent and explainable.

---

## 3. How It Works (The Architecture)

The system operates in a highly modular, sequential pipeline:

### Step A: Data Ingestion & Pipeline
- Ingests real-time prices and point-in-time annual financial statements (ROE, margins, debt ratios).
- Cleans, scales, and engineers features across momentum, volatility, and macroeconomic indicators.

### Step B: Candidate Discovery Engine (CDE)
- **Purpose**: Solves the "cash-heavy" portfolio problem by finding new assets to invest in.
- **Logic**: It scans the entire asset universe and filters out assets with missing data. It then ranks eligible assets based on a multi-factor score (Expected ML Return, Volatility Risk, Diversification benefit, and Fundamental Quality).
- **Adaptability**: The scoring weights shift dynamically based on the user's explicit Risk Tolerance profile (1 to 5).

### Step C: Adaptive Portfolio Decision Engine (APDE)
- **Purpose**: The core mathematical optimizer.
- **Logic**: Ingests the candidates from the CDE alongside existing portfolio holdings. It runs a quadratic optimization function to maximize expected returns while heavily penalizing variance (risk) and transaction costs (churn).
- **Constraints**: It enforces strict retail rules: No short-selling (long-only), self-financing (sum of weight deltas = 0), and reallocation caps (e.g., max 15% portfolio turnover).

### Step D: Explainable AI (XAI)
- **Purpose**: Solves the Black-Box Dilemma.
- **Logic**: Utilises TreeSHAP feature attribution to decompose the ML predictions. It generates a "Decision Score" and provides narrative audits (e.g., "Bought Asset X due to high 60-day momentum and strong operating margins").

---

## 4. Tools & Technology Stack
- **Market & Fundamental Data**: `yfinance` (Yahoo Finance API)
- **Machine Learning**: `XGBoost` (for non-linear return predictions) and `scikit-learn`.
- **Explainability**: `SHAP` (TreeSHAP framework).
- **Backend Infrastructure**: `FastAPI` (Asynchronous REST API) and `SQLAlchemy` (ORM for SQLite/PostgreSQL).
- **Optimization Math**: `scipy.optimize` (Quadratic programming for the APDE).

---

## 5. Existing Assets (Reference Guide)
If you need to embed images into your generated markdown, the repository contains the following pre-generated figures in `./figures/output/`:
- `fig01_system_architecture.png`: High-level OptiVest modular flow.
- `fig02_asset_universe.png`: Universe composition.
- `fig03_data_split.png`: Chronological train/test splitting.
- `fig04_preprocessing_pipeline.png` & `fig05_feature_taxonomy.png`: Data cleaning and engineering.
- `fig06_cde_framework.png`: The Candidate Discovery Engine logic.
- `fig07_apde_architecture.png`: The APDE mathematical flow.
- `fig08_model_comparison.png`: Proof that XGBoost outperforms linear regression.
- `fig09_apde_scalability.png`: Proof of sub-second optimization latency.
- `fig10_decision_score.png`: Visual breakdown of the XAI SHAP attributions.

*(Note: Always use absolute paths or proper relative paths depending on the user's markdown requirements).*
