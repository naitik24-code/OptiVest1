import React, { useState, useEffect } from 'react';
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--success)] uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Research &bull; Paper Analytics</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Paper Portfolio Performance &amp; Risk
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Sharpe ratio &bull; Sortino ratio &bull; Volatility &bull; Max drawdown &bull; Win rate analytics
          </p>
        </div>
        <button
          onClick={fetchPerformance}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="inst-card p-[24px] bg-gradient-to-br from-[var(--success)]/10 to-transparent border-l-4 border-l-[var(--success)] shadow-[0_0_15px_rgba(23,217,140,0.05)] relative overflow-hidden group">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">AI Portfolio Sharpe</div>
          <div className="text-[32px] font-extrabold font-mono text-[var(--success)] leading-none mb-[8px] drop-shadow-[0_0_5px_rgba(23,217,140,0.4)]">
            {data?.ai_portfolio_sharpe?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] font-mono font-bold text-[var(--success)] flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Benchmark: {data?.benchmark_sharpe?.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group hover:border-[var(--secondary)]/40 transition-colors">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Sharpe Improvement</div>
          <div className="text-[32px] font-extrabold font-mono text-[var(--secondary)] leading-none mb-[8px] drop-shadow-[0_0_5px_rgba(76,139,255,0.2)]">
            +{((data?.sharpe_improvement_pct || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Over Buy-and-Hold Benchmark</div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group hover:border-[#a855f7]/40 transition-colors">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Risk Reduction</div>
          <div className="text-[32px] font-extrabold font-mono text-[#a855f7] leading-none mb-[8px] drop-shadow-[0_0_5px_rgba(168,85,247,0.2)]">
            -{((data?.risk_reduction_pct || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Downside Risk Ratio</div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group hover:border-[#eab308]/40 transition-colors">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Volatility (Std Dev)</div>
          <div className="text-[32px] font-extrabold font-mono text-[#eab308] leading-none mb-[8px] drop-shadow-[0_0_5px_rgba(234,179,8,0.2)]">
            {((data?.portfolio_volatility || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Return Volatility</div>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="inst-card p-[24px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-4 mb-5">
            <TrendingUp className="w-5 h-5 text-[var(--success)]" />
            Decision Profile
          </h3>
          <div className="space-y-[12px] font-mono text-[13px]">
            <div className="p-[14px] rounded-[6px] bg-background border border-[var(--border-color)] flex justify-between items-center transition-colors hover:border-[var(--primary)]/30">
              <span className="text-[var(--text-muted)] uppercase tracking-wider font-bold text-[11px]">Total APDE Decisions Evaluated</span>
              <span className="font-extrabold text-[var(--text-main)] text-[16px]">{data?.total_decisions || 0}</span>
            </div>
            <div className="p-[14px] rounded-[6px] bg-background border border-[var(--border-color)] flex justify-between items-center transition-colors hover:border-[var(--primary)]/30">
              <span className="text-[var(--text-muted)] uppercase tracking-wider font-bold text-[11px]">Average Win Rate</span>
              <span className="font-extrabold text-[var(--success)] text-[16px]">{((data?.win_rate || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="p-[14px] rounded-[6px] bg-background border border-[var(--border-color)] flex justify-between items-center transition-colors hover:border-[var(--primary)]/30">
              <span className="text-[var(--text-muted)] uppercase tracking-wider font-bold text-[11px]">Decision Accuracy Score</span>
              <span className="font-extrabold text-[var(--success)] text-[16px]">{((data?.decision_accuracy || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="inst-card p-[24px] flex flex-col h-full">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-4 mb-5">
            <ShieldAlert className="w-5 h-5 text-[#eab308]" />
            Empirical Results Summary
          </h3>
          <div className="p-[16px] flex-1 rounded-[8px] bg-background border border-[var(--border-color)] text-[13px] leading-relaxed font-mono relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#eab308]" />
            <p className="text-[var(--text-muted)]">{data?.summary || 'Insufficient data to generate summary.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperPerformancePage;
