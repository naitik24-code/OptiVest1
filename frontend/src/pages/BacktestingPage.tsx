import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { FlaskConical, Play, RefreshCw, BarChart3 } from 'lucide-react';

const PERIODS    = ['1M','3M','6M','1Y'];
const ASSETS     = ['AAPL','MSFT','GOOGL','AMZN','NVDA'];
const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

const MetricPill: React.FC<{label: string; value: string | number; color?: string}> = ({label, value, color='text-[var(--text-main)]'}) => (
  <div className="bg-[var(--bg-main)] rounded-lg p-3 text-center border border-[var(--border-color)]">
    <div className={`text-lg font-extrabold font-mono ${color}`}>{value}</div>
    <div className="text-[9px] uppercase font-bold text-[var(--text-muted)] mt-0.5">{label}</div>
  </div>
);

export const BacktestingPage: React.FC = () => {
  const [asset, setAsset] = useState('AAPL');
  const [period, setPeriod] = useState('1Y');
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runCompare = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/ai/backtest/compare/algorithms?asset_symbol=${asset}&period=${period}`, { headers: getH() });
      if (r.ok) { const d = await r.json(); setComparison(d.results || []); }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { runCompare(); }, []);

  const best = comparison[0];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider mb-1">
          <FlaskConical className="w-4 h-4" /><span>Module 9 · Backtesting Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">Backtesting Engine</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Historical simulation of model predictions vs actuals. 1M / 3M / 6M / 1Y / 5Y periods.</p>
      </div>

      {/* Controls */}
      <Card className="p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Asset</label>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none">
              {ASSETS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none">
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={runCompare} disabled={loading} className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run Backtest
          </button>
        </div>
      </Card>

      {/* Champion Banner */}
      {best && (
        <Card className="p-5 bg-gradient-to-r from-orange-900/20 to-amber-900/10 border-orange-700/30">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] font-bold uppercase text-orange-400 mb-1">🏆 Best Performer — {period}</div>
              <div className="text-xl font-extrabold text-[var(--text-main)]">{best.algorithm}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Asset: {best.asset_symbol} · Period: {best.start_date} → {best.end_date}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold font-mono text-orange-400">{(best.hit_ratio * 100).toFixed(1)}%</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Hit Ratio</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            <MetricPill label="Total Return" value={`${(best.total_return_pct * 100).toFixed(2)}%`} color={best.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <MetricPill label="Ann. Return"  value={`${(best.annualized_return_pct * 100).toFixed(2)}%`} color="text-blue-400" />
            <MetricPill label="Sharpe"       value={best.sharpe_ratio.toFixed(3)} color="text-purple-400" />
            <MetricPill label="Max DD"       value={`${(best.max_drawdown_pct * 100).toFixed(2)}%`} color="text-red-400" />
            <MetricPill label="RMSE"         value={best.rmse.toFixed(5)} color="text-amber-400" />
          </div>
        </Card>
      )}

      {/* Algorithm Comparison Table */}
      {comparison.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-[var(--text-main)]">All Algorithms — {asset} · {period}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                  {['Rank','Algorithm','Hit Ratio','Ann. Return','Sharpe','Max DD','RMSE','MAE','Win Rate','Profit Factor'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((r: any, i) => (
                  <tr key={r.algorithm} className={`border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-card)]/40 transition-colors ${i === 0 ? 'bg-orange-900/10' : ''}`}>
                    <td className="px-3 py-2 font-bold text-[var(--text-muted)]">#{i+1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-[var(--text-main)]">{r.algorithm}</td>
                    <td className={`px-3 py-2 font-bold ${r.hit_ratio >= 0.60 ? 'text-emerald-400' : r.hit_ratio >= 0.55 ? 'text-amber-400' : 'text-red-400'}`}>{(r.hit_ratio * 100).toFixed(2)}%</td>
                    <td className={`px-3 py-2 font-mono ${r.annualized_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(r.annualized_return_pct * 100).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-purple-400">{r.sharpe_ratio.toFixed(3)}</td>
                    <td className="px-3 py-2 text-red-400">{(r.max_drawdown_pct * 100).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-amber-400 font-mono">{r.rmse.toFixed(5)}</td>
                    <td className="px-3 py-2 text-amber-400 font-mono">{r.mae.toFixed(5)}</td>
                    <td className="px-3 py-2 text-slate-300">{(r.win_rate * 100).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-slate-300">{r.profit_factor.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Equity Curve preview for #1 */}
      {best?.equity_curve?.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-2">
            {best.algorithm} — Equity Curve
          </h3>
          <div className="h-24 flex items-end gap-0.5">
            {(best.equity_curve as number[]).slice(0,50).map((v, i) => {
              const min = Math.min(...best.equity_curve.slice(0,50));
              const max = Math.max(...best.equity_curve.slice(0,50));
              const h = max > min ? ((v - min) / (max - min)) * 100 : 50;
              return (
                <div key={i} className="flex-1 bg-orange-500/70 rounded-sm hover:bg-orange-400 transition-colors" style={{ height: `${h}%` }} title={`${v.toFixed(4)}`} />
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1">
            <span>{best.start_date}</span>
            <span>Equity curve (first 50 points)</span>
            <span>{best.end_date}</span>
          </div>
        </Card>
      )}
    </div>
  );
};
export default BacktestingPage;
