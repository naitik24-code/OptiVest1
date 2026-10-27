# Test Execution and Validation Results

## Environment Details
- **OS**: Windows 11 / x86_64
- **Python**: 3.14.3
- **Primary Packages**:
  - `cvxpy`: 1.9.2
  - `scs`: 3.3.1
  - `xgboost`: 3.4.1
  - `shap`: 0.52.0
  - `scikit-learn`: 1.9.0
  - `pytest`: 9.1.1
  - `pandas`: 3.0.5
  - `numpy`: 2.5.1
  - `fastapi`: 0.141.1

## Test Run Command
```powershell
$env:PYTHONPATH="E:\NAITIK PATHAK\PROJECT\StockProject\backend"; .\venv\Scripts\pytest.exe backend/tests -v
```

## Summary Outcome
- **Total Tests Collected**: 40
- **Passed**: 40 (100%)
- **Failed**: 0
- **Skipped**: 0
- **Errors**: 0
- **Duration**: 64.52 seconds

---

## Detailed Itemized Outcomes

| Test Suite / File | Test Name | Result | What it Verifies |
|---|---|---|---|
| `backend/tests/test_apde_constraints.py` | `test_apde_constraints` | PASSED | APDE budget (sum=1), long-only (w>=0), asset cap (<=20%), turnover limit (<=15%), solver status ('optimal') |
| `backend/tests/test_autonomous.py` | `test_scheduler_status` | PASSED | Background task scheduler status API |
| `backend/tests/test_autonomous.py` | `test_run_job_not_found` | PASSED | Scheduler 404 error handling for invalid job IDs |
| `backend/tests/test_autonomous.py` | `test_pause_resume_job` | PASSED | Job pause and resume workflow |
| `backend/tests/test_autonomous.py` | `test_system_health` | PASSED | Autonomous system health monitor API |
| `backend/tests/test_autonomous.py` | `test_worker_status` | PASSED | Async worker health and thread pool status |
| `backend/tests/test_cde.py` | `test_cde_filter_eligibility` | PASSED | CDE candidate filtering and eligibility constraints |
| `backend/tests/test_cde.py` | `test_cde_replacement_logic` | PASSED | CDE replacement logic (held assets excluded from replacement suggestions) |
| `backend/tests/test_cde.py` | `test_cde_no_synthetic_data` | PASSED | Ensures no synthetic data is injected when live data is unavailable |
| `backend/tests/test_cde_apde_integration.py` | `test_cde_apde_integration` | PASSED | End-to-end integration: CDE shortlists fed directly into canonical CVXPY/SCS APDE solver |
| `backend/tests/test_decision_score.py` | `test_decision_score_mathematical_correctness` | PASSED | Exact mathematical decomposition: $DS_i = \hat{r}_i - 2\tau(\Sigma_h w)_i - \gamma \text{sgn}(w_i - w_{0,i})$ |
| `backend/tests/test_decision_score.py` | `test_decision_score_signs` | PASSED | Transaction cost sign verification for positive, negative, and zero rebalances |
| `backend/tests/test_decision_score.py` | `test_decision_score_multiple_assets` | PASSED | Multi-asset vectorization of Decision Score |
| `backend/tests/test_full_research_backtest.py` | `test_full_research_backtest` | PASSED | Research backtest deterministic execution |
| `backend/tests/test_full_scale_research_backtest.py` | `test_full_scale_research_backtest` | PASSED | Full-scale 82-rebalance backtest runner execution |
| `backend/tests/test_fundamentals.py` | `test_fundamental_data_retrieval` | PASSED | Real data retrieval from yfinance provider |
| `backend/tests/test_fundamentals.py` | `test_real_source_mapping` | PASSED | Balance sheet and cash flow statement field mappings |
| `backend/tests/test_fundamentals.py` | `test_missing_data_handling` | PASSED | Fallback and graceful handling of missing fundamental fields |
| `backend/tests/test_fundamentals.py` | `test_revenue_growth_calculation` | PASSED | YoY revenue growth formula |
| `backend/tests/test_fundamentals.py` | `test_eps_growth_calculation` | PASSED | EPS growth calculation |
| `backend/tests/test_fundamentals.py` | `test_margin_calculations` | PASSED | Operating and net profit margin calculations |
| `backend/tests/test_fundamentals.py` | `test_roe_calculation` | PASSED | Return on equity calculation |
| `backend/tests/test_fundamentals.py` | `test_roa_calculation` | PASSED | Return on assets calculation |
| `backend/tests/test_fundamentals.py` | `test_debt_to_equity_calculation` | PASSED | Debt-to-equity ratio calculation |
| `backend/tests/test_fundamentals.py` | `test_free_cash_flow_handling` | PASSED | Operating cash flow minus CapEx |
| `backend/tests/test_fundamentals.py` | `test_zero_denominator_handling` | PASSED | Zero division guardrails |
| `backend/tests/test_fundamentals.py` | `test_negative_denominator_handling` | PASSED | Negative equity/denominator handling |
| `backend/tests/test_fundamentals.py` | `test_multiple_reporting_periods` | PASSED | Multi-quarter time series handling |
| `backend/tests/test_fundamentals.py` | `test_data_freshness` | PASSED | Stale data detection |
| `backend/tests/test_fundamentals.py` | `test_fundamental_quality_score` | PASSED | Composite quality scoring $f^Q_i$ |
| `backend/tests/test_fundamentals.py` | `test_insufficient_data_classification` | PASSED | Incomplete data asset categorization |
| `backend/tests/test_fundamentals.py` | `test_deterministic_output` | PASSED | Determinism across identical input datasets |
| `backend/tests/test_fundamentals.py` | `test_cde_integration_with_fundamentals` | PASSED | CDE dynamic factor scoring with fundamentals |
| `backend/tests/test_fundamentals.py` | `test_risk_profile_behavior` | PASSED | Risk tolerance dial $\tau_{CDE} \in \{1,\dots,5\}$ weight schedule mapping |
| `backend/tests/test_fundamentals.py` | `test_api_asset_fundamentals_endpoint` | PASSED | REST API endpoint `/api/v1/fundamentals/{symbol}` |
| `backend/tests/test_fundamentals.py` | `test_security_authenticated_access` | PASSED | JWT authentication guard on fundamentals endpoints |
| `backend/tests/test_fundamentals.py` | `test_no_fake_data_forensics` | PASSED | Verification that no synthetic data generators are called |
| `backend/tests/test_fundamentals.py` | `test_cde_dynamic_reweighting_missing_fundamentals` | PASSED | Renormalization of weights when fundamentals are absent |
| `backend/tests/test_portfolio.py` | `test_portfolio_service_crud_and_calculations` | PASSED | Portfolio creation, valuation, and return calculations |
| `backend/tests/test_real_xai_pipeline.py` | `test_real_xai_pipeline` | PASSED | Real TreeSHAP base value + sum(shap) == prediction reconstruction & Decision Score breakdown |
