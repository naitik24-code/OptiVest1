# REST API Architecture & OpenAPI Specifications
**Project:** OptiVest AI  
**Base URL:** `/api/v1`  
**Format:** JSON  

---

## Standard Response Structure

All endpoints return a predictable top-level JSON container:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2026-07-30T12:00:00Z",
    "request_id": "req-98234-uuid"
  }
}
```

---

## Resource Endpoint Specifications

### 1. Portfolio Management (`/api/v1/portfolios`)
- `GET /api/v1/portfolios`: List user portfolios.
- `POST /api/v1/portfolios`: Create a new investment portfolio.
- `GET /api/v1/portfolios/{id}`: Fetch detailed portfolio state including holdings & performance.
- `GET /api/v1/portfolios/{id}/holdings`: List current asset holdings and weights.

### 2. Market Intelligence (`/api/v1/market`)
- `GET /api/v1/market/stocks`: Search stock ticker index.
- `GET /api/v1/market/stocks/{ticker}/prices`: Fetch daily historical price series.
- `GET /api/v1/market/stocks/{ticker}/indicators`: Fetch technical indicators (RSI, SMA, MACD).

### 3. Prediction & Portfolio Intelligence (`/api/v1/intelligence`)
- `GET /api/v1/intelligence/portfolios/{id}/health`: Fetch risk metrics (Sharpe, Beta, Sector Drift).
- `GET /api/v1/intelligence/stocks/{ticker}/predict`: Fetch XGBoost expected return forecast.

### 4. Decision Engine (APDE) & Rebalancing (`/api/v1/rebalance`)
- `POST /api/v1/rebalance/optimize`: Execute APDE optimizer with user-specified max reallocation cap.
  - **Request Body**:
    ```json
    {
      "portfolio_id": "uuid-string",
      "max_reallocation_pct": 15.0,
      "risk_aversion": 2.5
    }
    ```
  - **Response Payload**: Proposed optimal asset shifts, target weight vectors, and SHAP decision explanations.
- `GET /api/v1/rebalance/logs/{id}`: Fetch historical optimization audit log.

### 5. Paper Trading (`/api/v1/paper-trading`)
- `POST /api/v1/paper-trading/execute`: Execute paper trade rebalancing order.
- `GET /api/v1/paper-trading/orders/{portfolio_id}`: List paper trade execution history.
