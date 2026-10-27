# OptiVest AI Research Verification Manifest

Run date: 2026-10-26 (Asia/Calcutta)

## Reproduced evidence

Command:

```text
venv/Scripts/python.exe scripts/run_research_backtest_deterministic.py
```

The canonical V7 experiment completed and wrote `results_v7/`. The primary APDE row reproduces the reported values: Sharpe 0.62, CAGR 8.19%, annualized volatility 14.31%, maximum drawdown 19.12%, and annual turnover 180.00%. The soft 20%-cap row reproduces Sharpe 0.32, volatility 19.64%, maximum drawdown 32.59%, and turnover 1,383.80%. The equal-weight control reproduces Sharpe 1.02. The complete control and cap-sweep outputs are in `results_v7/Table_Master_10Arm.csv`, `results_v7/Controls.csv`, and `results_v7/Cap_Sweep.csv`.

The run metadata records the canonical script and library versions in `results_v7/metadata.json`. The script reports 78 binding APDE periods and 77 non-initial turnover intervals.

## Figure evidence

```text
venv/Scripts/python.exe scripts/generate_research_assets.py
```

The coded pipeline and validation-protocol figures were regenerated as both PNG and PDF files under `RESEARCH_PAPER/figures/generated/`.

## Claim-audit evidence

```text
venv/Scripts/python.exe scripts/check_paper_claims.py
```

The audit output is `results_v8/paper_claims_check.csv`. Claims without their expected `results_v8` source artifacts are marked `MISSING` or `UNVERIFIED`; the script does not infer success from absent logs.

## Limitations

- The V7 reproduction verifies the reported aggregate backtest rows, but it does not by itself prove every claim in the supplied paper.
- TreeSHAP real-data evidence remains environment-dependent and must not be presented as reproduced when unavailable.
- The CDE ablation artifacts expected by the legacy V8 checker are not present in this checkout.
- Frontend and backend smoke tests confirm connectivity only; they are not evidence of investment performance.
