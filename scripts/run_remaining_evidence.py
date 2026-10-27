"""Export the remaining risk-sweep, solver-timing and reproducibility evidence."""
from pathlib import Path
import hashlib, json, platform, subprocess, time
import numpy as np, pandas as pd, cvxpy as cp

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "results_v7"; OUT.mkdir(exist_ok=True)

def risk_sweep():
    pred = pd.read_csv(OUT / "WalkForward_Predictions.csv", parse_dates=["date"])
    prices = pd.read_pickle(ROOT / "market_data_cache.pkl")
    if isinstance(prices.columns, pd.MultiIndex):
        prices = prices["Close"] if "Close" in prices.columns.levels[0] else prices.xs(prices.columns.levels[0][0], axis=1, level=0)
    assets = sorted(set(pred.asset) & set(prices.columns)); pred = pred[pred.asset.isin(assets)]
    rows = []
    for tau in [0.5, 1.0, 2.0, 3.0, 3.5, 5.0]:
        prev = np.ones(len(assets))/len(assets); rets=[]; weights=[]
        for date, day in pred.groupby("date"):
            syms = [a for a in assets if a in set(day.asset)]
            if len(syms) < 5: continue
            hist = prices.loc[:date, syms].iloc[-252:].pct_change().dropna(); cov = hist.cov().to_numpy()*21
            mu = day.set_index("asset").reindex(syms).pred_xgb.fillna(0).to_numpy(); n=len(syms); w0=np.ones(n)/n
            w=cp.Variable(n); prob=cp.Problem(cp.Maximize(mu@w-tau*cp.quad_form(w,cov)-0.001*cp.norm1(w-w0)),[cp.sum(w)==1,w>=0,w<=0.20,cp.norm1(w-w0)<=0.15]); prob.solve(solver=cp.SCS,eps=1e-6)
            if w.value is None: continue
            ww=np.clip(np.asarray(w.value),0,.2); ww=ww/ww.sum(); actual=day.set_index("asset").reindex(syms).target.fillna(0).to_numpy(); rets.append(float(ww@actual)); weights.append(ww)
        r=np.asarray(rets); wealth=np.cumprod(1+r); dd=1-wealth/np.maximum.accumulate(wealth); vol=float(r.std(ddof=1)*np.sqrt(12)) if len(r)>1 else np.nan; sharpe=float(r.mean()*12/(r.std(ddof=1)*np.sqrt(12))) if len(r)>1 and r.std(ddof=1)>0 else np.nan
        rows.append({"tau":tau,"n_rebalances":len(r),"annualized_volatility":vol,"sharpe":sharpe,"max_drawdown":float(dd.max()) if len(dd) else np.nan,"effective_n":float(np.mean([1/np.sum(w*w) for w in weights])) if weights else np.nan})
    pd.DataFrame(rows).to_csv(OUT/"Risk_Aversion_Sweep.csv",index=False)

def solver_timing():
    rng=np.random.default_rng(42); rows=[]
    for n in [50,100,250,500]:
        load=rng.normal(size=(n,5)); cov=load@load.T/100+np.eye(n)*.01; mu=rng.normal(size=n)*.01; w0=np.ones(n)/n
        times=[]
        for _ in range(3):
            w=cp.Variable(n); p=cp.Problem(cp.Maximize(mu@w-3*cp.quad_form(w,cov)-.001*cp.norm1(w-w0)),[cp.sum(w)==1,w>=0,w<=.2,cp.norm1(w-w0)<=.15]); t=time.perf_counter(); p.solve(solver=cp.SCS,eps=1e-5); elapsed=(time.perf_counter()-t)*1000; times.append(elapsed)
        rows.append({"N":n,"repeats":3,"median_wall_ms":float(np.median(times)),"p95_wall_ms":float(np.percentile(times,95)),"status":p.status,"scs_iterations":int(getattr(p.solver_stats,"num_iters",-1) or -1)})
    df=pd.DataFrame(rows); df["loglog_slope_from_50"] = np.log(df.median_wall_ms/df.median_wall_ms.iloc[0])/np.log(df.N/df.N.iloc[0]); df.to_csv(OUT/"Solver_Timing_Scalability.csv",index=False)

def reproducibility_manifest():
    files=[ROOT/"market_data_cache.pkl",OUT/"Table_Master_10Arm.csv",OUT/"Controls.csv",OUT/"Cap_Sweep.csv",OUT/"Forecast_Metrics.csv",OUT/"Solver_Benchmark.csv"]
    hashes={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files if p.exists()}
    manifest={"python":platform.python_version(),"platform":platform.platform(),"numpy":np.__version__,"pandas":pd.__version__,"cvxpy":cp.__version__,"source_commit":subprocess.run(["git","rev-parse","HEAD"],cwd=ROOT,capture_output=True,text=True).stdout.strip() or "unavailable","sha256":hashes}
    (OUT/"reproducibility_manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")

if __name__ == "__main__":
    risk_sweep(); solver_timing(); reproducibility_manifest(); print("Remaining evidence exported.")
