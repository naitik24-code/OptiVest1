# OptiVest Walk-Forward Backtest & Results Generation Spec

**Role**: You are a quantitative researcher and ML engineer.
**Task**: Build and run a full walk-forward backtest for the OptiVest portfolio methodology, and return the exact metrics required to populate the tables in our research paper.

## 1. System Setup & Data Requirements
- **Universe**: Define a fixed universe of $N$ equities (e.g., $N = 250$) selected via a liquidity floor or index membership (e.g., S&P 500) for the actual portfolio backtest.
- **Date Range**: Minimum 10 years of daily data. Explicitly split into Train / Validation / Test windows.
- **Features**: 
  - Momentum: 30-day, 60-day, 90-day returns.
  - Macro indicators: (Define exact ones, e.g., VIX, 10-year Treasury yield).
- **Forecast Horizon ($h$)**: e.g., 21 trading days (1 month).
- **Rebalance Frequency**: Monthly.
- **Transaction Cost**: e.g., 10 bps per trade.
- **Covariance Lookback ($L$)**: e.g., 252 trading days.
- **Constraints**: Sector concentration cap (e.g., 20%), Reallocation cap (e.g., 15%).
- **Winsorization**: Percentile $p$ (e.g., 1% or 5%).
- **Determinism**: Fix and report all random seeds (train/test split, model init) so results are strictly reproducible.

## 2. Outputs Required (Return these exact table cells)

### A. Forecast Accuracy Table (on held-out test window)
For each model (Linear Regression, Random Forest, XGBoost), compute:
- RMSE
- MAE
- Directional Accuracy (%)
- Rank IC
- **Significance Test**: Report a Diebold-Mariano test (or paired t-test across folds) comparing XGBoost vs. Linear Regression forecast errors.

### B. Portfolio Performance Table (net of transaction costs)
For each strategy (Equally Weighted (EW), Mean-Variance (MV), Mean-Variance with ML (MV-ML), OptiVest, OptiVest without CDE, OptiVest without TC penalty), compute:
- Annualized Return (%)
- Annualized Volatility (%)
- Sharpe Ratio
- Sortino Ratio
- Maximum Drawdown (%)
- Annual Turnover (%)

### C. Risk-Profile Table (for Risk Aversion $\tau \in \{1, 2, 3, 4, 5\}$)
For the main OptiVest strategy across different risk aversions, compute:
- Annualized Volatility (%)
- Sharpe Ratio
- Maximum Drawdown (%)
- Effective $N$ (Concentration measure): Calculated as $N_{\text{eff}} = 1/\sum_i w_i^2$ (inverse Herfindahl).

### D. Latency Table (Optimizer Scalability)
*Note: Treat this as a separate synthetic/scaling test. You do not need real price history for each size, just solve the QP on candidate pools of varying sizes.*
For universe sizes $N \in \{50, 100, 250, 500\}$, record:
- Median QP solve time (ms)
- 95th percentile QP solve time (ms)

### E. Attribution Stability
- Rank correlation of the top-$k$ (e.g., top-5) SHAP features across consecutive retrains (return a single correlation metric).

## 3. Artifacts to Save
- Save daily equity curves per strategy as CSV.
- Save the full trade/rebalance log as CSV.

## 4. Metadata to Report
Please log the following facts used during the run:
- Exact number of equities in the universe ($N$) and selection criteria.
- Exact date ranges for train/val/test.
- Forecast horizon ($h$) and rebalance frequency.
- Assumed transaction cost (bps).
- Winsorization percentile ($p$).
- Covariance lookback window length ($L$).
- Reallocation cap % and Sector concentration cap %.
- Hardware specification used for latency tests.
- **Solver Settings**: Report the QP solver method and convergence tolerance used for the latency table.
- List of exact macro indicators used.
- Exact momentum horizons used.
- Random seeds used for determinism.

## 5. Written Responses Required
Once the numbers are generated, please write:
1. **Headline Finding**: One-sentence headline finding for the abstract summarizing the core result.
2. **Accuracy vs Portfolio Gain**: A short discussion of whether ML accuracy gains strictly translated to portfolio performance gains.
3. **Ablation Discussion**: A discussion on what the two ablation rows (no-CDE, no-cost) demonstrate about the strategy.
4. **Latency Scaling**: A statement comparing the empirical latency growth rate vs. theoretical QP complexity.
5. **Conclusion Statement**: A restated headline finding for the paper's conclusion.

---
**Execution Instructions**: 
Write the Python code to fetch the data (e.g., via `yfinance`), engineer features, train the models, run the walk-forward portfolio optimization, and output the required metrics. Do not mock the data; run the actual backtest.
**CRITICAL DATA WARNING**: Confirm whether the fundamental data source provides true point-in-time (as-filed) statements. If not (e.g., standard `yfinance` snapshots), flag this explicitly rather than silently using current snapshots to avoid look-ahead bias.
