import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { BarChart3, TrendingUp, RefreshCw, Zap, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface Benchmark { name: string; bm_return: number; ai_return?: number; alpha: number; ai_sharpe: number | string; bm_sharpe: number | string; }
interface TimelineRow { date: string; ai_portfolio: number | string; sp500: number | string; nifty50: number | string; buy_hold: number | string; }

const AlphaBadge: React.FC<{ alpha: number }> = ({ alpha }) => (
  <span className={`flex items-center gap-0.5 text-xs font-bold font-mono ${alpha > 0 ? 'text-emerald-400' : alpha < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
    {alpha > 0 ? <ArrowUp className="w-3 h-3" /> : alpha < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
    {alpha > 0 ? '+' : ''}{(alpha * 100).toFixed(1)}%
  </span>
);

const ReturnBar: React.FC<{ aiReturn: number; bmReturn: number }> = ({ aiReturn, bmReturn }) => {
  const maxVal = Math.max(Math.abs(aiReturn), Math.abs(bmReturn), 0.01);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-emerald-400">OptiVest AI</span>
          <span className="text-emerald-400 font-bold">{aiReturn >= 0 ? '+' : ''}{(aiReturn * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-700" style={{ width: `${Math.abs(aiReturn) / maxVal * 100}%` }} />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-[var(--text-muted)]">Benchmark</span>
          <span className="text-[var(--text-muted)] font-bold">{bmReturn >= 0 ? '+' : ''}{(bmReturn * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
          <div className="h-full rounded-full bg-[var(--text-muted)] opacity-50 transition-all duration-700" style={{ width: `${Math.abs(bmReturn) / maxVal * 100}%` }} />
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
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics &bull; Alpha vs Benchmarks</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Benchmark Comparison Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            OptiVest AI Portfolio vs S&P 500, Nifty 50, Sensex, Nasdaq, and Buy &amp; Hold
          </p>
        </div>
        <button onClick={fetchBenchmarks} className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Telemetry
        </button>
      </div>

      {/* ── Alpha KPI Banner ── */}
      {benchmarks.length > 0 && (
        <Card className="p-5 bg-gradient-to-r from-emerald-900/15 via-transparent to-transparent border-emerald-700/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-main)]">OptiVest AI Outperforming</div>
                <div className="text-xs text-[var(--text-muted)]">{outperformCount} of {benchmarks.length} benchmarks beaten</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold font-mono text-emerald-400">+{(bestAlpha * 100).toFixed(1)}%</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Best Alpha Generated</div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Benchmark Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {benchmarks.map((b) => (
          <Card key={b.name} className={`p-5 space-y-3 border-t-2 ${(b.alpha ?? 0) > 0 ? 'border-t-emerald-500' : 'border-t-red-500'}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[var(--text-main)]">{b.name}</div>
              <AlphaBadge alpha={b.alpha ?? 0} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <div className="text-[var(--text-muted)]">AI Sharpe</div>
                <div className="font-mono font-bold text-emerald-400">{b.ai_sharpe}</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">BM Sharpe</div>
                <div className="font-mono font-bold text-[var(--text-muted)]">{b.bm_sharpe}</div>
              </div>
            </div>
            <ReturnBar aiReturn={b.ai_return ?? (b.bm_return + (b.alpha ?? 0))} bmReturn={b.bm_return ?? 0} />
          </Card>
        ))}
      </div>

      {/* ── Timeline Comparison Table ── */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span>Cumulative Return Trajectory (Indexed to 100.0)</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px]">
                <th className="pb-3 pr-4">Quarter</th>
                <th className="pb-3 pr-4 text-emerald-400">OptiVest AI</th>
                <th className="pb-3 pr-4">S&P 500</th>
                <th className="pb-3 pr-4">Nifty 50</th>
                <th className="pb-3">Buy &amp; Hold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {timeline.map((row) => {
                const ai = parseFloat(String(row.ai_portfolio));
                const sp = parseFloat(String(row.sp500));
                const isLeading = ai > sp;
                return (
                  <tr key={row.date} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="py-3 pr-4 font-bold text-[var(--text-main)]">{row.date}</td>
                    <td className={`py-3 pr-4 font-bold ${isLeading ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
                      {row.ai_portfolio}
                    </td>
                    <td className="py-3 pr-4 text-[var(--text-muted)]">{row.sp500}</td>
                    <td className="py-3 pr-4 text-[var(--text-muted)]">{row.nifty50}</td>
                    <td className="py-3 text-[var(--text-muted)]">{row.buy_hold}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BenchmarkDashboardPage;
