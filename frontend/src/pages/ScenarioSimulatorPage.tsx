import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Sliders, Play, CheckCircle, ShieldAlert, BarChart3 } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface SimResult {
  source_asset: string;
  target_asset: string;
  reallocation_pct: number;
  current_return: number;
  simulated_return: number;
  return_delta: number;
  current_risk: number;
  simulated_risk: number;
  risk_delta: number;
  current_sharpe: number;
  simulated_sharpe: number;
  sharpe_delta: number;
  diversification_delta: number;
  recommendation_assessment: string;
}

export const ScenarioSimulatorPage: React.FC = () => {
  const [source, setSource] = useState('TSLA');
  const [target, setTarget] = useState('NVDA');
  const [pct, setPct] = useState(0.10);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      let activePid = portfolioId;
      if (!activePid) {
        const pRes = await fetch('/api/v1/portfolios', { headers: getH() });
        if (pRes.ok) {
          const pData = await pRes.json();
          const ports = pData.data || [];
          if (ports.length > 0) {
            activePid = ports[0].id;
            setPortfolioId(activePid);
          }
        }
      }
      
      if (activePid) {
        const res = await fetch(`/api/v1/apde/what-if?portfolio_id=${activePid}&source_asset=${source}&target_asset=${target}&reallocation_pct=${pct}`, {
        method: 'POST',
        headers: getH(),
      });
      if (res.ok) {
        setResult(await res.json());
      }
      }
    } catch (_) {}
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-400" />
          Interactive What-If Scenario Simulator
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Module 11 — Test manual portfolio reallocations and simulate Return, Risk, Sharpe Ratio, & Diversification without executing trades
        </p>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Simulation Inputs
          </h3>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Source Asset (Trim)</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            >
              {['TSLA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'CASH'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Target Asset (Add)</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            >
              {['NVDA', 'SPY', 'GOOGL', 'MSFT', 'BTC-USD'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-[var(--text-muted)] mb-1">
              <span>Reallocation Capital</span>
              <span className="text-indigo-400 font-bold">{(pct * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.50"
              step="0.01"
              value={pct}
              onChange={(e) => setPct(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 rounded-lg transition-all shadow-md"
          >
            <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Run What-If Simulation
          </button>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {result ? (
            <Card className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                <div>
                  <span className="text-xs uppercase font-semibold text-[var(--text-muted)]">Simulation Assessment</span>
                  <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2 mt-0.5">
                    {result.recommendation_assessment === 'FAVORABLE' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-5 h-5" /> Favorable Reallocation
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-5 h-5" /> Neutral / Risk Shift
                      </span>
                    )}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--text-muted)]">Reallocating</span>
                  <div className="text-base font-bold text-indigo-400">
                    {(result.reallocation_pct * 100).toFixed(0)}% from {result.source_asset} → {result.target_asset}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                  <span className="text-xs text-[var(--text-muted)] block">Exp. Annual Return</span>
                  <div className="text-lg font-bold text-[var(--text-main)] mt-0.5">
                    {(result.simulated_return * 100).toFixed(1)}%
                  </div>
                  <span className={`text-xs font-semibold ${result.return_delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.return_delta >= 0 ? '+' : ''}{(result.return_delta * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                  <span className="text-xs text-[var(--text-muted)] block">Portfolio Risk (Vol)</span>
                  <div className="text-lg font-bold text-[var(--text-main)] mt-0.5">
                    {(result.simulated_risk * 100).toFixed(1)}%
                  </div>
                  <span className={`text-xs font-semibold ${result.risk_delta <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.risk_delta >= 0 ? '+' : ''}{(result.risk_delta * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                  <span className="text-xs text-[var(--text-muted)] block">Sharpe Ratio</span>
                  <div className="text-lg font-bold text-indigo-400 mt-0.5">
                    {result.simulated_sharpe}
                  </div>
                  <span className={`text-xs font-semibold ${result.sharpe_delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.sharpe_delta >= 0 ? '+' : ''}{result.sharpe_delta}
                  </span>
                </div>

                <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                  <span className="text-xs text-[var(--text-muted)] block">Diversification Δ</span>
                  <div className="text-lg font-bold text-blue-400 mt-0.5">
                    +{(result.diversification_delta * 100).toFixed(1)}%
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">Improved</span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center bg-[var(--bg-card)] border border-[var(--border-color)]">
              <BarChart3 className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-[var(--text-main)]">Ready to Simulate</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Select your source asset, target asset, and percentage to evaluate candidate portfolio impact.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
