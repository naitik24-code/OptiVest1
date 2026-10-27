# OptiVest AI — Final Submission Audit and Pre-Submission Source-to-PDF Integrity Verification

**Audit Date**: October 26, 2026  
**Auditor**: Senior Quantitative Researcher, Financial ML Engineer, & Academic Reviewer  
**Target Repository**: `OptiVest AI` (`e:\NAITIK PATHAK\PROJECT\StockProject`)  
**Target Manuscript Source**: `RESEARCH_PAPER/optivest_upgrade_paper.tex`  
**Overall Pre-Submission Status**: **PASS WITH DOCUMENTED LIMITATIONS** (Source Clean, Audited, Reconciled, and Ready for Overleaf Compilation)

---

## 1. Executive Verdict & Decision

**VERDICT: PASS WITH DOCUMENTED LIMITATIONS**

The manuscript source `RESEARCH_PAPER/optivest_upgrade_paper.tex`, the Markdown chapters, the backend and optimization engines, and the test suite are fully reconciled, mathematically aligned, and supported by preserved data artifacts. 

- **Why Not "FAIL / NOT READY":** All 5 material contradictions (Section V-E prose, CDE artifact claims, TreeSHAP phrasing, Table VIII timing duplication, and $R^2$ benchmark ambiguity) have been completely resolved and backed by actual code and CSV/JSON evidence. All 40 unit and integration tests pass cleanly with zero failures.
- **Why "WITH DOCUMENTED LIMITATIONS":** 
  1. No local LaTeX compiler is installed on this Windows workstation host, meaning the final PDF must be compiled via Overleaf or an external build system. The existing `optivest (1).pdf` is stale relative to the corrected `.tex` source.
  2. As explicitly stated in the manuscript, the research backtest relies on an exploratory hindsight-selected 50-asset universe, 10 bps linear transaction fee model, and non-point-in-time fundamentals snapshots.
  3. Single-decision TreeSHAP prediction reconstruction is proven in code ($< 10^{-6}$ error), but full multi-asset walk-forward attribution stability across all 78 rebalances remains an uncalculated metric across the full backtest.

---

## 2. The Three Most Critical Findings

### Finding 1: Resolution of TreeSHAP Execution vs Explanation Stability
- **Location**: Section IV-C, Section III-E-3, Section V-G, Table IX, Section V-I, Abstract.
- **Investigation**: We executed `scripts/generate_xai_real_data.py` live under Python 3.14.3 / SHAP 0.52.0 / scikit-learn 1.9.0 and ran `backend/tests/test_real_xai_pipeline.py`.
- **Finding**: 
  - Standalone TreeSHAP executes cleanly in $< 1.5$ seconds.
  - Prediction reconstruction is mathematically exact ($|\hat{r}_i - (\phi_0 + \sum_j \phi_{ij})| = 2.79 \times 10^{-9} < 10^{-6}$).
  - Decision Score decomposition ($DS_i = \text{forecast} + \text{risk} + \text{cost}$) matches within $10^{-6}$.
  - A preliminary 5-cutoff AAPL retraining stability test (`scripts/xai_stability.json`) yields a mean consecutive Spearman correlation of $0.25$.
- **Resolution in Manuscript**: The manuscript was updated across all sections to distinguish verified single-decision execution from full walk-forward multi-asset stability. Section IV-C now explicitly states that full walk-forward stability across all 78 dates remains an uncomputed metric.

### Finding 2: Stale PDF Status & Complete Elimination of Section V-E Contradiction
- **Location**: Section V-E, Table VII, and `results_v7/Risk_Aversion_Sweep.csv`.
- **Finding**: The old numbers in previous drafts (volatility falling from 21.1% to 13.6%, max drawdown reaching 18.8% then 20.2%, effective N peaking at 14.8 at $\tau=3$) have been completely purged from the LaTeX source. Section V-E prose now strictly reports the verified metrics matching Table VII:
  - Volatility: 16.01% $\rightarrow$ 14.75%
  - Sharpe: 0.85 $\rightarrow$ 0.90
  - Max Drawdown: 21.08% $\rightarrow$ 18.92%
  - Effective N: 37.2 $\rightarrow$ 38.7 (peaking at 38.8 at $\tau=3.5$)
- **Status of PDF**: The pre-existing `optivest (1).pdf` was generated prior to these fixes and contains the old contradictory prose. It is **stale** and must not be submitted.

### Finding 3: Perfect Cross-Reference & LaTeX Environment Integrity
- **Location**: `RESEARCH_PAPER/optivest_upgrade_paper.tex`.
- **Finding**: An automated AST parsing of the complete LaTeX source confirmed:
  - Total defined labels: **43**
  - Total references (`\ref`, `\eqref`): **32**
  - Unresolved references: **0** (The cross-reference in Section V now correctly references `\ref{tab:cde-ablation}` for Table VI; zero `??` marks remain).
  - Braces: **731 open, 731 close (diff = 0)**.
  - Environments: **42 `\begin{...}`, 42 `\end{...}` (100% matched)**.
  - Math delimiters: **582 `$` signs (all paired)**.
  - Graphics dependencies: All 8 referenced PDF figures exist in `RESEARCH_PAPER/figures/publication/`.
  - Citations: All 15 cited references are defined in `thebibliography`.

---

## 3. Metric Reconciliation Summary (Highlights from `FINAL_METRIC_VERIFICATION.csv`)

| Metric / Table Item | Manuscript Claim | Source Artifact Value | Independently Recomputed Value | Match Status | Evidence File |
|---|---|---|---|---|---|
| XGBoost RMSE | 0.0845 | 0.08448 | 0.08448 | Exact Match | `results_v7/Forecast_Metrics.csv` |
| XGBoost MAE | 0.0598 | 0.05977 | 0.05977 | Exact Match | `results_v7/Forecast_Metrics.csv` |
| XGBoost Directional Accuracy | 56.28% | 56.28% | 56.28% | Exact Match | `results_v7/Forecast_Metrics.csv` |
| XGBoost Rank IC (t-stat) | 0.008 (0.34) | 0.0081 (0.3364) | 0.0081 (0.3364) | Exact Match | `results_v7/Forecast_Metrics.csv` |
| XGBoost $R^2_{\text{zero}}$ | -2.1% | -2.1006% | -2.1006% | Exact Match | `results_v7/Forecast_Metrics.csv` |
| XGBoost $R^2_{\text{mean}}$ | -4.45% | N/A | -4.4484% | Exact Match | `results_v7/WalkForward_Predictions.csv` |
| EW CAGR / Sharpe / Vol | 14.83% / 1.02 / 14.73% | 14.83 / 1.02 / 14.73 | 14.83% / 1.02 / 14.73% | Exact Match | `results_v7/Table_Master_10Arm.csv` |
| APDE full CAGR / Sharpe / Vol | 8.19% / 0.62 / 14.31% | 8.19 / 0.62 / 14.31 | 8.19% / 0.62 / 14.31% | Exact Match | `results_v7/Table_Master_10Arm.csv` |
| APDE full Turnover / Max DD | 180.0% / 19.12% | 180.00 / 19.12 | 180.00% / 19.12% | Exact Match | `results_v7/Table_Master_10Arm.csv` |
| APDE soft 20% cap Sharpe / TO | 0.32 / 1383.8% | 0.32 / 1383.80 | 0.32 / 1383.80% | Exact Match | `results_v7/Table_Master_10Arm.csv` |
| Controls $\mu=0$ Sharpe | 0.71 | 0.71 | 0.71 | Exact Match | `results_v7/Controls.csv` |
| Controls Trailing Mean Sharpe | 0.95 | 0.95 | 0.95 | Exact Match | `results_v7/Controls.csv` |
| Shuffled Control (Seeds 42-46) | 0.59, 1.04, 0.41, 0.58, 0.86 | Exact Match | Mean 0.70, SD 0.25 | Exact Match | `results_v7/deterministic_shuffled_control.csv` |
| Table VI No CDE Ret / Vol / Sharpe | 11.85% / 15.71% / 0.754 | 11.848% / 15.709% / 0.7542 | Preserved Match | `research_backtest_50asset_comparison.json` |
| Table VI CDE Ret / Vol / Sharpe | 10.49% / 13.90% / 0.755 | 10.492% / 13.896% / 0.7551 | Preserved Match | `research_backtest_50asset_comparison.json` |
| Solver Latency N=50 Median / P95 | 9.07 ms / 9.76 ms | 9.067 ms / 9.761 ms | Exact Match | `results_v7/Solver_Timing_Scalability.csv` |
| Solver Latency N=500 Median / P95 | 309.95 ms / 320.16 ms | 309.946 ms / 320.165 ms | Exact Match | `results_v7/Solver_Timing_Scalability.csv` |
| TreeSHAP Reconstruction Error | $< 10^{-6}$ | $2.79 \times 10^{-9}$ | $2.79 \times 10^{-9}$ | Exact Match | `scripts/xai_real_data_example.json` |
| AAPL Consecutive Stability Mean | 0.25 | 0.25 | 0.25 | Exact Match | `scripts/xai_stability.json` |

*(See full 115-row audit in `audit_deliverables/FINAL_METRIC_VERIFICATION.csv`)*.

---

## 4. Test Suite Execution Evidence

All unit and integration tests were executed via `pytest`:
- **Command**:
  ```powershell
  $env:PYTHONPATH="E:\NAITIK PATHAK\PROJECT\StockProject\backend"; .\venv\Scripts\pytest.exe backend/tests -v
  ```
- **Execution Summary**:
  - **Total Tests Collected**: 40
  - **Passed**: 40 (100%)
  - **Failed**: 0
  - **Skipped**: 0
  - **Execution Time**: 48.66 seconds
- **Key Modules Tested**:
  - `backend/tests/test_apde_constraints.py`: All operational constraints ($\sum w_i = 1$, $w_i \ge 0$, $w_i \le 0.20$, $\|w - w_0\|_1 \le 0.15$) strictly verified with solver status `optimal`.
  - `backend/tests/test_decision_score.py`: Mathematical sign, risk term, and cost term decompositions verified.
  - `backend/tests/test_real_xai_pipeline.py`: SHAP exact reconstruction error $< 10^{-6}$ verified.
  - `backend/tests/test_cde_apde_integration.py`: End-to-end integration verified.
  - `backend/tests/test_fundamentals.py`: 20 deterministic tests on financial statements verified.

---

## 5. Overleaf Submission Package & File Manifest

To compile the final camera-ready PDF on Overleaf, create a new blank Overleaf project and upload the following exact files preserving their relative directory structure:

### Root Level Files:
1. `optivest_upgrade_paper.tex` (Rename to `main.tex` in Overleaf or keep as primary tex file)
2. `references.bib` (Optional auxiliary bib file, since the `.tex` includes embedded `\begin{thebibliography}`)

### Subdirectory: `figures/publication/` (Required Figure Assets)
The LaTeX document includes graphics from `figures/publication/`. You must create a folder named `figures/publication` in your Overleaf project and upload these 6 PDF figures:
1. `system_architecture.pdf` (Architecture diagram, Fig. 1)
2. `walk_forward_validation.pdf` (Walk-forward purge/train diagram, Fig. 2)
3. `candidate_discovery_engine.pdf` (CDE pipeline, Fig. 3)
4. `apde_optimization.pdf` (APDE quadratic program, Fig. 4)
5. `verified_performance_comparison.pdf` (Verified CAGR & Sharpe bar charts, Figs. 5 & 6)
6. `constraints_and_recovery.pdf` (Constraint recovery diagram, Figs. 7 & 8)

*(All 6 PDF figure files are already present and verified in `E:\NAITIK PATHAK\PROJECT\StockProject\RESEARCH_PAPER\figures\publication\`)*.

---

## 6. Audit Deliverables Manifest

All evidence and tracking files are stored in `audit_deliverables/`:
1. `audit_deliverables/FINAL_SUBMISSION_AUDIT.md` (This document)
2. `audit_deliverables/FINAL_METRIC_VERIFICATION.csv` (Complete 115-row metric verification)
3. `audit_deliverables/FINAL_DISCREPANCY_REGISTER.csv` (All 7 reconciled issues)
4. `audit_deliverables/FINAL_REPRODUCIBILITY_MATRIX.csv` (Full experiment-to-artifact mapping)
5. `audit_deliverables/FINAL_FIX_LOG.md` (Detailed record of all file edits)
6. `audit_deliverables/TEST_RESULTS.md` (Pytest test suite output)
7. `audit_deliverables/CORRECTION_PLAN.md` (Line-by-line correction plan)
8. `audit_deliverables/AUDIT_REPORT.md` (Initial baseline audit report)

---

## 7. Final Submission Recommendation

**Status: PASS WITH DOCUMENTED LIMITATIONS**  
The OptiVest AI manuscript source is completely reconciled, auditable, and mathematically consistent with all frozen research outputs. The project is ready for Overleaf compilation and conference review.
