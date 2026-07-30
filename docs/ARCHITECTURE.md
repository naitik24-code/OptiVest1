# OptiVest AI — System Architecture & Specification Manual
**Version:** 1.0.0-draft | **Phase:** 1 (Architecture & Foundation Planning)  
**Author:** Senior Software & AI Architect  

---

## Executive Overview
**OptiVest AI** is a production-grade FinTech SaaS platform and novel research framework for automated wealth management. The system systematically analyzes investment portfolios, performs stock performance forecasting using gradient boosted trees (XGBoost), computes risk metrics, evaluates current holding efficiency against market benchmarks, and generates explainable portfolio reallocation strategies via an **Explainable Adaptive Portfolio Decision Engine (APDE)**.

---

## Section 1: Complete High-Level Architecture

### 1.1 Module Inventory & Functional Specifications

```mermaid
graph TD
    subgraph Client Tier
        UI[React + TypeScript + Tailwind + shadcn UI]
    end

    subgraph API & Backend Gateway Tier
        MW[Middleware: Cors / RateLimit / Logging / Auth Context]
        RT[FastAPI Router Layer]
        DEP[Dependency Injection: DB / Repos / Services]
    end

    subgraph Service Tier
        AUTH_S[Auth & User Profile Service]
        PORT_S[Portfolio Management Service]
        MKT_S[Market Intelligence Service]
        PRED_S[Prediction Engine Service]
        INTEL_S[Portfolio Intelligence Service]
        DECISION_S[Adaptive Portfolio Decision Engine APDE]
        XAI_S[Explainable AI Engine SHAP]
        PAPER_S[Paper Trading & Execution Engine]
        ANALYTICS_S[Performance & Risk Analytics Service]
    end

    subgraph Data & ML Persistence Tier
        DB[(PostgreSQL Database)]
        MODEL_STORE[(ML Model Registry & Feature Store)]
    end

    UI -->|HTTPS / REST API| MW
    MW --> RT
    RT --> DEP
    DEP --> AUTH_S
    DEP --> PORT_S
    DEP --> MKT_S
    DEP --> PRED_S
    DEP --> INTEL_S
    DEP --> DECISION_S
    DEP --> XAI_S
    DEP --> PAPER_S
    DEP --> ANALYTICS_S

    AUTH_S --> DB
    PORT_S --> DB
    MKT_S --> DB
    PRED_S --> MODEL_STORE
    INTEL_S --> DB
    DECISION_S --> DB
    XAI_S --> MODEL_STORE
    PAPER_S --> DB
    ANALYTICS_S --> DB
```

| Module Name | Responsibilities | Dependencies |
| :--- | :--- | :--- |
| **Authentication Module** | User identity context, JWT token decoding, role-based access validation, session state management. | User Table, Config |
| **Portfolio Module** | CRUD operations for portfolios, asset holding tracking, cash balances, historical holdings snapshot. | PostgreSQL |
| **Market Intelligence Module** | Data ingestion pipelines, stock quote synchronization, technical indicators computation, universe filtering. | HistoricalPrices Table, External APIs |
| **Prediction Engine** | ML inference interface, multi-horizon stock return prediction, confidence scoring using trained XGBoost models. | Feature Store, Model Registry |
| **Portfolio Intelligence Module**| Portfolio metrics calculation (Sharpe ratio, Beta, Max Drawdown, Sector Concentration, Diversification Score). | HistoricalPrices, Holdings |
| **Decision Engine (APDE)** | Core novel contribution: Multi-objective optimization for user-defined portfolio reallocation percentage. | Prediction Engine, Portfolio Intel |
| **Explainable AI (XAI)** | SHAP feature attribution generation, decision tree path extraction, human-readable rebalancing rationale. | Prediction Engine, APDE |
| **Paper Trading Module** | Simulated order execution, slippage simulation, paper transaction log, virtual cash balance settlement. | Holdings, PaperTrades Table |
| **Analytics Module** | Historical benchmark comparison (S&P 500), drift tracking, cumulative return calculation, risk attribution. | Transactions, HistoricalPrices |
| **Database Tier** | Relational persistence layer, transactional consistency, indexing, optimized time-series read models. | PostgreSQL 16 |
| **Deployment Infrastructure**| Container orchestration, environment isolated networks, multi-stage builds, persistent volumes. | Docker, Docker Compose |

---

## Section 2: Folder Structure

```
optivest-ai/
├── backend/                  # FastAPI Python backend application
│   ├── app/
│   │   ├── api/              # API router specifications (v1 endpoints)
│   │   ├── core/             # Application configurations, security settings, exceptions
│   │   ├── db/               # SQLAlchemy engine, session lifecycle, migrations
│   │   ├── dependencies/     # FastAPI Dependency Injection functions
│   │   ├── middleware/       # Custom middleware handlers (CORS, Rate Limiting, Request ID)
│   │   ├── models/           # SQLAlchemy ORM database models
│   │   ├── repositories/     # Data access layer (Abstract & Concrete repositories)
│   │   ├── schemas/          # Pydantic data validation schemas (Request/Response)
│   │   ├── services/         # Core business logic handlers & orchestrators
│   │   └── utils/            # Helper functions, formatters, mathematical utilities
│   ├── main.py               # Application entrypoint & ASGI app instantiation
│   ├── Requirements.txt       # Production dependencies
│   └── Pyproject.toml        # Tooling configurations (Black, Ruff, Mypy)
├── frontend/                 # React + TypeScript single-page application
│   ├── src/
│   │   ├── assets/           # Static media, icons, SVGs
│   │   ├── components/       # Reusable UI components (Atomic design & shadcn primitives)
│   │   │   ├── ui/           # Basic primitives (Buttons, Inputs, Dialogs)
│   │   │   └── shared/       # Application-wide composite UI modules
│   │   ├── contexts/         # React Context API providers (Theme, Global State)
│   │   ├── hooks/            # Custom React hooks (Data fetching, window sizing, state)
│   │   ├── layouts/          # Page layouts (Dashboard, Settings, Navigation shells)
│   │   ├── pages/            # View components corresponding to React Router routes
│   │   ├── services/         # HTTP client & API abstraction layers (Axios/Fetch wrapper)
│   │   ├── types/            # TypeScript interface declarations & type aliases
│   │   ├── utils/            # Class merging (cn), formatting, math helpers
│   │   ├── App.tsx           # Main application root component
│   │   └── main.tsx          # React application DOM bootstrap
│   ├── index.html            # HTML layout template
│   ├── package.json          # Node dependencies & script commands
│   ├── tsconfig.json         # TypeScript compiler rules
│   └── vite.config.ts        # Vite build tool configuration
├── database/                 # Database initialization and management scripts
│   ├── init.sql              # Initial database schema setup script
│   ├── migrations/           # Versioned Alembic migration scripts
│   └── seeds/                # Initial seed data for stock universe & market tickers
├── ml/                       # Machine Learning & Quantitative Finance engine
│   ├── artifacts/            # Serialized model binaries (.joblib, .json) & SHAP explainer cache
│   ├── data/                 # Raw/processed dataset storage (ignored in VCS)
│   ├── features/             # Feature engineering pipelines & technical indicator computations
│   ├── models/               # Model wrapper classes (XGBoost predictive modules)
│   ├── notebooks/            # Jupyter research notebooks for EDA and model validation
│   ├── pipelines/            # Training, cross-validation, and backtesting pipelines
│   └── research/             # Mathematical formulations for APDE optimization engine
├── docs/                     # Comprehensive architectural & developer documentation
│   ├── ARCHITECTURE.md       # Full architectural specification blueprint
│   ├── API.md                # REST API contract definitions & payload schemas
│   ├── DATABASE.md           # ER diagrams & schema dictionary
│   ├── RESEARCH.md           # Mathematical foundation of APDE & SHAP methodologies
│   └── DEPLOYMENT.md         # Production deployment, Docker Compose, & DevOps manual
├── docker/                   # Docker environment configurations
│   ├── docker-compose.yml    # Service orchestration manifest
│   ├── Dockerfile.backend    # Multi-stage Docker build file for FastAPI backend
│   └── Dockerfile.frontend   # Multi-stage Docker build file for Nginx + React SPA
├── tests/                    # Comprehensive unit, integration, and ML validation tests
│   ├── backend/              # Pytest backend test suite
│   ├── frontend/             # Vitest/Testing Library frontend test suite
│   └── ml/                   # Model assertion & feature pipeline unit tests
├── scripts/                  # Automation & DevOps maintenance scripts
│   ├── build.sh              # Local build setup script
│   ├── seed_db.sh            # Database population runner script
│   └── run_backtest.sh       # Quantitative engine backtest runner script
├── .env.example              # Environment variables template
├── .gitignore                # Version control exclusion rules
└── README.md                 # Project repository introduction & setup guide
```

---

## Section 3: Backend Architecture (FastAPI Blueprint)

The backend follows a strict **Layered Architecture Pattern** (Clean Architecture principle) ensuring low coupling and high testability:

```
[ HTTP Request ] 
       │
       ▼
[ Middleware Layer ] ──> CORS, Rate Limiting, Request Correlation ID
       │
       ▼
[ API Router Layer ] ──> Endpoint Routing, Parameter Parsing, Schema Validation
       │
       ▼
[ Dependency Injector ] ──> Database Session, Service Provider Instantiation
       │
       ▼
[ Service Layer ] ──> Domain Business Logic, AI Engine Interactivity, Rebalancing Rule Execution
       │
       ▼
[ Repository Layer ] ──> Database Data Access Object (DAO) Abstraction
       │
       ▼
[ Database / ORM Models ] ──> SQLAlchemy Relational Queries / PostgreSQL Persistence
```

### Module Responsibilities:
1. **routers**: Expose versioned REST API endpoints (`/api/v1/...`). Handle request routing, HTTP response status codes, and JSON serialization.
2. **services**: Implement core wealth management logic, orchestrate quantitative ML inference pipelines, evaluate portfolio health, and trigger APDE optimizations.
3. **repositories**: Provide abstract data access methods (e.g., `PortfolioRepository.get_by_user_id()`), decoupling business logic from ORM implementation.
4. **models**: Define SQLAlchemy ORM object entities mapping to PostgreSQL database tables.
5. **schemas**: Pydantic v2 schemas validating request data formats, response structures, and type contracts.
6. **utils**: Pure utility functions (datetime formatters, mathematical algorithms, indicator calculators).
7. **middleware**: Global request interceptors for log correlation, execution timing, security headers, and rate limiting.
8. **config**: Pydantic BaseSettings loading configuration securely from `.env` files.
9. **dependencies**: Reusable FastAPI `Depends` providers for DB session lifecycle and service container dependency resolution.

---

## Section 4: Frontend Architecture (React + TypeScript Blueprint)

The React frontend utilizes a modular **Feature-First + Layered Atomic Architecture**:

```
[ User Interaction ]
       │
       ▼
[ Router Layer (React Router) ] ──> Page Level Code Splitting & Navigation
       │
       ▼
[ Layout Layer ] ──> Dashboard Frame, Sidebar, Header, Global Banners
       │
       ▼
[ Page Components ] ──> Page State Coordination & Skeleton Views
       │
       ▼
[ Feature Components / shadcn UI ] ──> Reusable Display Components, Recharts Visuals
       │
       ▼
[ Custom Hooks & Context ] ──> UI Logic, Local State, Global Contexts
       │
       ▼
[ Service Layer ] ──> Axios Client API Wrappers with TypeScript Type Safety
```

### Structural Responsibilities:
1. **pages**: View components mapped directly to application routes (e.g., `PortfolioPage`, `RebalancePage`, `AnalyticsPage`).
2. **components**: Standard UI components divided into `ui` (atomic primitives like Button, Input, Modal) and `shared` (complex domain components like PortfolioCard, AllocationChart).
3. **layouts**: Shell containers defining common UI structures (e.g., Header, Sidebar navigation, Footer).
4. **hooks**: Reusable React stateful logic (e.g., `usePortfolio`, `useRebalanceEngine`, `useMarketPrices`).
5. **services**: API wrapper abstractions using typed HTTP clients to send requests to FastAPI backend routes.
6. **contexts**: Application-wide state management (e.g., UI Theme Context, Active Portfolio Context).
7. **types**: Centralized TypeScript interface definitions matching backend schema payloads.
8. **utils**: UI styling helpers (`cn` helper combining `clsx` and `tailwind-merge`), currency formatters, and chart data transformers.
9. **assets**: Static vector graphics, icons, logos, and global style tokens.

---

## Section 5: Database Design

### 5.1 Relational Schema & Entity Relationship Overview

```mermaid
erDiagram
    USERS ||--o{ PORTFOLIOS : owns
    USERS ||--o1 USER_PREFERENCES : configures
    USERS ||--o{ NOTIFICATIONS : receives
    PORTFOLIOS ||--o{ HOLDINGS : contains
    PORTFOLIOS ||--o{ TRANSACTIONS : logs
    PORTFOLIOS ||--o{ DECISION_LOGS : records
    PORTFOLIOS ||--o{ PAPER_TRADES : executes
    STOCKS ||--o{ HISTORICAL_PRICES : tracks
    STOCKS ||--o{ HOLDINGS : references
    STOCKS ||--o{ PREDICTIONS : forecasts
    DECISION_LOGS ||--o{ PREDICTIONS : utilizes
```

### 5.2 Database Table Planning Dictionary

| Table Name | Primary Key | Foreign Keys | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `users` | `id` (UUID) | None | System user records (email, hashed password, status, timestamps). |
| `user_preferences` | `id` (UUID) | `user_id` -> `users.id` | User-defined constraints: max reallocation %, risk tolerance (1-5), preferred sectors. |
| `portfolios` | `id` (UUID) | `user_id` -> `users.id` | User investment portfolios: total cash balance, target currency, creation date. |
| `holdings` | `id` (UUID) | `portfolio_id` -> `portfolios.id`, `stock_id` -> `stocks.id` | Current stock positions: shares count, average purchase price, total invested capital. |
| `transactions` | `id` (UUID) | `portfolio_id` -> `portfolios.id`, `stock_id` -> `stocks.id` | Historical BUY/SELL record log with execution timestamps and execution prices. |
| `stocks` | `id` (UUID) | None | Master security dictionary (Ticker symbol, company name, sector, market cap). |
| `historical_prices` | `id` (UUID) | `stock_id` -> `stocks.id` | Daily OHLCV stock price history for feature extraction and analytics. |
| `predictions` | `id` (UUID) | `stock_id` -> `stocks.id` | Predictive return estimates, model confidence score, forecast horizon indicator. |
| `decision_logs` | `id` (UUID) | `portfolio_id` -> `portfolios.id` | Audit table recording APDE optimization runs, proposed reallocations, and SHAP rationale. |
| `paper_trades` | `id` (UUID) | `portfolio_id` -> `portfolios.id`, `stock_id` -> `stocks.id` | Simulated execution records tracking rebalancing execution performance. |
| `notifications` | `id` (UUID) | `user_id` -> `users.id` | Alert messages regarding portfolio drift, high risk alerts, and optimization suggestions. |

---

## Section 6: AI Architecture & Pipeline Specification

### 6.1 End-to-End AI Pipeline Diagram

```
[ Market Data Ingestion ] ──> Fetch Daily Price / Volume Series
       │
       ▼
[ Feature Engineering ] ──> Compute Returns, SMA, RSI, MACD, Volatility, Sharpe
       │
       ▼
[ Prediction Engine (XGBoost) ] ──> Multi-Horizon Return Forecasting + Confidence Score
       │
       ▼
[ Portfolio Intelligence ] ──> Risk Calculation, Sector Risk, Current Health Metrics
       │
       ▼
[ Adaptive Portfolio Decision Engine (APDE) ] ──> Constraint Optimization (Max Return, Min Risk, Max Turnover Limit)
       │
       ▼
[ Explainable AI (SHAP) ] ──> Feature Importance Attribution & Rebalance Rationale Generation
       │
       ▼
[ Structured Recommendation Output ] ──> JSON Response for User Review & Paper Execution
```

### 6.2 Pipeline Stage Detailed Breakdown
1. **Market Data Ingestion**: Pulls historical price, dividend, and market index series into cleaned data frames.
2. **Feature Engineering**: Constructs lagged price returns, rolling standard deviations (volatility), technical indicators (RSI, Moving Averages, MACD), and macroeconomic features.
3. **Prediction Engine**: Runs pre-trained XGBoost regression models to predict expected returns $E[R_i]$ over 30-day and 90-day horizons alongside confidence intervals.
4. **Portfolio Intelligence**: Computes current portfolio covariance matrix $\Sigma$, Sharpe Ratio, Beta relative to market index, and sector drift.
5. **Adaptive Portfolio Decision Engine (APDE)**: Applies continuous mathematical optimization (Quadratic Programming / Constrained Multi-Objective Optimization) to solve for optimal reallocation vector $\Delta w$, bounded strictly by user-defined reallocation percentage cap $C_{realloc}$.
6. **Explainable AI (SHAP)**: Uses TreeSHAP to compute feature contribution scores explaining *why* specific stocks are recommended for overweighting or underweighting.
7. **Recommendation Engine**: Formulates human-understandable actionable recommendations with exact trade lists and SHAP summary visualizations.

---

## Section 7: End-to-End System Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant DB as PostgreSQL DB
    participant ML as ML & APDE Engine
    participant SHAP as Explainable AI Engine

    User->>UI: Request Portfolio Optimization (Reallocate X%)
    UI->>API: POST /api/v1/portfolios/{id}/rebalance
    API->>DB: Fetch Active Holdings & User Risk Preferences
    DB-->>API: Return Holdings & Constraints
    API->>DB: Fetch Market Historical Prices & Stock Metrics
    DB-->>API: Return Market Data
    API->>ML: Trigger Prediction Pipeline
    ML->>ML: Compute Technical Features & Predict Returns (XGBoost)
    API->>ML: Execute APDE Optimization Engine
    ML->>ML: Solve Utility Maximization with Reallocation Constraint
    API->>SHAP: Generate Model Rationale
    SHAP->>SHAP: Calculate SHAP values for top recommended shifts
    API->>DB: Store Rebalancing Output in DecisionLogs Table
    API-->>UI: Return Optimal Allocation Strategy + SHAP Explanations
    User->>UI: Approve Rebalance Action (Paper Trade)
    UI->>API: POST /api/v1/portfolios/{id}/paper-trade/execute
    API->>DB: Record Simulated Trades & Update Paper Cash/Holdings
    API-->>UI: Return Trade Confirmation & Updated Portfolio State
```

---

## Section 8: Folder & File Naming Conventions

### 8.1 Python (Backend & ML)
- **Directories**: `snake_case` (e.g., `services/`, `portfolio_engine/`)
- **Files**: `snake_case.py` (e.g., `rebalance_service.py`, `xgboost_model.py`)
- **Classes**: `PascalCase` (e.g., `PortfolioRepository`, `APDEOptimizer`)
- **Functions/Variables**: `snake_case` (e.g., `calculate_sharpe_ratio`, `user_id`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_REALLOCATION_CAP`, `DEFAULT_RISK_FREE_RATE`)

### 8.2 React & TypeScript (Frontend)
- **Directories**: `kebab-case` (e.g., `portfolio-tracker/`, `rebalance-modal/`)
- **Components**: `PascalCase.tsx` (e.g., `PortfolioSummaryCard.tsx`, `RebalanceChart.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `usePortfolioData.ts`, `useRebalance.ts`)
- **Services/Utils**: `camelCase.ts` (e.g., `portfolioApi.ts`, `formatCurrency.ts`)
- **Types/Interfaces**: `PascalCase.ts` (e.g., `PortfolioState`, `HoldingEntity`)

### 8.3 Database & SQL
- **Table Names**: `plural_snake_case` (e.g., `historical_prices`, `decision_logs`)
- **Column Names**: `singular_snake_case` (e.g., `stock_id`, `created_at`, `current_price`)
- **Primary Keys**: `id` (UUID format)
- **Foreign Keys**: `referenced_table_singular_id` (e.g., `portfolio_id`, `user_id`)

### 8.4 Git Branches
- **Feature**: `feature/short-description` (e.g., `feature/apde-optimizer-engine`)
- **Bugfix**: `fix/short-description` (e.g., `fix/sharpe-ratio-calculation`)
- **Documentation**: `docs/short-description` (e.g., `docs/architecture-update`)

---

## Section 9: Coding Standards

### 9.1 Naming & Structure
- Explicit descriptive names over short abbreviations (`portfolio_repository` over `pref_repo`).
- One primary class or component per file.

### 9.2 Type Safety & Validation
- **Python**: Strict typing using type hints (`def get_holding(id: UUID) -> HoldingSchema:`). Enforced via `mypy`.
- **TypeScript**: No usage of `any`. Explicit interfaces for all API request/response payloads.

### 9.3 Error Handling & Standard API Responses
- All API endpoints return a uniform HTTP response structure:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2026-07-30T12:00:00Z",
    "request_id": "req-uuid-v4"
  }
}
```
- Domain exceptions handled via FastAPI custom Exception Handlers translating to standardized HTTP codes (`400 Bad Request`, `404 Not Found`, `422 Validation Error`, `500 Server Error`).

### 9.4 Logging Standard
- Structured JSON logging containing Correlation ID, Timestamp, Log Level, Service Name, and Message.
- Log levels: `DEBUG` (local dev), `INFO` (audit trail & key operations), `WARNING` (degraded service state), `ERROR` (handled exceptions), `CRITICAL` (system outage events).

---

## Section 10: Git Strategy & Workflow

### 10.1 Branch Strategy

```
main        ─────────────────────────────────────────────● (v1.0 Release)
                 ▲                                       ▲
                 │ (Release PR)                          │
develop     ─────┴─────────●─────────────────────────────┴───── (Integration)
                            ▲                 ▲
                            │ (Feature PR)    │ (Feature PR)
feature/*   ────────────────┴─────────────────┴────────────────
```

- **`main`**: Production-ready code only. Tags correspond to semantic versions (`v1.0.0`).
- **`develop`**: Integration branch for current iteration. All feature branches merge into `develop`.
- **`feature/*`**: Isolated branches for specific tasks created off `develop`.

### 10.2 Commit Message Convention (Conventional Commits)
Format: `<type>(<scope>): <short description>`

Types:
- `feat`: A new feature implementation
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style formatting (spaces, semicolons)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `chore`: Maintenance tasks, dependency updates, build configs

*Example*: `feat(apde): add quadratic solver constraint for max reallocation percentage`

---

## Section 11: Environment Variables Plan

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Yes | `development` | Runtime environment (`development`, `staging`, `production`). |
| `PORT` | No | `8000` | Backend application execution port. |
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/optivest_db` | Connection string for PostgreSQL database. |
| `JWT_SECRET` | Yes | `super-secret-key-change-in-prod` | Secret key used for signing JWT identity tokens. |
| `JWT_ALGORITHM` | No | `HS256` | Cryptographic algorithm for JWT verification. |
| `MARKET_DATA_API_KEY` | Yes | `mock-api-key` | API key for external stock price feed service. |
| `MODEL_PATH` | Yes | `./ml/artifacts/xgboost_latest.json` | Path to trained serialized XGBoost ML model binary. |
| `SHAP_CACHE_DIR` | No | `./ml/artifacts/shap_cache` | Directory path for caching computed SHAP explanations. |
| `LOG_LEVEL` | No | `INFO` | Output log verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `CORS_ORIGINS` | Yes | `http://localhost:3000,http://localhost:5173` | Allowed cross-origin resource sharing origins. |

---

## Section 12: Docker Architecture & Infrastructure Plan

### 12.1 Multi-Container Topology

```
+-------------------------------------------------------------------+
|                        Docker Host Environment                    |
|                                                                   |
|  +---------------------+        +------------------------------+  |
|  |   Frontend Container|        |     Backend Container        |  |
|  |   (Nginx Serving    |        |     (FastAPI ASGI Application|  |
|  |    React SPA Build) |        |      Uvicorn Workers)        |  |
|  |   Port: 80 / 3000   |        |     Port: 8000               |  |
|  +----------+----------+        +--------------+---------------+  |
|             |                                  |                  |
|             +-----------------+----------------+                  |
|                               |                                   |
|                     Internal Docker Bridge Network                |
|                     (optivest-network)                            |
|                               |                                   |
|                         +-----+------+                            |
|                         | PostgreSQL |                            |
|                         | Database   |                            |
|                         | Port: 5432 |                            |
|                         +-----+------+                            |
|                               |                                   |
|                        Persistent Volume                          |
|                        (pgdata_volume)                            |
+-------------------------------------------------------------------+
```

### 12.2 Container Specifications
1. **Frontend Container**: Multi-stage build (Node 20 build step -> Nginx Alpine production image). Serves optimized static bundles and proxies API requests.
2. **Backend Container**: Python 3.11 Slim container running Uvicorn server. Mounts serialized ML model artifacts volume.
3. **Database Container**: Official PostgreSQL 16 Alpine image. Configured with persistent Docker volume `pgdata_volume` for data durability across container restarts.

---

## Section 13: Phased Development Roadmap

| Phase | Milestone | Focus Areas | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation & Design | System Architecture & Database Schema | System Architecture Spec, Database Entity Maps, Docker Blueprints. |
| **Phase 2** | Database & Core API | Database Setup & CRUD Repositories | Alembic Migrations, SQLAlchemy ORM models, Portfolio & Holding REST Endpoints. |
| **Phase 3** | Market Data Pipeline | Market Intelligence & Indicators | Stock price sync pipeline, Technical indicator calculators (RSI, SMA, MACD). |
| **Phase 4** | Machine Learning | Return Prediction Engine | Feature engineering pipeline, XGBoost training workflow, Inference API. |
| **Phase 5** | Research Engine | Adaptive Portfolio Decision Engine | Multi-objective optimization module, Rebalancing solver, Constraint handlers. |
| **Phase 6** | Explainable AI | XAI Rationale & SHAP Explainer | SHAP tree explainer integration, Feature importance summary generation. |
| **Phase 7** | Frontend UI & SaaS | React Dashboard & Visualizations | Recharts portfolio dashboard, Rebalance approval UI, Paper trading interface. |

---

## Section 14: Documentation Structure Plan

The `docs/` repository directory will house key technical documentation modules:

```
docs/
├── README.md         # Documentation index and manual entry guide
├── ARCHITECTURE.md   # System architecture, layered patterns, and module interaction
├── API.md            # OpenAPI specification, REST API contracts, and payloads
├── DATABASE.md       # Database schema tables, fields, constraints, and ER diagrams
├── RESEARCH.md       # Mathematical thesis, APDE optimization formulation, & SHAP logic
└── DEPLOYMENT.md     # Container setup, environment configuration, & production deployment
```

---

## Section 15: Research Contribution

### 15.1 Academic Thesis: Adaptive Portfolio Decision Engine (APDE)

Traditional algorithmic trading models focus predominantly on **Stock Return Prediction** (forecasting whether stock $i$ will increase in value). However, pure stock return prediction fails as a standalone wealth management solution due to:
1. **Transaction Costs & Tax Friction**: Constant trading based on minor predicted price fluctuations degrades long-term yields.
2. **Portfolio Risk & Sector Over-concentration**: Unconstrained top-performing stock selection leads to unhedged, volatile portfolios.
3. **Lack of User Constraint Adaptability**: Standard models fail to incorporate real-world user limits, such as restricting portfolio reallocations to a fixed percentage (e.g., "reallocate at most 15% of my portfolio capital").

### 15.2 The Novel APDE Solution
The **Adaptive Portfolio Decision Engine (APDE)** shifts the focus from standalone stock prediction to **Constrained Portfolio State Optimization**. 

#### Mathematical Objective Formulation:

$$\max_{\Delta \mathbf{w}} \quad \mathbb{E}[R(\mathbf{w}_0 + \Delta \mathbf{w})] - \lambda \cdot \text{Risk}(\mathbf{w}_0 + \Delta \mathbf{w}) - \gamma \cdot \text{TurnoverCost}(\Delta \mathbf{w})$$

**Subject to strict operational constraints:**
1. **Reallocation Capital Constraint**:
   $$\sum_{i \in \text{Sell}} |\Delta w_i| \le C_{\text{realloc}}$$
2. **Portfolio Full Investment Constraint**:
   $$\sum_{i=1}^{N} (w_{0,i} + \Delta w_i) = 1.0$$
3. **No Short-Selling Constraint**:
   $$w_{0,i} + \Delta w_i \ge 0 \quad \forall i$$

Where:
- $\mathbf{w}_0$ is the current portfolio weight vector.
- $\Delta \mathbf{w}$ is the optimal weight adjustment vector proposed by APDE.
- $C_{\text{realloc}}$ is the user-configured maximum reallocation percentage cap.
- $\lambda$ is the user risk aversion parameter.
- $\gamma$ represents transaction friction and market impact penalties.

Furthermore, APDE couples this optimization engine with **TreeSHAP (SHapley Additive exPlanations)** feature attribution, converting complex quantitative decisions into transparent, audit-ready explanations for investors (e.g., *"Reallocated 5% from Stock A to Stock B because Stock B exhibits a 2.4x higher predicted Sharpe ratio driven by recent momentum indicators while remaining within your sector concentration limit"*).
