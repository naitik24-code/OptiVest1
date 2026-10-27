import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, RefreshCw, Zap, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface Benchmark { name: string; bm_return: number; ai_return?: number; alpha: number; ai_sharpe: number | string; bm_sharpe: number | string; }
interface TimelineRow { date: string; ai_portfolio: number | string; sp500: number | string; nifty50: number | string; buy_hold: number | string; }

const AlphaBadge: React.FC<{ alpha: number }> = ({ alpha }) => (
  <span className={`flex items-center gap-1 text-[13px] font-bold font-mono ${alpha > 0 ? 'text-[var(--success)]' : alpha < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
    {alpha > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : alpha < 0 ? <ArrowDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
    {alpha > 0 ? '+' : ''}{(alpha * 100).toFixed(1)}%
  </span>
);

const ReturnBar: React.FC<{ aiReturn: number; bmReturn: number }> = ({ aiReturn, bmReturn }) => {
  const maxVal = Math.max(Math.abs(aiReturn), Math.abs(bmReturn), 0.01);
  return (
    <div className="mt-[16px] space-y-[12px]">
      <div className="space-y-[6px]">
        <div className="flex justify-between text-[11px] font-mono tracking-wider">
          <span className="text-[var(--primary)] uppercase font-bold">OptiVest AI</span>
          <span className="text-[var(--primary)] font-bold">{aiReturn >= 0 ? '+' : ''}{(aiReturn * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-[6px] bg-background rounded-[4px] overflow-hidden border border-[var(--border-color)]">
          <div className="h-full rounded-[4px] bg-[var(--primary)] transition-all duration-[1200ms] ease-out" style={{ width: `${Math.abs(aiReturn) / maxVal * 100}%` }} />
        </div>
      </div>
      <div className="space-y-[6px]">
        <div className="flex justify-between text-[11px] font-mono tracking-wider">
          <span className="text-[var(--text-muted)] uppercase font-bold">Benchmark</span>
          <span className="text-[var(--text-muted)] font-bold">{bmReturn >= 0 ? '+' : ''}{(bmReturn * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-[6px] bg-background rounded-[4px] overflow-hidden border border-[var(--border-color)]">
          <div className="h-full rounded-[4px] bg-[var(--surface2)] border border-[var(--border-color)] transition-all duration-[1200ms] ease-out" style={{ width: `${Math.abs(bmReturn) / maxVal * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

export const BenchmarkDashboardPage: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBenchmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/research-validation/run-benchmark', { method: 'POST', headers: getH() });
      if (res.ok) {
        const d = await res.json();
        setBenchmarks(d.benchmarks || []);
        setTimeline(d.timeline_series || []);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchBenchmarks(); }, []);

  const bestAlpha = benchmarks.length ? Math.max(...benchmarks.map((b) => b.alpha ?? 0)) : 0;
  const outperformCount = benchmarks.filter((b) => (b.alpha ?? 0) > 0).length;

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics &bull; Alpha vs Benchmarks</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Benchmark Comparison Dashboard
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            OptiVest AI Portfolio vs S&P 500, Nifty 50, Sensex, Nasdaq, and Buy &amp; Hold
          </p>
        </div>
        <button onClick={fetchBenchmarks} className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          Refresh Telemetry
        </button>
      </div>

      {/* ── Alpha KPI Banner ── */}
      {benchmarks.length > 0 && (
        <div className="inst-card p-[24px] bg-gradient-to-r from-[rgba(23,217,140,0.05)] to-transparent border-[rgba(23,217,140,0.2)] shadow-[0_0_20px_rgba(23,217,140,0.05)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] rounded-[12px] bg-[var(--success)]/10 border border-[var(--success)]/30 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-[var(--success)] drop-shadow-[0_0_8px_rgba(23,217,140,0.5)]" />
              </div>
              <div>
                <div className="text-[18px] font-bold font-heading text-[var(--text-main)]">OptiVest AI Outperforming</div>
                <div className="text-[13px] font-mono text-[var(--text-muted)] mt-[2px]">{outperformCount} of {benchmarks.length} benchmarks beaten</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[40px] font-extrabold font-mono text-[var(--success)] leading-none">+{(bestAlpha * 100).toFixed(1)}%</div>
              <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mt-[6px]">Best Alpha Generated</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Benchmark Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {benchmarks.map((b) => (
          <div key={b.name} className="inst-card p-[20px] relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-full h-[3px] ${(b.alpha ?? 0) > 0 ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
            
            <div className="flex items-center justify-between mb-[16px]">
              <div className="text-[14px] font-bold text-[var(--text-main)]">{b.name}</div>
              <AlphaBadge alpha={b.alpha ?? 0} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
              <div className="bg-background border border-[var(--border-color)] p-[10px] rounded-[6px]">
                <div className="text-[var(--text-muted)] uppercase tracking-wider mb-[4px]">AI Sharpe</div>
                <div className="font-bold text-[var(--primary)] text-[14px]">{b.ai_sharpe}</div>
              </div>
              <div className="bg-background border border-[var(--border-color)] p-[10px] rounded-[6px]">
                <div className="text-[var(--text-muted)] uppercase tracking-wider mb-[4px]">BM Sharpe</div>
                <div className="font-bold text-[var(--text-muted)] text-[14px]">{b.bm_sharpe}</div>
              </div>
            </div>
            
            <ReturnBar aiReturn={b.ai_return ?? (b.bm_return + (b.alpha ?? 0))} bmReturn={b.bm_return ?? 0} />
          </div>
        ))}
      </div>

      {/* ── Timeline Comparison Table ── */}
      <div className="inst-card p-[24px]">
        <h3 className="text-[14px] font-bold font-heading text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4 tracking-wider">
          <TrendingUp className="w-4 h-4 text-[var(--secondary)]" />
          <span>Cumulative Return Trajectory (Indexed to 100.0)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 font-semibold">Quarter</th>
                <th className="py-3 px-3 font-semibold text-[var(--primary)]">OptiVest AI</th>
                <th className="py-3 px-3 font-semibold">S&P 500</th>
                <th className="py-3 px-3 font-semibold">Nifty 50</th>
                <th className="py-3 px-3 font-semibold">Buy &amp; Hold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {timeline.map((row) => {
                const ai = parseFloat(String(row.ai_portfolio));
                const sp = parseFloat(String(row.sp500));
                const isLeading = ai > sp;
                return (
                  <tr key={row.date} className="hover:bg-background transition-colors">
                    <td className="py-4 px-3 font-bold text-[var(--text-main)]">{row.date}</td>
                    <td className={`py-4 px-3 font-bold ${isLeading ? 'text-[var(--success)]' : 'text-[var(--text-main)]'}`}>
                      {row.ai_portfolio}
                    </td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{row.sp500}</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{row.nifty50}</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{row.buy_hold}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkDashboardPage;
