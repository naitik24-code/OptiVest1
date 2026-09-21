import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Quantitative Portfolio Analytics
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Historical drawdown statistics, benchmark alpha, and risk-adjusted ratio decomposition.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-3.5 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!health && !loading ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">No portfolio data available.</Card>
      ) : health ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title="Expected Annual Return" subtitle="Forward Looking">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-mono font-bold text-[#16A34A]">
                  +{(health.expected_return_annual * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Alpha vs Benchmark: <span className="text-[#16A34A] font-bold">+{(health.alpha * 100).toFixed(2)}%</span>
              </div>
            </Card>

            <Card title="Sharpe Ratio" subtitle="Risk-Adjusted Return">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-mono font-bold text-[var(--text-main)]">
                  {health.sharpe_ratio}
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0EA5E9]/15 text-[#0EA5E9]">
                  Sortino: {health.sortino_ratio}
                </span>
              </div>
              <div className="text-[11px] text-[#0EA5E9] mt-1">
                Health Rating: <span className="font-bold">{health.overall_health_rating}</span> ({health.health_score}/100)
              </div>
            </Card>

            <Card title="Maximum Drawdown" subtitle="Peak-to-Trough Loss">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-mono font-bold text-[#DC2626]">
                  -{(health.max_drawdown_pct * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Historical stress-test bound
              </div>
            </Card>

            <Card title="Beta vs S&P 500" subtitle="Market Sensitivity">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-mono font-bold text-[var(--text-main)]">
                  {health.beta.toFixed(2)}
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#16A34A]/15 text-[#16A34A]">
                  Vol {(health.portfolio_volatility * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                {health.beta < 1 ? "Lower Volatility Than Benchmark" : "Higher Volatility Than Benchmark"}
              </div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Dynamic Diversification Map
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                <div className="text-sm text-[var(--text-muted)] mb-1">Diversification Score</div>
                <div className="text-2xl font-bold text-indigo-400">{health.diversification_score.toFixed(1)}</div>
              </div>
              <div className="p-4 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                <div className="text-sm text-[var(--text-muted)] mb-1">Risk Score</div>
                <div className="text-2xl font-bold text-red-400">{health.risk_score.toFixed(1)}</div>
              </div>
              <div className="p-4 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                <div className="text-sm text-[var(--text-muted)] mb-1">Asset Conc.</div>
                <div className="text-2xl font-bold text-amber-400">{((health.asset_concentration ?? 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="p-4 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                <div className="text-sm text-[var(--text-muted)] mb-1">Sector Conc.</div>
                <div className="text-2xl font-bold text-amber-400">{((health.sector_concentration ?? 0) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
};
