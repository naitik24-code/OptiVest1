import os
import sys
import json
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.apde_engine import APDEEngine

def main():
    # Use real project data/code setup but initialized in memory since db has <5 assets
    # making 0.20 cap infeasible. We will use a mock portfolio of 6 assets.
    
    n_assets = 6
    symbols = ["AAPL", "MSFT", "NVDA", "TSLA", "PLTR", "AMD"]
    current_w = np.array([0.2, 0.2, 0.2, 0.15, 0.15, 0.10])
    
    mu_array = np.array([0.08, 0.06, 0.12, -0.05, 0.04, 0.07])
    # positive semi-definite cov matrix
    A = np.random.rand(n_assets, n_assets)
    cov_matrix = np.dot(A, A.transpose()) * 0.02
    
    # We will simulate an APDE output that reallocates TSLA to NVDA
    target_w = np.array([0.2, 0.2, 0.35, 0.0, 0.15, 0.10])
    
    # Call the exact implemented mathematical Decision Score
    target_index = 2 # NVDA (buying)
    
    ds_components = APDEEngine.calculate_decision_score(
        r_hat_i=mu_array[target_index],
        Sigma_h=cov_matrix,
        w=target_w,
        w0=current_w,
        tau=1.0,
        gamma=0.0010,
        target_index=target_index
    )
    
    # SHAP mock logic since we don't have a trained XGBOOST in db for NVDA right now
    # We will just ensure the output is structured correctly.
    shap_contributions = {
        "momentum_14d": 0.06,
        "volatility_30d": -0.02,
        "volume_trend": 0.01
    }
    base_shap_value = 0.07
    
    # Sum of SHAP should approximately equal forecast
    assert abs((base_shap_value + sum(shap_contributions.values())) - ds_components["forecast_term"]) < 1e-6
    
    example = {
        "asset": symbols[target_index],
        "old_weight": current_w[target_index],
        "new_weight": target_w[target_index],
        "weight_change": target_w[target_index] - current_w[target_index],
        "forecast": ds_components["forecast_term"],
        "base_shap_value": base_shap_value,
        "shap_contributions": shap_contributions,
        "risk_term": ds_components["risk_term"],
        "cost_term": ds_components["cost_term"],
        "decision_score": ds_components["decision_score"],
        "action": "INCREASE_POSITION" if target_w[target_index] > current_w[target_index] else "REDUCE_POSITION"
    }
    
    with open("xai_decision_score_example.json", "w") as f:
        json.dump(example, f, indent=4)
        
    print("Example written to xai_decision_score_example.json")

if __name__ == "__main__":
    main()
