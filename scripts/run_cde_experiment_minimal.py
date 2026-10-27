import os
import sys
import json
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import cvxpy as cp

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from app.services.cde_canonical import CDE
from tests.test_apde_constraints import canonical_apde_solve

def run_experiment():
    print("Fetching data...")
    universe = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "AMD", "PLTR", "JPM"]
    end_date = datetime(2023, 12, 31)
    start_date = end_date - timedelta(days=365)
    
    data = yf.download(universe, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'), progress=False)
    prices = data['Close'].ffill().dropna(axis=1)
    
    available_universe = list(prices.columns)
    returns = prices.pct_change().dropna()
    
    # We will do a single-step optimization as the experiment
    # Expected returns: simple historical mean
    mu_array = returns.mean().values * 252
    cov_matrix = returns.cov().values * 252
    
    n_total = len(available_universe)
    initial_w = np.ones(n_total) / n_total
    
    # --- A. No-CDE ---
    print("Running No-CDE APDE...")
    # Optimize over all n_total assets
    w_nocde, status_nocde = canonical_apde_solve(mu_array, cov_matrix, initial_w, n_total, available_universe)
    
    ret_nocde = np.dot(mu_array, w_nocde)
    vol_nocde = np.sqrt(np.dot(w_nocde.T, np.dot(cov_matrix, w_nocde)))
    sharpe_nocde = ret_nocde / vol_nocde if vol_nocde > 0 else 0
    
    # --- B. CDE -> APDE ---
    print("Running CDE -> APDE...")
    config = {
        "base_score": 0.5,
        "threshold": 0.0,
        "top_k": 5
    }
    candidates = CDE.run(available_universe, {}, {}, config)
    cde_tickers = [c["ticker"] for c in candidates]
    
    # Subset mu and cov
    indices = [available_universe.index(t) for t in cde_tickers]
    mu_cde = mu_array[indices]
    cov_cde = cov_matrix[np.ix_(indices, indices)]
    
    initial_w_cde = np.ones(len(cde_tickers)) / len(cde_tickers)
    
    w_cde, status_cde = canonical_apde_solve(mu_cde, cov_cde, initial_w_cde, len(cde_tickers), cde_tickers)
    
    ret_cde = np.dot(mu_cde, w_cde)
    vol_cde = np.sqrt(np.dot(w_cde.T, np.dot(cov_cde, w_cde)))
    sharpe_cde = ret_cde / vol_cde if vol_cde > 0 else 0
    
    # Save results
    results = {
        "experiment_configuration": {
            "description": "CDE bypass ablation study",
            "date_range": {
                "start": start_date.strftime('%Y-%m-%d'),
                "end": end_date.strftime('%Y-%m-%d')
            }
        },
        "universe_definition": {
            "total_size": n_total,
            "tickers": available_universe
        },
        "cde_configuration": config,
        "no_cde_metrics": {
            "candidate_count": n_total,
            "portfolio_return": ret_nocde,
            "volatility": vol_nocde,
            "sharpe": sharpe_nocde,
            "turnover": np.sum(np.abs(w_nocde - initial_w))
        },
        "cde_apde_metrics": {
            "candidate_count": len(cde_tickers),
            "portfolio_return": ret_cde,
            "volatility": vol_cde,
            "sharpe": sharpe_cde,
            "turnover": np.sum(np.abs(w_cde - initial_w_cde))
        },
        "candidate_counts": {
            "initial": n_total,
            "selected_by_cde": len(cde_tickers)
        },
        "timestamp": datetime.now().isoformat()
    }
    
    output_path = os.path.join(os.path.dirname(__file__), "cde_apde_experiment_results.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=4)
        
    print(f"Saved results to {output_path}")

if __name__ == "__main__":
    run_experiment()
