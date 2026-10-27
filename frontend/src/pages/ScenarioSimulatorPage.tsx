import React, { useState } from 'react';
import { Sliders, Play, CheckCircle, ShieldAlert, BarChart3, ArrowRight } from 'lucide-react';

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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Module 11 &bull; Interactive What-If Scenario Simulator</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Scenario Simulator
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Test manual portfolio reallocations and simulate Return, Risk, Sharpe Ratio, & Diversification without executing trades
          </p>
        </div>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        <div className="inst-card p-[32px] space-y-[24px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] border-b border-[var(--border-color)] pb-[16px]">
            Simulation Parameters
          </h3>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Source Asset (Trim)</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full bg-background border border-[var(--border-color)] text-[var(--text-main)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer"
            >
              {['TSLA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'CASH'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Target Asset (Add)</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-background border border-[var(--border-color)] text-[var(--text-main)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer"
            >
              {['NVDA', 'SPY', 'GOOGL', 'MSFT', 'BTC-USD'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="bg-background p-[16px] rounded-[8px] border border-[var(--border-color)]">
            <div className="flex justify-between items-center text-[13px] mb-[12px]">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Reallocation Capital</label>
              <span className="font-mono font-bold text-[var(--secondary)] bg-[var(--secondary)]/10 px-[10px] py-[4px] rounded-[4px] border border-[var(--secondary)]/30 text-[14px]">
                {(pct * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.50"
              step="0.01"
              value={pct}
              onChange={(e) => setPct(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer outline-none border border-[var(--border-color)]"
              style={{
                background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${(pct - 0.01) / (0.49) * 100}%, #111318 ${(pct - 0.01) / (0.49) * 100}%, #111318 100%)`
              }}
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] font-bold font-mono text-[13px] uppercase tracking-wider py-[14px] rounded-[8px] transition-all shadow-[0_0_15px_rgba(255,90,31,0.3)] cursor-pointer mt-4"
          >
            <Play className={`w-4 h-4 fill-current ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Simulating...' : 'Run What-If Simulation'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 flex flex-col h-full">
          {result ? (
            <div className="inst-card p-[32px] flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-[20px] mb-[24px]">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--text-muted)]">Simulation Assessment</span>
                  <h3 className="text-[20px] font-bold font-heading text-[var(--text-main)] flex items-center gap-2 mt-2">
                    {result.recommendation_assessment === 'FAVORABLE' ? (
                      <span className="text-[var(--success)] flex items-center gap-2 drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]">
                        <CheckCircle className="w-5 h-5" /> Favorable Reallocation
                      </span>
                    ) : (
                      <span className="text-[var(--danger)] flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]">
                        <ShieldAlert className="w-5 h-5" /> Neutral / Risk Shift
                      </span>
                    )}
                  </h3>
                </div>
                <div className="text-right bg-background p-[16px] rounded-[8px] border border-[var(--border-color)]">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">Reallocating</span>
                  <div className="text-[16px] font-bold font-mono text-[var(--secondary)] mt-1 flex items-center gap-2">
                    <span>{(result.reallocation_pct * 100).toFixed(0)}%</span>
                    <span className="text-[var(--text-main)] px-2">{result.source_asset}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-main)] px-2">{result.target_asset}</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] flex-1">
                <div className="p-[20px] bg-background rounded-[8px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors flex flex-col items-center justify-center text-center group">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">Exp. Annual Return</span>
                  <div className="text-[24px] font-extrabold font-mono text-[var(--text-main)] mb-1 leading-none group-hover:text-[var(--primary)] transition-colors">
                    {(result.simulated_return * 100).toFixed(1)}%
                  </div>
                  <span className={`text-[12px] font-mono font-bold ${result.return_delta >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]'}`}>
                    {result.return_delta >= 0 ? '+' : ''}{(result.return_delta * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-[20px] bg-background rounded-[8px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors flex flex-col items-center justify-center text-center group">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">Portfolio Risk (Vol)</span>
                  <div className="text-[24px] font-extrabold font-mono text-[var(--text-main)] mb-1 leading-none group-hover:text-[var(--primary)] transition-colors">
                    {(result.simulated_risk * 100).toFixed(1)}%
                  </div>
                  <span className={`text-[12px] font-mono font-bold ${result.risk_delta <= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]'}`}>
                    {result.risk_delta >= 0 ? '+' : ''}{(result.risk_delta * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-[20px] bg-background rounded-[8px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors flex flex-col items-center justify-center text-center group">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">Sharpe Ratio</span>
                  <div className="text-[24px] font-extrabold font-mono text-[var(--secondary)] mb-1 leading-none drop-shadow-[0_0_5px_rgba(76,139,255,0.2)]">
                    {result.simulated_sharpe}
                  </div>
                  <span className={`text-[12px] font-mono font-bold ${result.sharpe_delta >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]'}`}>
                    {result.sharpe_delta >= 0 ? '+' : ''}{result.sharpe_delta}
                  </span>
                </div>

                <div className="p-[20px] bg-background rounded-[8px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors flex flex-col items-center justify-center text-center group">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] mb-2">Diversification Δ</span>
                  <div className="text-[24px] font-extrabold font-mono text-[#a855f7] mb-1 leading-none drop-shadow-[0_0_5px_rgba(168,85,247,0.2)]">
                    +{(result.diversification_delta * 100).toFixed(1)}%
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">Improved</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="inst-card p-[60px] text-center flex-1 flex flex-col items-center justify-center border-[var(--border-color)] bg-[radial-gradient(ellipse_at_center,rgba(76,139,255,0.05)_0%,rgba(0,0,0,0)_60%)] relative">
              <BarChart3 className="w-16 h-16 text-[var(--secondary)] opacity-50 mb-4" />
              <p className="text-[18px] font-bold font-heading text-[var(--text-main)] mb-2">Ready to Simulate</p>
              <p className="text-[13px] font-mono text-[var(--text-muted)] max-w-md">Select your source asset, target asset, and percentage to evaluate candidate portfolio impact without executing trades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulatorPage;
