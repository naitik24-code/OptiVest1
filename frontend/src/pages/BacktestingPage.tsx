import React, { useState, useEffect } from 'react';
import { FlaskConical, Play, RefreshCw, BarChart3, Trophy, TrendingUp } from 'lucide-react';

const PERIODS    = ['1M','3M','6M','1Y'];
const ASSETS     = ['AAPL','MSFT','GOOGL','AMZN','NVDA'];
const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

const MetricPill: React.FC<{label: string; value: string | number; color?: string}> = ({label, value, color='text-[var(--text-main)]'}) => (
  <div className="bg-background rounded-[10px] p-[16px] text-center border border-[var(--border-color)]">
    <div className={`text-[22px] font-bold font-mono ${color}`}>{value}</div>
    <div className="text-[11px] uppercase font-bold text-[var(--text-muted)] mt-[6px] tracking-wider font-mono">{label}</div>
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--primary)] uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" /><span>Module 9 &bull; Backtesting Engine</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">Backtesting Engine</h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">Historical simulation of model predictions vs actuals. 1M / 3M / 6M / 1Y periods.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="inst-card p-[20px]">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] mb-[8px] tracking-wider block">Asset</label>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="w-[140px] bg-background border border-[var(--border-color)] rounded-[8px] p-[10px_14px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none cursor-pointer">
              {ASSETS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-mono font-bold uppercase text-[var(--text-muted)] mb-[8px] tracking-wider block">Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-[140px] bg-background border border-[var(--border-color)] rounded-[8px] p-[10px_14px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none cursor-pointer">
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={runCompare} disabled={loading} className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[#ff713b] disabled:opacity-50 text-[#08090b] text-[13px] font-bold rounded-[8px] flex items-center gap-2 transition-all cursor-pointer">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Backtest
          </button>
        </div>
      </div>

      {/* Champion Banner */}
      {best && (
        <div className="inst-card p-[24px] bg-gradient-to-r from-[rgba(255,90,31,0.15)] to-transparent border-[rgba(255,90,31,0.3)] shadow-[0_0_20px_rgba(255,90,31,0.05)]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
              <Trophy className="w-12 h-12 text-[var(--primary)] shrink-0 drop-shadow-[0_0_10px_rgba(255,90,31,0.5)]" />
              <div>
                <div className="text-[11px] font-mono font-bold uppercase text-[var(--primary)] mb-1 tracking-wider">🏆 Best Performer &mdash; {period}</div>
                <div className="text-[28px] font-extrabold font-heading text-[var(--text-main)] leading-none">{best.algorithm}</div>
                <div className="text-[13px] font-mono text-[var(--text-muted)] mt-[8px]">
                  Asset: <span className="text-[var(--text-main)] font-bold">{best.asset_symbol}</span> &bull; 
                  Period: <span className="text-[var(--text-main)] font-bold">{best.start_date} &rarr; {best.end_date}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[40px] font-extrabold font-mono text-[var(--primary)] leading-none">{(best.hit_ratio * 100).toFixed(1)}%</div>
              <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mt-[6px]">Hit Ratio</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <MetricPill label="Total Return" value={`${(best.total_return_pct * 100).toFixed(2)}%`} color={best.total_return_pct >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'} />
            <MetricPill label="Ann. Return"  value={`${(best.annualized_return_pct * 100).toFixed(2)}%`} color="text-[var(--secondary)]" />
            <MetricPill label="Sharpe"       value={best.sharpe_ratio.toFixed(3)} color="text-[#a855f7]" />
            <MetricPill label="Max DD"       value={`${(best.max_drawdown_pct * 100).toFixed(2)}%`} color="text-[var(--danger)]" />
            <MetricPill label="RMSE"         value={best.rmse.toFixed(5)} color="text-[#eab308]" />
          </div>
        </div>
      )}

      {/* Algorithm Comparison Table */}
      {comparison.length > 0 && (
        <div className="inst-card p-[24px]">
          <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-color)] pb-3">
            <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-[14px] font-bold font-heading text-[var(--text-main)] tracking-wider">All Algorithms &mdash; {asset} &bull; {period}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono tracking-wider">
                  {['Rank','Algorithm','Hit Ratio','Ann. Return','Sharpe','Max DD','RMSE','MAE','Win Rate','Profit Factor'].map(h => (
                    <th key={h} className="py-3 px-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {comparison.map((r: any, i) => (
                  <tr key={r.algorithm} className={`transition-colors hover:bg-background ${i === 0 ? 'bg-[rgba(255,90,31,0.05)]' : ''}`}>
                    <td className="py-4 px-3 font-bold text-[var(--primary)]">#{i+1}</td>
                    <td className="py-4 px-3 font-bold text-[var(--text-main)]">{r.algorithm}</td>
                    <td className={`py-4 px-3 font-bold ${r.hit_ratio >= 0.60 ? 'text-[var(--success)]' : r.hit_ratio >= 0.55 ? 'text-[#eab308]' : 'text-[var(--danger)]'}`}>{(r.hit_ratio * 100).toFixed(2)}%</td>
                    <td className={`py-4 px-3 ${r.annualized_return_pct >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{(r.annualized_return_pct * 100).toFixed(2)}%</td>
                    <td className="py-4 px-3 text-[#a855f7]">{r.sharpe_ratio.toFixed(3)}</td>
                    <td className="py-4 px-3 text-[var(--danger)]">{(r.max_drawdown_pct * 100).toFixed(2)}%</td>
                    <td className="py-4 px-3 text-[#eab308]">{r.rmse.toFixed(5)}</td>
                    <td className="py-4 px-3 text-[#eab308]">{r.mae.toFixed(5)}</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{(r.win_rate * 100).toFixed(2)}%</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{r.profit_factor.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equity Curve preview for #1 */}
      {best?.equity_curve?.length > 0 && (
        <div className="inst-card p-[24px]">
          <h3 className="text-[14px] font-bold font-heading text-[var(--text-main)] mb-6 border-b border-[var(--border-color)] pb-3 tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--secondary)]" />
            {best.algorithm} &mdash; Equity Curve
          </h3>
          <div className="h-[140px] flex items-end gap-[2px]">
            {(best.equity_curve as number[]).slice(0,50).map((v, i) => {
              const min = Math.min(...best.equity_curve.slice(0,50));
              const max = Math.max(...best.equity_curve.slice(0,50));
              const h = max > min ? ((v - min) / (max - min)) * 100 : 50;
              return (
                <div key={i} className="flex-1 bg-[var(--primary)] opacity-80 rounded-t-[2px] hover:opacity-100 transition-all cursor-crosshair" style={{ height: `${h}%` }} title={`${v.toFixed(4)}`} />
              );
            })}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] mt-[12px] uppercase tracking-wider">
            <span>{best.start_date}</span>
            <span>Equity curve (first 50 ticks)</span>
            <span>{best.end_date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default BacktestingPage;
