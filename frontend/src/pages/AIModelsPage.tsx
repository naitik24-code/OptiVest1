import React, { useState, useEffect } from 'react';
import { GitCompare, Trophy, RefreshCw } from 'lucide-react';

const ALGORITHMS = ['LSTM','GRU','XGBOOST','LIGHTGBM','RANDOM_FOREST','EXTRA_TREES','LINEAR_REGRESSION'];
const ALGO_COLORS: Record<string,string> = {
  LSTM:'var(--primary)', GRU:'#a855f7', XGBOOST:'#eab308', LIGHTGBM:'var(--success)',
  RANDOM_FOREST:'#ef4444', EXTRA_TREES:'#ec4899', LINEAR_REGRESSION:'#8b8f98',
};

const MiniBar: React.FC<{value: number; max: number; color: string}> = ({value, max, color}) => (
  <div className="w-full bg-background rounded-[4px] h-[6px] overflow-hidden">
    <div className="h-full rounded-[4px] transition-all duration-[1200ms] ease-out" style={{width:`${(value/max)*100}%`, backgroundColor: color}} />
  </div>
);

export const AIModelsPage: React.FC = () => {
  const [comparison, setComparison] = useState<any[]>([]);
  const [wf, setWf] = useState<any>(null);
  const [selectedAlgo, setSelectedAlgo] = useState('LSTM');
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'directional_accuracy'|'rmse'|'sharpe_ratio'|'f1_score'>('directional_accuracy');

  const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

  const load = async () => {
    setLoading(true);
    try {
      const [cRes] = await Promise.all([
        fetch('/api/v1/ai/evaluate/compare/all', { headers: getH() }),
        fetch('/api/v1/ai/models', { headers: getH() }),
      ]);
      if (cRes.ok) { const d = await cRes.json(); setComparison(d.comparison || []); }
    } catch (_) {}
    setLoading(false);
  };

  const loadWalkForward = async (algo: string) => {
    try {
      const r = await fetch(`/api/v1/ai/walk-forward/simulate?algorithm=${algo}&n_folds=5&mode=WALK_FORWARD`, { method: 'POST', headers: getH() });
      if (r.ok) setWf(await r.json());
    } catch (_) {}
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadWalkForward(selectedAlgo); }, [selectedAlgo]);

  const best = comparison[0];
  const maxDA  = Math.max(...comparison.map((m: any) => m.directional_accuracy || 0), 0.01);
  const maxVal = Math.max(...comparison.map((m: any) => m[metric] || 0), 0.01);

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4" /><span>Module 10 &bull; Model Comparison</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">AI Models</h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">Side-by-side comparison of all algorithms. Training curves, feature importance, walk-forward folds.</p>
        </div>
      </div>

      {/* Champion Banner */}
      {best && (
        <div className="inst-card p-[24px] bg-gradient-to-r from-[rgba(255,90,31,0.15)] to-transparent border-[rgba(255,90,31,0.3)] shadow-[0_0_20px_rgba(255,90,31,0.05)]">
          <div className="flex items-center gap-5">
            <Trophy className="w-12 h-12 text-[var(--primary)] shrink-0 drop-shadow-[0_0_10px_rgba(255,90,31,0.5)]" />
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--primary)] mb-1">🏆 Top Performing Algorithm</div>
              <div className="text-[28px] font-extrabold font-heading text-[var(--text-main)] leading-none">{best.algorithm}</div>
              <div className="text-[13px] text-[var(--text-muted)] font-mono mt-[8px]">
                DA: <span className="text-[var(--text-main)] font-bold">{((best.directional_accuracy||0)*100).toFixed(2)}%</span> &bull; 
                RMSE: <span className="text-[var(--text-main)] font-bold">{(best.rmse||0).toFixed(5)}</span> &bull; 
                F1: <span className="text-[var(--text-main)] font-bold">{(best.f1_score||0).toFixed(4)}</span> &bull; 
                Sharpe: <span className="text-[var(--text-main)] font-bold">{(best.sharpe_ratio||0).toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Selector */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[var(--text-muted)] font-bold font-mono uppercase tracking-wider">Compare by:</span>
        <div className="flex items-center gap-1 bg-background border border-[var(--border-color)] rounded-[8px] p-1">
          {(['directional_accuracy','rmse','f1_score','sharpe_ratio'] as const).map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-4 py-1.5 text-[11px] font-bold font-mono rounded-[6px] uppercase tracking-wider transition-all cursor-pointer ${metric === m ? 'bg-[var(--primary)] text-[#08090b]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
              {m.replace(/_/g,' ')}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[11px] font-bold font-mono uppercase tracking-wider text-[var(--text-main)] rounded-[6px] transition-all cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Bar Chart Comparison */}
      {comparison.length > 0 && (
        <div className="inst-card p-[24px]">
          <h3 className="text-[14px] font-bold text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
             <GitCompare className="w-4 h-4 text-[var(--primary)]" />
             Algorithm Comparison &mdash; {metric.replace(/_/g,' ').toUpperCase()}
          </h3>
          <div className="space-y-4">
            {comparison.map((m: any, i) => {
              const val = m[metric] || 0;
              const pct = (val / maxVal) * 100;
              const color = ALGO_COLORS[m.algorithm] || '#8b8f98';
              return (
                <div key={m.algorithm} className="flex items-center gap-4">
                  <div className="w-[140px] text-[13px] font-mono font-bold text-[var(--text-main)] truncate">{m.algorithm}</div>
                  <div className="flex-1 bg-background rounded-[6px] h-[20px] overflow-hidden border border-[var(--border-color)]">
                    <div className="h-full rounded-[4px] flex items-center pl-2 text-[10px] font-bold text-[#08090b] transition-all duration-[1400ms] ease-out"
                         style={{width:`${Math.max(pct,8)}%`, backgroundColor: color}}>
                      {metric === 'directional_accuracy' || metric === 'f1_score' ? `${(val*100).toFixed(1)}%` : val.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] w-[30px] text-right font-bold font-mono">#{i+1}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Metrics Table */}
      {comparison.length > 0 && (
        <div className="inst-card p-[24px]">
          <h3 className="text-[14px] font-bold text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-3">
            Full Metrics Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono tracking-wider">
                  {['Rank','Algorithm','Dir Acc','RMSE','MAE','MAPE','R²','Precision','Recall','F1','Hit Ratio','Sharpe','Latency ms'].map(h => (
                    <th key={h} className="py-3 px-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {comparison.map((m: any) => (
                  <tr key={m.algorithm} className={`hover:bg-background transition-colors ${m.rank===1?'bg-[rgba(255,90,31,0.05)]':''}`}>
                    <td className="py-4 px-3 font-bold text-[var(--primary)]">#{m.rank||'?'}</td>
                    <td className="py-4 px-3 font-bold" style={{color: ALGO_COLORS[m.algorithm]||'#8b8f98'}}>{m.algorithm}</td>
                    <td className={`py-4 px-3 font-bold ${(m.directional_accuracy||0)>=0.62?'text-[var(--success)]':(m.directional_accuracy||0)>=0.55?'text-[#eab308]':'text-[var(--danger)]'}`}>{((m.directional_accuracy||0)*100).toFixed(2)}%</td>
                    <td className="py-4 px-3 text-[#eab308]">{(m.rmse||0).toFixed(5)}</td>
                    <td className="py-4 px-3 text-[#eab308]">{(m.mae||0).toFixed(5)}</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{(m.mape||0).toFixed(2)}%</td>
                    <td className="py-4 px-3 text-[var(--secondary)]">{(m.r_squared||0).toFixed(4)}</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{((m.precision||0)*100).toFixed(1)}%</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{((m.recall||0)*100).toFixed(1)}%</td>
                    <td className="py-4 px-3 text-[#a855f7]">{((m.f1_score||0)*100).toFixed(1)}%</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{((m.hit_ratio||0)*100).toFixed(1)}%</td>
                    <td className="py-4 px-3 text-[var(--success)]">{(m.sharpe_ratio||0).toFixed(3)}</td>
                    <td className="py-4 px-3 text-[var(--text-muted)]">{(m.prediction_latency_ms||0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Walk-Forward */}
      <div className="inst-card p-[24px]">
        <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-3">
          <h3 className="text-[14px] font-bold text-[var(--text-main)]">Walk-Forward Validation</h3>
          <select value={selectedAlgo} onChange={e => setSelectedAlgo(e.target.value)} className="bg-background border border-[var(--border-color)] rounded-[8px] p-[8px_14px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer appearance-none">
            {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        
        {wf?.folds?.length > 0 ? (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                {l:'Mean DA', v:`${((wf.mean?.directional_accuracy||0)*100).toFixed(2)}%`, c:'text-[var(--success)]'},
                {l:'Std DA',  v:`±${((wf.std?.directional_accuracy||0)*100).toFixed(2)}%`,  c:'text-[#eab308]'},
                {l:'Mean Sharpe', v:(wf.mean?.sharpe_ratio||0).toFixed(3), c:'text-[#a855f7]'},
              ].map(item => (
                <div key={item.l} className="bg-background border border-[var(--border-color)] rounded-[10px] p-[16px] text-center">
                  <div className={`text-[24px] font-bold font-mono ${item.c}`}>{item.v}</div>
                  <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-[var(--text-muted)] mt-[4px]">{item.l}</div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              {wf.folds.map((f: any) => (
                <div key={f.fold} className="flex items-center gap-4 text-[13px] border-b border-[var(--border-color)] pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                  <span className="w-[60px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider text-[11px]">Fold {f.fold}</span>
                  <span className="w-[160px] font-mono text-[var(--text-muted)] text-[11px] bg-[var(--surface2)] px-2 py-1 rounded-[4px] border border-[var(--border-color)] text-center">{f.test_start} &rarr; {f.test_end}</span>
                  <div className="flex-1">
                    <MiniBar value={f.directional_accuracy} max={maxDA} color={ALGO_COLORS[selectedAlgo]||'var(--primary)'} />
                  </div>
                  <span className={`w-[60px] text-right font-bold font-mono ${f.directional_accuracy>=0.60?'text-[var(--success)]':'text-[#eab308]'}`}>{(f.directional_accuracy*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] font-mono text-[13px]">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
            Loading walk-forward folds...
          </div>
        )}
      </div>
    </div>
  );
};
export default AIModelsPage;
