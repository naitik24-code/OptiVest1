import os
import sys
import json
import numpy as np
import pandas as pd
import yfinance as yf
from xgboost import XGBRegressor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
from app.services.explain_service import ExplainService
from app.services.apde_engine import APDEEngine

def main():
    print("Fetching real data for XAI...")
    asset = "AAPL"
    data = yf.download(asset, start="2022-01-01", end="2023-12-31", progress=False)
    prices = data['Close'].ffill()
    
    # Feature engineering (similar to run_research_backtest)
    df = pd.DataFrame(index=prices.index)
    # yfinance sometimes returns a series if 1 ticker
    if isinstance(prices, pd.DataFrame):
        df['price'] = prices[asset]
    else:
        df['price'] = prices
        
    df['returns_1d'] = df['price'].pct_change(1)
    df['mom_1m'] = df['price'].pct_change(21)
    df['vol_1m'] = df['returns_1d'].rolling(21).std() * np.sqrt(252)
    df['target'] = df['price'].pct_change(21).shift(-21)
    
    df = df.dropna()
    
    features = ['mom_1m', 'vol_1m', 'returns_1d']
    X = df[features]
    y = df['target']
    
    # Train actual tree-based model
    print("Training XGBRegressor...")
    model = XGBRegressor(n_estimators=50, max_depth=3, random_state=42)
    model.fit(X, y)
    
    # Take the last row for explanation
    last_row = X.iloc[[-1]]
    date_str = last_row.index[0].strftime('%Y-%m-%d')
    
    # TreeSHAP Decomposition
    print("Running TreeSHAP...")
    explain_service = ExplainService(model)
    shap_explanation = explain_service.explain_prediction(last_row)
    
    # Reconstruct
    base_value = shap_explanation["base_value"]
    r_hat = shap_explanation["r_hat"]
    shap_vals = shap_explanation["shap_values"]
    reconstructed = base_value + sum(shap_vals.values())
    reconstruction_error = abs(r_hat - reconstructed)
    
    print(f"Prediction: {r_hat}")
    print(f"Reconstructed: {reconstructed}")
    print(f"Error: {reconstruction_error}")
    
    # Decision Score Connection
    # Mock portfolio inputs for the same asset
    w = np.array([0.15, 0.85]) # AAPL, MSFT
    w0 = np.array([0.10, 0.90])
    # Mock covariance for AAPL
    Sigma_h = np.array([[0.04, 0.01], [0.01, 0.04]])
    
    target_idx = 0
    tau = 1.0
    gamma = 0.0010
    
    ds_components = APDEEngine.calculate_decision_score(
        r_hat_i=r_hat, 
        Sigma_h=Sigma_h, 
        w=w, 
        w0=w0, 
        tau=tau, 
        gamma=gamma, 
        target_index=target_idx
    )
    
    decision_type = "INCREASE_POSITION" if w[target_idx] > w0[target_idx] else "REDUCE_POSITION"
    bps = int(abs(w[target_idx] - w0[target_idx]) * 10000)
    narrative = explain_service.generate_narrative(asset, decision_type, shap_explanation, bps)
    
    example = {
        "asset": asset,
        "date": date_str,
        "model": "XGBRegressor",
        "prediction": r_hat,
        "base_value": base_value,
        "shap_contributions": shap_vals,
        "reconstructed_prediction": reconstructed,
        "reconstruction_error": reconstruction_error,
        "old_weight": float(w0[target_idx]),
        "new_weight": float(w[target_idx]),
        "weight_change": float(w[target_idx] - w0[target_idx]),
        "forecast_term": ds_components["forecast_term"],
        "risk_term": ds_components["risk_term"],
        "cost_term": ds_components["cost_term"],
        "decision_score": ds_components["decision_score"],
        "narrative": narrative
    }
    
    output_path = os.path.join(os.path.dirname(__file__), "xai_real_data_example.json")
    with open(output_path, "w") as f:
        json.dump(example, f, indent=4)
        
    print(f"Saved real XAI example to {output_path}")

if __name__ == "__main__":
    main()
