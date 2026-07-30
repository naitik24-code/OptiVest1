# Database Design Specification & Data Dictionary
**Project:** OptiVest AI  
**Engine:** PostgreSQL 16  
**ORM Target:** SQLAlchemy 2.0  

---

## Entity Relationship Overview

```
USERS (1) <---> (1) USER_PREFERENCES
USERS (1) <---> (N) PORTFOLIOS
USERS (1) <---> (N) NOTIFICATIONS
PORTFOLIOS (1) <---> (N) HOLDINGS
PORTFOLIOS (1) <---> (N) TRANSACTIONS
PORTFOLIOS (1) <---> (N) DECISION_LOGS
PORTFOLIOS (1) <---> (N) PAPER_TRADES
STOCKS (1) <---> (N) HISTORICAL_PRICES
STOCKS (1) <---> (N) HOLDINGS
STOCKS (1) <---> (N) PREDICTIONS
```

---

## Complete Table Planning Dictionary

### 1. `users` Table
Stores primary user platform profile records.
- `id` (UUID, Primary Key, Indexed)
- `email` (VARCHAR(255), Unique, Not Null, Indexed)
- `hashed_password` (VARCHAR(255), Not Null)
- `is_active` (BOOLEAN, Default: true)
- `created_at` (TIMESTAMPTZ, Default: NOW())
- `updated_at` (TIMESTAMPTZ, Default: NOW())

### 2. `user_preferences` Table
Stores user-specific rebalancing limits and risk preferences.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`, Unique, Not Null)
- `max_reallocation_pct` (NUMERIC(5,2), Default: 15.00, Not Null) -- Reallocation limit cap
- `risk_tolerance_level` (INTEGER, Default: 3, Range: 1-5)
- `preferred_benchmark` (VARCHAR(50), Default: 'SP500')
- `created_at` (TIMESTAMPTZ, Default: NOW())

### 3. `portfolios` Table
Tracks user portfolio containers and liquid cash.
- `id` (UUID, Primary Key, Indexed)
- `user_id` (UUID, Foreign Key -> `users.id`, Not Null)
- `name` (VARCHAR(100), Not Null)
- `cash_balance` (NUMERIC(15,2), Default: 0.00, Not Null)
- `currency` (VARCHAR(3), Default: 'USD')
- `created_at` (TIMESTAMPTZ, Default: NOW())

### 4. `stocks` Table
Security master index.
- `id` (UUID, Primary Key, Indexed)
- `ticker` (VARCHAR(20), Unique, Not Null, Indexed)
- `company_name` (VARCHAR(255), Not Null)
- `sector` (VARCHAR(100), Indexed)
- `industry` (VARCHAR(100))
- `is_active` (BOOLEAN, Default: true)

### 5. `holdings` Table
Tracks active portfolio positions.
- `id` (UUID, Primary Key)
- `portfolio_id` (UUID, Foreign Key -> `portfolios.id`, Not Null, Indexed)
- `stock_id` (UUID, Foreign Key -> `stocks.id`, Not Null, Indexed)
- `quantity` (NUMERIC(15,4), Not Null)
- `average_buy_price` (NUMERIC(15,2), Not Null)
- `updated_at` (TIMESTAMPTZ, Default: NOW())

### 6. `historical_prices` Table
Daily historical OHLCV price series.
- `id` (UUID, Primary Key)
- `stock_id` (UUID, Foreign Key -> `stocks.id`, Not Null, Indexed)
- `price_date` (DATE, Not Null, Indexed)
- `open_price` (NUMERIC(15,2), Not Null)
- `high_price` (NUMERIC(15,2), Not Null)
- `low_price` (NUMERIC(15,2), Not Null)
- `close_price` (NUMERIC(15,2), Not Null)
- `volume` (BIGINT, Not Null)

### 7. `predictions` Table
ML return predictions and confidence metrics.
- `id` (UUID, Primary Key)
- `stock_id` (UUID, Foreign Key -> `stocks.id`, Not Null, Indexed)
- `predicted_return_pct` (NUMERIC(8,4), Not Null)
- `confidence_score` (NUMERIC(5,4), Not Null)
- `horizon_days` (INTEGER, Not Null) -- e.g., 30 days
- `generated_at` (TIMESTAMPTZ, Default: NOW())

### 8. `decision_logs` Table
Audit trail of APDE rebalancing runs and SHAP explanations.
- `id` (UUID, Primary Key)
- `portfolio_id` (UUID, Foreign Key -> `portfolios.id`, Not Null, Indexed)
- `proposed_reallocations` (JSONB, Not Null) -- Trade proposals
- `shap_explanations` (JSONB, Not Null) -- Feature attributions
- `reallocation_pct_used` (NUMERIC(5,2), Not Null)
- `created_at` (TIMESTAMPTZ, Default: NOW())

### 9. `transactions` Table
Historical execution ledger.
- `id` (UUID, Primary Key)
- `portfolio_id` (UUID, Foreign Key -> `portfolios.id`, Not Null)
- `stock_id` (UUID, Foreign Key -> `stocks.id`, Not Null)
- `transaction_type` (VARCHAR(10), Not Null) -- 'BUY' or 'SELL'
- `quantity` (NUMERIC(15,4), Not Null)
- `price` (NUMERIC(15,2), Not Null)
- `executed_at` (TIMESTAMPTZ, Default: NOW())

### 10. `paper_trades` Table
Simulated paper trade execution records.
- `id` (UUID, Primary Key)
- `portfolio_id` (UUID, Foreign Key -> `portfolios.id`, Not Null)
- `stock_id` (UUID, Foreign Key -> `stocks.id`, Not Null)
- `action` (VARCHAR(10), Not Null) -- 'BUY' / 'SELL'
- `shares` (NUMERIC(15,4), Not Null)
- `execution_price` (NUMERIC(15,2), Not Null)
- `simulated_slippage` (NUMERIC(5,4), Default: 0.0005)
- `status` (VARCHAR(20), Default: 'COMPLETED')
- `created_at` (TIMESTAMPTZ, Default: NOW())

### 11. `notifications` Table
User alerts and system notifications.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key -> `users.id`, Not Null, Indexed)
- `title` (VARCHAR(255), Not Null)
- `message` (TEXT, Not Null)
- `is_read` (BOOLEAN, Default: false)
- `created_at` (TIMESTAMPTZ, Default: NOW())
