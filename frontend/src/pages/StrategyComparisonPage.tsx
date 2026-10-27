import React, { useState, useEffect } from 'react';
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
  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-[var(--border-color)]">
    <div
      className={`h-full rounded-full transition-all duration-700 ${isAI ? 'bg-[var(--primary)] shadow-[0_0_8px_rgba(255,90,31,0.6)]' : 'bg-[var(--text-muted)] opacity-50'}`}
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#a855f7] uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Analytics &bull; Long-Term Strategy Simulator</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Strategy Comparison Engine
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            OptiVest AI vs Buy &amp; Hold vs Equal Weight vs Sector Allocation vs Random Strategy
          </p>
        </div>
        <div className="flex items-center gap-1 bg-background border border-[var(--border-color)] p-1 rounded-[8px]">
          {['1Y', '3Y', '5Y', '10Y'].map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-[16px] py-[8px] text-[13px] font-mono font-bold uppercase tracking-wider rounded-[6px] transition-all cursor-pointer ${
                horizon === h ? 'bg-[#a855f7] text-[#050608] shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface2)]/50'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Strategy Highlight ── */}
      {aiStrategy && (
        <div className="inst-card p-[32px] bg-gradient-to-r from-[#a855f7]/10 via-[#050608] to-[#050608] border-l-4 border-l-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-[250px] h-[250px] bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,0.15)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-[24px] relative z-10">
            <div className="flex items-center gap-[16px]">
              <div className="w-[60px] h-[60px] rounded-[12px] bg-[#a855f7]/10 border border-[#a855f7]/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <TrendingUp className="w-8 h-8 text-[#a855f7]" />
              </div>
              <div>
                <div className="text-[20px] font-bold font-heading text-[#a855f7] uppercase tracking-wider drop-shadow-sm">{aiStrategy.name}</div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] mt-1">Top strategy over {horizon} horizon</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-[32px]">
              <div className="text-center">
                <div className={`text-[32px] font-extrabold font-mono leading-none mb-1 ${(aiStrategy.return ?? 0) >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'}`}>
                  {(aiStrategy.return ?? 0) >= 0 ? '+' : ''}{((aiStrategy.return ?? 0) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">Ann. Return</div>
              </div>
              <div className="text-center">
                <div className="text-[32px] font-extrabold font-mono text-[var(--primary)] leading-none mb-1 drop-shadow-[0_0_5px_rgba(255,90,31,0.3)]">{aiStrategy.sharpe}</div>
                <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">Sharpe Ratio</div>
              </div>
              <div className="text-center">
                <div className="text-[32px] font-extrabold font-mono text-[#eab308] leading-none mb-1 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]">
                  {((aiStrategy.win_rate ?? 0) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">Win Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Strategy Cards ── */}
      {strategies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {strategies.map((s) => {
            const isAI = s.name.includes('OptiVest');
            const ret = s.return ?? 0;
            const sharpe = parseFloat(String(s.sharpe ?? '0'));
            return (
              <div key={s.name} className={`inst-card p-[24px] flex flex-col justify-between transition-colors hover:border-[var(--primary)]/30 border-t-4 ${isAI ? 'border-t-[#a855f7]' : 'border-t-[var(--border-color)]'}`}>
                <div className="flex items-start justify-between gap-4 mb-[24px]">
                  <h3 className={`text-[15px] font-bold font-heading uppercase tracking-wider leading-snug m-0 ${isAI ? 'text-[#a855f7] drop-shadow-[0_0_5px_rgba(168,85,247,0.4)]' : 'text-[var(--text-main)]'}`}>
                    {s.name}
                  </h3>
                  <span className={`flex items-center gap-1 text-[16px] font-extrabold font-mono shrink-0 ${ret >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]'}`}>
                    {ret >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {ret >= 0 ? '+' : ''}{(ret * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-[16px] mb-[24px]">
                  <div className="bg-background border border-[var(--border-color)] rounded-[6px] p-[12px] text-center">
                    <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">Sharpe</div>
                    <div className={`font-mono font-extrabold text-[18px] leading-none ${isAI ? 'text-[var(--primary)] drop-shadow-[0_0_5px_rgba(255,90,31,0.2)]' : 'text-[var(--text-main)]'}`}>{s.sharpe}</div>
                  </div>
                  <div className="bg-background border border-[var(--border-color)] rounded-[6px] p-[12px] text-center">
                    <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">Max Drawdown</div>
                    <div className="font-mono font-extrabold text-[18px] leading-none text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]">-{((s.drawdown ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-background border border-[var(--border-color)] rounded-[6px] p-[12px] text-center">
                    <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">Volatility</div>
                    <div className="font-mono font-extrabold text-[18px] leading-none text-[var(--text-muted)]">{((s.volatility ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-background border border-[var(--border-color)] rounded-[6px] p-[12px] text-center">
                    <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1">Win Rate</div>
                    <div className="font-mono font-extrabold text-[18px] leading-none text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.2)]">{((s.win_rate ?? 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>

                {/* Visual bars */}
                <div className="space-y-[12px] pt-[16px] border-t border-[var(--border-color)]">
                  <div className="flex justify-between text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    <span>Return</span><span>Sharpe</span><span>Win</span>
                  </div>
                  <div className="flex gap-2">
                    <MetricBar value={ret} max={maxReturn} isAI={isAI} />
                    <MetricBar value={sharpe} max={maxSharpe} isAI={isAI} />
                    <MetricBar value={s.win_rate ?? 0} max={maxWinRate} isAI={isAI} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full Comparison Table ── */}
      <div className="inst-card p-[32px]">
        <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[20px]">
          <Sliders className="w-5 h-5 text-[#a855f7]" />
          Strategy Performance Matrix ({horizon} Horizon)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[13px]">
            <thead className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)] bg-background/50 border-b border-[var(--border-color)]">
              <tr>
                <th className="py-4 px-4 border-b border-[var(--border-color)]">Strategy</th>
                <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Ann. Return</th>
                <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Volatility</th>
                <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Sharpe</th>
                <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Max Drawdown</th>
                <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {strategies.map((s) => {
                const isAI = s.name.includes('OptiVest');
                return (
                  <tr key={s.name} className={`${isAI ? 'bg-[#a855f7]/5 hover:bg-[#a855f7]/10' : 'hover:bg-background'} transition-colors`}>
                    <td className={`py-4 px-4 font-bold font-heading text-[14px] uppercase tracking-wider ${isAI ? 'text-[#a855f7] drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]' : 'text-[var(--text-main)]'}`}>{s.name}</td>
                    <td className={`py-4 px-4 text-right font-extrabold ${isAI ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--text-main)]'}`}>
                      {(s.return ?? 0) >= 0 ? '+' : ''}{((s.return ?? 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[var(--text-muted)]">{((s.volatility ?? 0) * 100).toFixed(1)}%</td>
                    <td className={`py-4 px-4 text-right font-extrabold ${isAI ? 'text-[var(--primary)] drop-shadow-[0_0_5px_rgba(255,90,31,0.3)]' : 'text-[var(--text-main)]'}`}>{s.sharpe}</td>
                    <td className="py-4 px-4 text-right font-bold text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]">-{((s.drawdown ?? 0) * 100).toFixed(1)}%</td>
                    <td className="py-4 px-4 text-right font-bold text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.2)]">{((s.win_rate ?? 0) * 100).toFixed(1)}%</td>
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

export default StrategyComparisonPage;
