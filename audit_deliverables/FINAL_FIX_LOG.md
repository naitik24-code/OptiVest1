# Final Fix Log — OptiVest AI Final Pre-Submission Audit

This document records all modifications made to the repository codebase, research manuscript, tests, and deliverables during the final audit.

---

### 1. File: `RESEARCH_PAPER/optivest_upgrade_paper.tex`

- **Section V-E: Risk Profile Behaviour (Lines 967–980)**
  - *Change*: Replaced stale prose stating that volatility fell from 21.1% to 13.6% and effective N peaked at 14.8 at $\tau=3$.
  - *New Content*: Updated prose to report verified metrics from `results_v7/Risk_Aversion_Sweep.csv` and Table VII: volatility falling from $16.01\%$ to $14.75\%$, max drawdown falling from $21.08\%$ to $18.92\%$, effective N increasing from $37.2$ to $38.7$ (peaking at $38.8$ at $\tau=3.5$), and Sharpe ranging from $0.85$ to $0.90$.
- **Section V Intro & Section V-D (Lines 720–734, Lines 953–962)**
  - *Change*: Replaced claims that source artifacts for Table VI and production runs were absent from the checkout.
  - *New Content*: Accurately cited `research_backtest_50asset_comparison.json` (Table VI) and `backend/results_v7/production_cde_k2_apde.json` (production validation), explicitly clarifying that these are preserved historical runs rather than newly rerun backtests. Fixed label reference to `tab:cde-ablation`.
- **TreeSHAP Reconciliation (Abstract, Section I-A, Table I, Section III-E-3, Section IV-C, Section V-G, Table IX, Section V-I, Section VI-A)**
  - *Change*: Harmonized previously contradictory TreeSHAP wording across all sections.
  - *New Content*: Distinguished historical Windows Application Control restrictions on earlier hosts from verified live execution under Python 3.14.3 / SHAP 0.52.0 (`scripts/generate_xai_real_data.py`), which achieves prediction reconstruction error $< 10^{-6}$ ($2.79 \times 10^{-9}$). Clarified that single-decision prediction reconstruction is verified while full multi-asset walk-forward stability remains an uncalculated metric across all 78 dates.
- **Section IV-C Metrics (Lines 680–686)**
  - *Change*: Clarified out-of-sample $R^2$ benchmark definition.
  - *New Content*: Defined $R^2_{\text{zero}} = 1 - \frac{\sum (y - \hat{y})^2}{\sum y^2}$ (yielding $-2.10\%$) evaluated relative to a zero forecast benchmark, alongside the conventional sample-mean benchmark ($R^2_{\text{mean}} = -4.45\%$).
- **Table VIII Solver Scalability (Lines 1005–1045)**
  - *Change*: Replaced duplicate wall/SCS columns with explicit metrics.
  - *New Content*: Added `Median Wall (ms)` (9.07, 12.93, 58.01, 309.95), `P95 Wall (ms)` (9.76, 14.04, 60.13, 320.16), and `SCS Iters` (100, 150, 325, 525) matching `results_v7/Solver_Timing_Scalability.csv`. Updated caption and text to specify total CVXPY solve wall-clock latency.

---

### 2. File: `RESEARCH_PAPER/RESULTS_AND_DISCUSSION.md`

- **Section D & Table III & Section F**:
  - Synchronized Markdown documentation chapter with the LaTeX manuscript: updated TreeSHAP status to note verified execution in the modern environment, noted that full stability is an area for further study, and updated reproducibility statement.

---

### 3. File: `backend/tests/test_real_xai_pipeline.py`

- **Path Resolution Bug Fix (Line 9)**:
  - Fixed relative path calculation from `../scripts/xai_real_data_example.json` to `../../scripts/xai_real_data_example.json` so `pytest` locates the artifact from `backend/tests/` and executes the test instead of unconditionally skipping it.
  - Verified that all assertions pass: base value + sum(SHAP) == prediction (error $2.79 \times 10^{-9} < 10^{-6}$), Decision Score decomposition exact match, no NaN/inf values.

---

### 4. Audit Deliverables Created/Updated in `audit_deliverables/`

- `FINAL_SUBMISSION_AUDIT.md`: Comprehensive final pre-submission audit and source-to-PDF verification report.
- `FINAL_METRIC_VERIFICATION.csv`: Item-by-item verification of 115 individual metrics across all tables, sweeps, and controls.
- `FINAL_DISCREPANCY_REGISTER.csv`: Register of all 7 reconciled issues.
- `FINAL_REPRODUCIBILITY_MATRIX.csv`: Detailed matrix mapping every experiment to its artifact, script, rerun status, and limitation.
- `FINAL_FIX_LOG.md`: This file.
