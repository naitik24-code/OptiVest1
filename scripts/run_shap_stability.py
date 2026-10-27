"""Run real-data TreeSHAP on several rolling cutoffs and export stability."""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import yfinance as yf
import shap
from xgboost import XGBRegressor

out = Path(__file__).resolve().parent / "xai_stability.json"
data = yf.download("AAPL", start="2021-01-01", end="2023-12-31", progress=False)
prices = data["Close"]
if isinstance(prices, pd.DataFrame):
    prices = prices.iloc[:, 0]
df = pd.DataFrame({"price": prices})
df["returns_1d"] = df.price.pct_change()
df["mom_1m"] = df.price.pct_change(21)
df["vol_1m"] = df.returns_1d.rolling(21).std() * np.sqrt(252)
df["target"] = df.price.pct_change(21).shift(-21)
df = df.dropna()
features = ["mom_1m", "vol_1m", "returns_1d"]
vectors, records = [], []
for frac in np.linspace(0.65, 0.95, 5):
    n = max(100, int(len(df) * frac))
    train = df.iloc[:n]
    model = XGBRegressor(n_estimators=50, max_depth=3, random_state=42)
    model.fit(train[features], train.target)
    row = df.iloc[[min(n, len(df) - 1)]]
    explainer = shap.TreeExplainer(model)
    vals = np.asarray(explainer.shap_values(row[features])).reshape(-1).astype(float)
    base = float(np.asarray(explainer.expected_value).reshape(-1)[0])
    pred = float(model.predict(row[features])[0])
    vectors.append(np.abs(vals))
    records.append({"cutoff_fraction": float(frac), "date": str(row.index[0].date()), "prediction": pred, "base_value": base, "shap_values": dict(zip(features, vals)), "reconstruction_error": abs(pred - (base + vals.sum()))})
corr = [float(pd.Series(a).corr(pd.Series(b), method="spearman")) for a, b in zip(vectors[:-1], vectors[1:])]
json.dump({"model": "XGBRegressor", "asset": "AAPL", "features": features, "records": records, "consecutive_spearman_mean": float(np.mean(corr)), "consecutive_spearman_values": corr}, open(out, "w"), indent=2)
print(f"Saved {out}")
