import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { BarChart3, TrendingUp, ShieldAlert, ArrowUpRight, RefreshCw } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

export const PaperPerformancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/paper-trading/research-analytics', { headers: getH() });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Paper Portfolio Performance & Risk Analytics
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Sharpe ratio • Sortino ratio • Volatility • Max drawdown • Win rate analytics
          </p>
        </div>
        <button
          onClick={fetchPerformance}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-950/20 to-[var(--bg-card)] border-emerald-900/30">
          <div className="text-xs text-[var(--text-muted)]">AI Portfolio Sharpe</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {data?.ai_portfolio_sharpe?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Benchmark: {data?.benchmark_sharpe?.toFixed(2) || '0.00'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Sharpe Improvement</div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-1">
            +{((data?.sharpe_improvement_pct || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Over Buy-and-Hold Benchmark</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Risk Reduction</div>
          <div className="text-2xl font-mono font-bold text-purple-400 mt-1">
            -{((data?.risk_reduction_pct || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Downside Risk Ratio</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Volatility (Std Dev)</div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {((data?.portfolio_volatility || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Return Volatility</div>
        </Card>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Decision Profile
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex justify-between items-center">
              <span>Total APDE Decisions Evaluated</span>
              <span className="font-bold text-[var(--text-main)]">{data?.total_decisions || 0}</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex justify-between items-center">
              <span>Average Win Rate</span>
              <span className="font-bold text-emerald-400">{((data?.win_rate || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex justify-between items-center">
              <span>Decision Accuracy Score</span>
              <span className="font-bold text-emerald-400">{((data?.decision_accuracy || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Empirical Results Summary
          </h3>
          <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs leading-relaxed font-mono">
            <p className="text-[var(--text-main)]">{data?.summary || 'Insufficient data to generate summary.'}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
