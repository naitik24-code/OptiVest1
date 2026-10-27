# Claim Matrix: Proven and Corrected Claims

## Reproduced and proven

| Claim | Evidence | Reproduction |
|---|---|---|
| APDE full Sharpe = 0.62 | `results_v7/Table_Master_10Arm.csv` | `venv/Scripts/python.exe scripts/run_research_backtest_deterministic.py` |
| APDE full CAGR = 8.19% | `results_v7/Table_Master_10Arm.csv` | Same command |
| APDE full volatility = 14.31% | `results_v7/Table_Master_10Arm.csv` | Same command |
| APDE full maximum drawdown = 19.12% | `results_v7/Table_Master_10Arm.csv` | Same command |
| APDE full annual turnover = 180% | `results_v7/Table_Master_10Arm.csv` | Same command |
| APDE soft-cap Sharpe = 0.32 | `results_v7/Table_Master_10Arm.csv` | Same command |
| APDE soft-cap volatility = 19.64% | `results_v7/Table_Master_10Arm.csv` | Same command |
| APDE soft-cap maximum drawdown = 32.59% | `results_v7/Table_Master_10Arm.csv` | Same command |
| APDE soft-cap turnover = 1,383.8% | `results_v7/Table_Master_10Arm.csv` | Same command |
| Equal-weight Sharpe = 1.02 | `results_v7/Table_Master_10Arm.csv` | Same command |
| Zero, trailing-mean and shuffled-average controls exist | `results_v7/Controls.csv` | Same command |
| Turnover-cap sensitivity exists | `results_v7/Cap_Sweep.csv` | Same command |
| Solver sensitivity exists | `results_v7/EPS_Sensitivity.csv` | Same command |
| Forecast RMSE, MAE, directional accuracy, rank IC, IC t-statistic and R² | `results_v7/Forecast_Metrics.csv`, `WalkForward_Predictions.csv` | Updated V7 runner |
| Date-level squared-error comparison statistic against zero forecast | `results_v7/Forecast_Metrics.csv` | Updated V7 runner |
| SCS/SLSQP objective and constraint-violation benchmark | `results_v7/Solver_Benchmark.csv` | Updated V7 runner |
| τ risk-aversion sweep over 78 rebalances | `results_v7/Risk_Aversion_Sweep.csv` | `scripts/run_remaining_evidence.py` |
| Timed SCS scalability for N=50,100,250,500 | `results_v7/Solver_Timing_Scalability.csv` | `scripts/run_remaining_evidence.py` |
| Source/data/result hashes and environment manifest | `results_v7/reproducibility_manifest.json` | `scripts/run_remaining_evidence.py` |
| APDE position and turnover constraints pass unit tests | `backend/tests/test_apde_constraints.py` | Container pytest suite |
| CDE can feed APDE candidates | `scripts/cde_apde_experiment_results.json` | `venv/Scripts/python.exe scripts/run_cde_experiment_minimal.py` |
| Production CDE k=2, 82-rebalance run | `research_backtest_50asset_comparison.json` | `venv/Scripts/python.exe scripts/run_full_scale_research_backtest.py` |

## Reproduced with correction

| Original wording | Corrected wording |
|---|---|
| “The ML forecast improves portfolio performance.” | “The reproduced sample does not demonstrate measurable forecast value; equal weight and controls are competitive.” |
| “The CDE 82-rebalance results are 11.79/14.89/0.791 vs 10.36/14.38/0.720.” | “The rerun produced 11.85/15.71/0.754 without CDE and 10.49/13.90/0.755 with CDE; these corrected values are the current evidence.” |
| “TreeSHAP values are reproduced.” | “TreeSHAP code is implemented, but real-data execution is environment-blocked.” |
| “The system is ready for live autonomous trading.” | “The system is validated for paper-trading research only.” |

Claims without a reproducible source artifact are not included in the proven set.
