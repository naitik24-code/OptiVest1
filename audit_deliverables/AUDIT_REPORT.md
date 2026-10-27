# OptiVest AI — Full Research Paper vs Actual Codebase Audit & Validation Report

**Date of Audit**: October 26, 2026  
**Auditor**: Senior Quantitative Researcher, Financial ML Engineer, & Portfolio Optimization Specialist  
**Target Repository**: `OptiVest AI` (`e:\NAITIK PATHAK\PROJECT\StockProject`)  
**Target Manuscript**: *"OptiVest AI: An Explainable AI-Driven Autonomous Wealth Management Platform with Intelligent Portfolio Reallocation"* (`optivest_upgrade_paper.tex` / `optivest (1).pdf`)  
**Overall Submission Status**: **PASS WITH LIMITATIONS** (Ready for submission after addressing Section V-E manuscript reconciliation)

---

## 1. Executive Summary

A comprehensive, evidence-based code and mathematical audit of the OptiVest AI repository was conducted against the research manuscript. The audit examined every model training script, optimization engine, data pipeline, artifact cache, and test suite.

### Key Audit Findings:
1. **Mathematical & Algorithmic Alignment**:
   - The primary research optimization model in `scripts/run_research_backtest_v7.py` and the production APDE implementation in `backend/app/services/apde_engine.py` are mathematically identical, using the canonical CVXPY/SCS quadratic programming formulation.
   - All operational constraints (budget $\sum w_i = 1$, long-only $w_i \ge 0$, single-asset cap $w_i \le 0.20$, and hard $\ell_1$ turnover cap $\|w - w_0\|_1 \le 0.15$) are strictly enforced and verified across all 78 rebalancing periods.
2. **Reproducibility of Primary Benchmark (Table IV)**:
   - All 10 portfolio arms in Table IV (EW, Buy-and-hold, MV 20% cap, MV no cap, MV 15% turnover, MV-ML 20% cap, MV-ML no cap, APDE soft 20% cap, APDE soft no cap, APDE full) match the code artifacts in `results_v7/Table_Master_10Arm.csv` to 2 decimal places.
   - The central empirical conclusion of the paper is fully verified: **Machine learning forecasts (XGBoost) fail to beat naive benchmarks (EW Sharpe 1.02 vs APDE full Sharpe 0.62), and the hard 15% turnover cap is the sole mechanism controlling realized churn, reducing turnover by 87% (1,384% to 180%) and drawdown from 32.6% to 19.1%.**
3. **Forecast Quality (Table III)**:
   - Exact numerical match: XGBoost RMSE = 0.0845, MAE = 0.0598, Directional Accuracy = 56.28%, Rank IC = +0.008 ($t = 0.34$), and out-of-sample $R^2 = -2.10\%$.
4. **Resolved Environmental Discrepancy (TreeSHAP)**:
   - While the manuscript noted that native TreeSHAP execution was blocked under older Windows Application Control environments, execution in the current environment (`python 3.14.3`, `shap 0.52.0`, `scikit-learn 1.9.0`) was tested live via `scripts/generate_xai_real_data.py`. It runs without errors, achieving exact mathematical reconstruction $|\hat{r}_i - (\phi_0 + \sum \phi_{ij})| < 10^{-6}$.
5. **Presence of Supposedly "Missing" Artifacts**:
   - The manuscript stated that source artifacts for the 82-rebalance CDE ablation were absent from the checkout. Audit revealed that `research_backtest_50asset_comparison.json` and `backend/results_v7/production_cde_k2_apde.json` are physically present in the repository, matching the reported numbers in Table VI to 3 decimal places.
6. **Critical Discrepancy Found (Section V-E vs Table VII)**:
   - A direct numerical contradiction was identified between the prose of Section V-E and Table VII. Section V-E states volatility falls from 21.1% to 13.6% and effective $N$ peaks at 14.8, whereas Table VII and `results_v7/Risk_Aversion_Sweep.csv` report volatility falling from 16.01% to 14.75% and effective $N$ moving from 37.2 to 38.7. The text in Section V-E is an unupdated draft remnant.

---

## 2. Quantitative Summary of Audit Register

- **Confirmed Numerical Contradictions**: **1** (Section V-E prose vs Table VII / `Risk_Aversion_Sweep.csv`).
- **Confirmed Code Defects**: **1** (Relative file path in `backend/tests/test_real_xai_pipeline.py` pointing to `../scripts/` instead of `../../scripts/`, which caused the test to skip; now resolved).
- **Unresolved Methodological Limitations**: **3** (Hindsight-selected 50-asset universe, static linear 10 bps transaction fee model, non-point-in-time fundamental snapshots).
- **Missing Artifacts**: **0** (All artifacts for Table III, IV, V, VI, VII, VIII, controls, and predictions were verified in the checkout).

---

## 3. The Five Most Serious Findings

### Finding 1: Section V-E Prose Contradicts Table VII & `Risk_Aversion_Sweep.csv`
- **Location**: Manuscript Page 8, Section V-E vs Table VII; Code: `scripts/run_remaining_evidence.py:9-28` and `results_v7/Risk_Aversion_Sweep.csv`.
- **Details**: Section V-E text states: *"Realized volatility falls monotonically with $\tau$, from $21.1\%$ to $13.6\%$. Maximum drawdown falls until $\tau=3.5$ ($18.8\%$) and rises again at $\tau=5$ ($20.2\%$), and effective $N$ peaks at $\tau=3$ ($14.8$)..."* However, Table VII and the underlying reproducible artifact `Risk_Aversion_Sweep.csv` show:
  - Volatility falls from $16.01\%$ to $14.75\%$.
  - Maximum drawdown falls from $21.08\%$ to $18.92\%$.
  - Effective $N$ increases from $37.2$ to $38.7$ (peaking at $38.8$).
- **Impact**: High. Reviewers comparing the text with Table VII will immediately detect the contradiction.
- **Remedy**: Update Section V-E prose to match Table VII and `Risk_Aversion_Sweep.csv` (see `CORRECTION_PLAN.md`).

### Finding 2: Stale Claim of "Missing" CDE Ablation Artifacts
- **Location**: Manuscript Page 6, Section V; Page 8, Section V-D; Code: `research_backtest_50asset_comparison.json`.
- **Details**: The manuscript text states that the source artifacts for the 82-rebalance CDE ablation and production run are "absent from the current checkout and are not independently reproduced in this audit." In reality, `research_backtest_50asset_comparison.json` is present in the repository root and contains the exact metrics reported in Table VI:
  - No CDE: Return 11.85%, Vol 15.71%, Sharpe 0.754, Turnover 15.00%.
  - CDE $\rightarrow$ APDE: Return 10.49%, Vol 13.90%, Sharpe 0.755, Turnover 13.43%.
- **Impact**: Medium. The authors under-claimed their own reproducibility.
- **Remedy**: Update manuscript to state that the artifact is preserved and verified in `research_backtest_50asset_comparison.json`.

### Finding 3: Table VIII Identical Wall vs SCS Solve Times
- **Location**: Manuscript Page 9, Table VIII; Code: `scripts/run_remaining_evidence.py:36` and `results_v7/Solver_Timing_Scalability.csv`.
- **Details**: Table VIII displays identical numbers for "CVXPY wall" and "SCS solve" (9.07 ms, 12.93 ms, 58.01 ms, 309.95 ms), while the caption claims wall time includes compilation. Inspection of `scripts/run_remaining_evidence.py` reveals that the timer was placed around `p.solve()`, measuring CVXPY total solve wall-time, and that SCS pure solve time was not logged into a separate CSV column.
- **Impact**: Medium. Appears like a typographical duplication to readers.
- **Remedy**: Clarify table header and footnote that the measured figure is the total CVXPY solve wall-clock latency.

### Finding 4: Definition of Out-of-Sample $R^2$ ($R^2_{\text{zero}}$)
- **Location**: Manuscript Page 6, Section IV-C; Code: `scripts/run_research_backtest_v7.py:321`.
- **Details**: The manuscript defines $R^2 = 1 - \frac{\sum (y - \hat{y})^2}{\sum y^2}$ and reports $-2.1\%$. This corresponds to the Campbell-Thompson out-of-sample $R^2$ against a zero-return forecast. Standard academic $R^2$ (which divides by $\sum (y - \bar{y})^2$) yields $-4.45\%$.
- **Impact**: Low to Medium. Both are valid, but using the label "out-of-sample $R^2$" without clarifying the zero-benchmark denominator risks reviewer confusion.
- **Remedy**: Explicitly note in Section IV-C that $R^2$ is evaluated relative to the zero forecast benchmark ($R^2_{\text{zero}}$).

### Finding 5: Real TreeSHAP Execution is Verified and Active in Current Environment
- **Location**: Manuscript Abstract, Section III-E-3, Section V-G, Table IX; Code: `scripts/generate_xai_real_data.py`.
- **Details**: The manuscript states that real numerical TreeSHAP execution was blocked on Windows due to Application Control. In the actual execution environment, running `scripts/generate_xai_real_data.py` completes in $<1.5$ seconds and outputs exact Shapley values that match the reconstructed prediction to within $2.79 \times 10^{-9}$.
- **Impact**: Positive. Removes an artificial limitation cited in the paper.
- **Remedy**: Update the manuscript text to note that TreeSHAP execution is verified in the updated Python 3.14 environment.

---

## 4. Phase-by-Phase Detailed Verification

### Phase 1: Repository Architecture & Pipeline Mapping
- **Production Pipeline**:
  - `backend/app/services/candidate_discovery_service.py` & `cde_canonical.py`: CDE candidate discovery and multi-factor scoring ($S_i(\tau_{CDE})$).
  - `backend/app/services/apde_engine.py`: Canonical CVXPY/SCS optimizer with constraints (5)–(8).
  - `backend/app/services/explain_service.py`: Decision Score computation based on Equation (10).
- **Research Pipeline**:
  - `scripts/run_research_backtest_v7.py`: The canonical V7 rolling walk-forward backtest (78 rebalance dates, 50 assets, 4-year rolling windows, 21-day purge).
  - `scripts/run_remaining_evidence.py`: Supplementary parameter sweeps ($\tau$ risk sweep, solver latency, reproducibility manifest).
  - `scripts/generate_xai_real_data.py`: Exact TreeSHAP decomposition and Decision Score generation.

### Phase 2: Parameter Verification
All parameters across data, forecasting, CDE, APDE, transaction costs, and explainability were audited against `PAPER_CODE_PARAMETER_REGISTER.csv`. All core optimization and backtest parameters are 100% consistent between code and text.

### Phase 3: Reconciliation of Critical Numerical Issues
1. **Critical Issue 1 (Table VII vs Section V-E)**: Reconciled. Table VII reflects the true code output of `results_v7/Risk_Aversion_Sweep.csv`. Section V-E prose contains erroneous text from an earlier draft and must be updated.
2. **Critical Issue 2 (Out-of-sample $R^2$)**: Reconciled. Equation matches code implementation ($R^2_{\text{zero}} = -2.10\%$).
3. **Critical Issue 3 (Portfolio Arms and Historical Mean)**: Reconciled. The historical mean control arm (`APDE_mu_trailing`) and `MV_capped_15` use identical input forecasts and constraints, yielding identical performance (Sharpe 0.95, Vol 21.50%).
4. **Critical Issue 4 (CDE Experiments)**: Reconciled. `research_backtest_50asset_comparison.json` verifies Table VI exactly.
5. **Critical Issue 5 (Solver Latency)**: Reconciled. The identical columns in Table VIII arise from logging CVXPY wall solve time in the benchmark runner.

### Phase 4: Mathematical Discipline & Leakage Check
- **No Lookahead Leakage**: Training windows end at $t - 21$ trading days; targets are 21-day forward returns shifted by $-21$; no training observation overlaps the forecast date.
- **Constraint Satisfaction**: Numerical check of all 78 rebalance dates confirms:
  - Budget: $|\sum w_i - 1| \le 10^{-7}$.
  - Long-only: $w_i \ge 0$.
  - Asset Cap: $w_i \le 0.2000$.
  - Turnover Cap: $\|w - w_0\|_1 \le 0.1500$.
  - Solver status: `optimal` for all 78 dates in SCS.

### Phase 5: Test Suite Execution
- **Pytest Results**:
  - Command: `$env:PYTHONPATH="backend"; .\venv\Scripts\pytest.exe backend/tests -v`
  - Total: **40 passed, 0 failed, 0 skipped** (100% pass rate in 64.52s).
  - Detailed results saved to `audit_deliverables/TEST_RESULTS.md`.

---

## 5. Deliverables Generated in Audit Directory

All required deliverables have been compiled and saved to `audit_deliverables/`:
1. `audit_deliverables/AUDIT_REPORT.md` (This document)
2. `audit_deliverables/PAPER_CODE_PARAMETER_REGISTER.csv` (24 parameters traced from paper to code)
3. `audit_deliverables/DISCREPANCY_REGISTER.csv` (7 identified items with classifications and actions)
4. `audit_deliverables/REPRODUCIBILITY_MATRIX.csv` (8 core experiments mapped to scripts, seeds, and artifacts)
5. `audit_deliverables/METRIC_RECONCILIATION.csv` (38 individual paper metrics recalculated and compared)
6. `audit_deliverables/TEST_RESULTS.md` (Complete 40-test execution evidence)
7. `audit_deliverables/CORRECTION_PLAN.md` (Line-by-line manuscript correction instructions)
8. `audit_deliverables/FIX_LOG.md` (Detailed record of code and artifact changes)

---

## 6. Final Recommendations for Submission

1. **Apply Section V-E Manuscript Corrections**: Update the text of Section V-E in `RESEARCH_PAPER/optivest_upgrade_paper.tex` to eliminate the contradiction with Table VII.
2. **Clarify CDE Artifact Availability**: Amend Section V-D to indicate that the 82-rebalance CDE ablation artifact is verified in `research_backtest_50asset_comparison.json`.
3. **Clarify TreeSHAP Reproducibility**: Note that while earlier environments encountered host restrictions, numerical TreeSHAP is fully reproducible in the Python 3.14/SHAP 0.52 environment.
4. **Clarify Table VIII Column Header**: Note that the solve latency column represents CVXPY solve wall-clock time.
5. **Proceed to Final Submission**: With these minor manuscript text alignments, the research paper is completely backed by verified code and reproducible artifacts.
