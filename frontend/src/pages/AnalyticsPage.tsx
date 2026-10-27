import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, Target } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface HealthData {
  health_score: number;
  diversification_score: number;
  risk_score: number;
  overall_health_rating: string;
  expected_return_annual: number;
  portfolio_volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  beta: number;
  alpha: number;
  asset_concentration?: number;
  sector_concentration?: number;
}

export const AnalyticsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const fetchData = async () => {
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
        const hRes = await fetch(`/api/v1/apde/health/${activePid}`, { headers: getH() });
        if (hRes.ok) {
          setHealth(await hRes.json());
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>OptiVest Engine</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Quantitative Portfolio Analytics
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Historical drawdown statistics, benchmark alpha, and risk-adjusted ratio decomposition.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {!health && !loading ? (
        <div className="inst-card p-12 text-center text-[var(--text-muted)] font-mono">No portfolio data available. Please initialize a portfolio first.</div>
      ) : health ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="inst-card p-[20px]">
              <div className="text-[14px] font-bold text-[var(--text-main)] mb-[2px]">Expected Annual Return</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Forward Looking</div>
              <div className="flex items-baseline gap-2">
                <div className="text-[28px] font-mono font-extrabold text-[var(--success)] leading-none">
                  +{(health.expected_return_annual * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-2 font-mono">
                Alpha vs Benchmark: <span className="text-[var(--success)] font-bold">+{(health.alpha * 100).toFixed(2)}%</span>
              </div>
            </div>

            <div className="inst-card p-[20px]">
              <div className="text-[14px] font-bold text-[var(--text-main)] mb-[2px]">Sharpe Ratio</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Risk-Adjusted Return</div>
              <div className="flex items-end gap-2">
                <div className="text-[28px] font-mono font-extrabold text-[var(--primary)] leading-none">
                  {health.sharpe_ratio}
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] bg-[var(--secondary)]/15 text-[var(--secondary)] border border-[var(--secondary)]/30">
                  Sortino: {health.sortino_ratio}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-2 font-mono">
                Health Rating: <span className="font-bold text-[var(--primary)]">{health.overall_health_rating}</span> ({health.health_score}/100)
              </div>
            </div>

            <div className="inst-card p-[20px]">
              <div className="text-[14px] font-bold text-[var(--text-main)] mb-[2px]">Maximum Drawdown</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Peak-to-Trough Loss</div>
              <div className="flex items-baseline gap-2">
                <div className="text-[28px] font-mono font-extrabold text-[var(--danger)] leading-none">
                  -{(health.max_drawdown_pct * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-2 font-mono">
                Historical stress-test bound
              </div>
            </div>

            <div className="inst-card p-[20px]">
              <div className="text-[14px] font-bold text-[var(--text-main)] mb-[2px]">Beta vs S&P 500</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Market Sensitivity</div>
              <div className="flex items-end gap-2">
                <div className="text-[28px] font-mono font-extrabold text-[var(--text-main)] leading-none">
                  {health.beta.toFixed(2)}
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30">
                  Vol {(health.portfolio_volatility * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-2 font-mono">
                {health.beta < 1 ? "Lower Volatility Than Benchmark" : "Higher Volatility Than Benchmark"}
              </div>
            </div>
          </div>
          
          <div className="inst-card p-[24px]">
            <h3 className="text-[16px] font-bold text-[var(--text-main)] mb-[20px] flex items-center gap-2 font-heading">
              <Target className="w-5 h-5 text-[var(--secondary)]" />
              Dynamic Diversification Map
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-[20px] bg-background rounded-[10px] border border-[var(--border-color)]">
                <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] mb-[8px] tracking-wider">Diversification</div>
                <div className="text-[32px] font-mono font-bold text-[var(--secondary)] leading-none">{health.diversification_score.toFixed(1)}</div>
              </div>
              <div className="p-[20px] bg-background rounded-[10px] border border-[var(--border-color)]">
                <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] mb-[8px] tracking-wider">Risk Score</div>
                <div className="text-[32px] font-mono font-bold text-[var(--danger)] leading-none">{health.risk_score.toFixed(1)}</div>
              </div>
              <div className="p-[20px] bg-background rounded-[10px] border border-[var(--border-color)]">
                <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] mb-[8px] tracking-wider">Asset Conc.</div>
                <div className="text-[32px] font-mono font-bold text-[#eab308] leading-none">{((health.asset_concentration ?? 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="p-[20px] bg-background rounded-[10px] border border-[var(--border-color)]">
                <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] mb-[8px] tracking-wider">Sector Conc.</div>
                <div className="text-[32px] font-mono font-bold text-[#eab308] leading-none">{((health.sector_concentration ?? 0) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="inst-card p-12 flex flex-col justify-center items-center gap-3 text-[var(--text-muted)] font-mono">
           <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
           Loading Portfolio Analytics...
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
