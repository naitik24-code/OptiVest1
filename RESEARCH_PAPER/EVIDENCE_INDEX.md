# OptiVest Research Evidence Index

This index maps the paper's claims to saved project artifacts and states exactly what each artifact proves.

## Primary APDE experiment

- Script: `scripts/run_research_backtest_deterministic.py`
- Canonical implementation: `scripts/run_research_backtest_v7.py`
- Results: `results_v7/Table_Master_10Arm.csv`
- Controls: `results_v7/Controls.csv`
- Turnover-cap sweep: `results_v7/Cap_Sweep.csv`
- Solver sensitivity: `results_v7/EPS_Sensitivity.csv`
- Forecast metrics: `results_v7/Forecast_Metrics.csv`
- Walk-forward predictions: `results_v7/WalkForward_Predictions.csv`
- Solver benchmark: `results_v7/Solver_Benchmark.csv`
- Risk-aversion sweep: `results_v7/Risk_Aversion_Sweep.csv`
- Timed scalability benchmark: `results_v7/Solver_Timing_Scalability.csv`
- Reproducibility manifest: `results_v7/reproducibility_manifest.json`
- Metadata: `results_v7/metadata.json`

The saved V7 table supports the primary APDE, soft-penalty and equal-weight values quoted in the paper.

## CDE/APDE model evidence

- CDE implementation: `backend/app/services/cde_canonical.py`
- APDE implementation: `backend/app/services/apde_engine.py`
- Constraint tests: `backend/tests/test_apde_constraints.py`
- CDE tests: `backend/tests/test_cde.py`
- Integration tests: `backend/tests/test_cde_apde_integration.py`
- Smoke ablation: `scripts/cde_apde_experiment_results.json`
- Smoke-test runner: `scripts/run_cde_experiment_minimal.py`

The smoke ablation confirms that CDE candidate selection can feed the APDE solver on a small one-year, 10-asset test. It is not evidence for the manuscript's separate 82-rebalance CDE table.

## Reproducible figures

- Generator: `scripts/generate_paper_figures.py`
- Outputs: `RESEARCH_PAPER/figures/publication/`

Every publication figure has both PNG and PDF output. Performance figures read from `results_v7` rather than embedding unsupported performance values.

## Forecast, solver and explainability reruns

- Full V7 rerun log: `results_v7/v7_rerun.log`
- Real-data TreeSHAP example: `scripts/xai_real_data_example.json`
- Multi-cutoff TreeSHAP stability: `scripts/xai_stability.json`
- Dataset hash: `RESEARCH_PAPER/reproducibility_hashes.txt`
- Local dependency lock: `RESEARCH_PAPER/requirements-lock-windows.txt`

The real-data XAI run reconstructed the prediction exactly for the saved AAPL example. The multi-cutoff run reports mean consecutive Spearman correlation 0.25 across five cutoffs; this is an exploratory single-asset diagnostic, not a universal stability claim. The V7 log is the reproducibility record for the portfolio and sensitivity outputs.

## Testing evidence

- Backend targeted suite: 32 passed, 1 skipped in the deployed dependency environment.
- Frontend build: passed.
- Frontend Vitest: 2 passed.
- LaTeX compilation: passed with the built-in compiler.

## Limitations retained in the paper

- CDE 82-rebalance and production `k=2` source artifacts are not present.
- Real-data TreeSHAP execution is environment-blocked.
- The universe is hindsight-selected and fundamentals are not point-in-time.
- The evidence supports paper-trading research only, not real-money execution or guaranteed performance.
