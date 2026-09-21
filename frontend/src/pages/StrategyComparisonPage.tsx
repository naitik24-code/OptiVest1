import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Sliders, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface Strategy {
  name: string;
  return: number;
  volatility: number;
  sharpe: number | string;
  drawdown: number;
  win_rate: number;
}

const MetricBar: React.FC<{ value: number; max: number; isAI: boolean }> = ({ value, max, isAI }) => (
  <div className="w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
    <div
      className={`h-full rounded-full transition-all duration-700 ${isAI ? 'bg-gradient-to-r from-purple-700 to-purple-400' : 'bg-[var(--text-muted)] opacity-40'}`}
      style={{ width: `${Math.min((Math.abs(value) / Math.max(max, 0.001)) * 100, 100)}%` }}
    />
  </div>
);

export const StrategyComparisonPage: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [horizon, setHorizon] = useState('3Y');

  const fetchComparison = async (h: string) => {
    try {
      const res = await fetch(`/api/v1/research-validation/strategy-comparison?time_horizon=${h}`, { headers: getH() });
      if (res.ok) {
        const d = await res.json();
        setStrategies(d.strategies || []);
      }
    } catch (_) {}
  };

  useEffect(() => { fetchComparison(horizon); }, [horizon]);

  const aiStrategy = strategies.find((s) => s.name.includes('OptiVest'));
  const maxReturn = Math.max(...strategies.map((s) => Math.abs(s.return ?? 0)), 0.01);
  const maxSharpe = Math.max(...strategies.map((s) => parseFloat(String(s.sharpe ?? '0'))), 0.01);
  const maxWinRate = Math.max(...strategies.map((s) => Math.abs(s.win_rate ?? 0)), 0.01);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Analytics &bull; Long-Term Strategy Simulator</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Strategy Comparison Engine
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            OptiVest AI vs Buy &amp; Hold vs Equal Weight vs Sector Allocation vs Random Strategy
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] p-1 rounded-xl">
          {['1Y', '3Y', '5Y', '10Y'].map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                horizon === h ? 'bg-purple-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Strategy Highlight ── */}
      {aiStrategy && (
        <Card className="p-5 bg-gradient-to-r from-purple-900/15 via-transparent to-transparent border-purple-700/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-purple-400">{aiStrategy.name}</div>
                <div className="text-xs text-[var(--text-muted)]">Top strategy over {horizon} horizon</div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className={`text-2xl font-extrabold font-mono ${(aiStrategy.return ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(aiStrategy.return ?? 0) >= 0 ? '+' : ''}{((aiStrategy.return ?? 0) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">Ann. Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold font-mono text-purple-400">{aiStrategy.sharpe}</div>
                <div className="text-[10px] text-[var(--text-muted)]">Sharpe Ratio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold font-mono text-sky-400">
                  {((aiStrategy.win_rate ?? 0) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">Win Rate</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Strategy Cards ── */}
      {strategies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((s) => {
            const isAI = s.name.includes('OptiVest');
            const ret = s.return ?? 0;
            const sharpe = parseFloat(String(s.sharpe ?? '0'));
            return (
              <Card key={s.name} className={`p-5 space-y-4 border-l-4 ${isAI ? 'border-l-purple-500' : 'border-l-[var(--border-color)]'}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-xs font-bold leading-snug ${isAI ? 'text-purple-400' : 'text-[var(--text-main)]'}`}>
                    {s.name}
                  </h3>
                  <span className={`flex items-center gap-0.5 text-xs font-bold font-mono shrink-0 ${ret >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ret >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {ret >= 0 ? '+' : ''}{(ret * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-[var(--text-muted)]">Sharpe</div>
                    <div className={`font-mono font-bold text-sm ${isAI ? 'text-purple-300' : 'text-[var(--text-main)]'}`}>{s.sharpe}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-[var(--text-muted)]">Max Drawdown</div>
                    <div className="font-mono font-bold text-sm text-rose-400">-{((s.drawdown ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-[var(--text-muted)]">Volatility</div>
                    <div className="font-mono font-bold text-sm text-[var(--text-muted)]">{((s.volatility ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-[var(--text-muted)]">Win Rate</div>
                    <div className="font-mono font-bold text-sm text-sky-400">{((s.win_rate ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>

                {/* Visual bars */}
                <div className="space-y-1.5 pt-1 border-t border-[var(--border-color)]">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Return</span><span>Sharpe</span><span>Win Rate</span>
                  </div>
                  <div className="flex gap-2">
                    <MetricBar value={ret} max={maxReturn} isAI={isAI} />
                    <MetricBar value={sharpe} max={maxSharpe} isAI={isAI} />
                    <MetricBar value={s.win_rate ?? 0} max={maxWinRate} isAI={isAI} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Full Comparison Table ── */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <Sliders className="w-4 h-4 text-purple-400" />
          Strategy Performance Matrix ({horizon} Horizon)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px]">
                <th className="pb-3 pr-4">Strategy</th>
                <th className="pb-3 pr-4">Ann. Return</th>
                <th className="pb-3 pr-4">Volatility</th>
                <th className="pb-3 pr-4">Sharpe</th>
                <th className="pb-3 pr-4">Max Drawdown</th>
                <th className="pb-3">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {strategies.map((s) => {
                const isAI = s.name.includes('OptiVest');
                return (
                  <tr key={s.name} className={`${isAI ? 'bg-purple-950/20' : 'hover:bg-[var(--bg-main)]/50'} transition-colors`}>
                    <td className={`py-3.5 pr-4 font-bold ${isAI ? 'text-purple-400' : 'text-[var(--text-main)]'}`}>{s.name}</td>
                    <td className={`py-3.5 pr-4 font-bold ${isAI ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>
                      {(s.return ?? 0) >= 0 ? '+' : ''}{((s.return ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 pr-4 text-[var(--text-muted)]">{((s.volatility ?? 0) * 100).toFixed(1)}%</td>
                    <td className={`py-3.5 pr-4 ${isAI ? 'text-purple-300' : 'text-[var(--text-muted)]'}`}>{s.sharpe}</td>
                    <td className="py-3.5 pr-4 text-rose-400">-{((s.drawdown ?? 0) * 100).toFixed(1)}%</td>
                    <td className="py-3.5 text-sky-400">{((s.win_rate ?? 0) * 100).toFixed(1)}%</td>
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

export default StrategyComparisonPage;
