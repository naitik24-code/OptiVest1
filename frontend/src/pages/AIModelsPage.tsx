import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { GitCompare, Trophy, RefreshCw } from 'lucide-react';

const ALGORITHMS = ['LSTM','GRU','XGBOOST','LIGHTGBM','RANDOM_FOREST','EXTRA_TREES','LINEAR_REGRESSION'];
const ALGO_COLORS: Record<string,string> = {
  LSTM:'#3b82f6', GRU:'#8b5cf6', XGBOOST:'#f59e0b', LIGHTGBM:'#10b981',
  RANDOM_FOREST:'#ef4444', EXTRA_TREES:'#ec4899', LINEAR_REGRESSION:'#6b7280',
};

const MiniBar: React.FC<{value: number; max: number; color: string}> = ({value, max, color}) => (
  <div className="w-full bg-[var(--bg-main)] rounded-full h-1.5 overflow-hidden">
    <div className="h-full rounded-full transition-all duration-500" style={{width:`${(value/max)*100}%`, backgroundColor: color}} />
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
      const [cRes, mRes] = await Promise.all([
        fetch('/api/v1/ai/evaluate/compare/all', { headers: getH() }),
        fetch('/api/v1/ai/models', { headers: getH() }),
      ]);
      if (cRes.ok) { const d = await cRes.json(); setComparison(d.comparison || []); }
      if (mRes.ok) { /* stored but not rendered in table to save space */ }
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
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
          <GitCompare className="w-4 h-4" /><span>Module 10 · Model Comparison Dashboard</span>
        </div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">AI Models</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Side-by-side comparison of all 7 algorithms. Training curves, feature importance, walk-forward folds.</p>
      </div>

      {/* Champion Banner */}
      {best && (
        <Card className="p-5 bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border-amber-700/30">
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase text-amber-400 mb-0.5">🏆 Top Performing Algorithm</div>
              <div className="text-xl font-extrabold text-[var(--text-main)]">{best.algorithm}</div>
              <div className="text-xs text-[var(--text-muted)]">
                DA: {((best.directional_accuracy||0)*100).toFixed(2)}%  ·  
                RMSE: {(best.rmse||0).toFixed(5)}  ·  
                F1: {(best.f1_score||0).toFixed(4)}  ·  
                Sharpe: {(best.sharpe_ratio||0).toFixed(3)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Metric Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)] font-bold uppercase">Compare by:</span>
        {(['directional_accuracy','rmse','f1_score','sharpe_ratio'] as const).map(m => (
          <button key={m} onClick={() => setMetric(m)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all ${metric === m ? 'bg-[#2563EB] text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}>
            {m.replace(/_/g,' ')}
          </button>
        ))}
        <button onClick={load} disabled={loading} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-main)]">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Bar Chart Comparison */}
      {comparison.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-2">Algorithm Comparison — {metric.replace(/_/g,' ').toUpperCase()}</h3>
          <div className="space-y-3">
            {comparison.map((m: any, i) => {
              const val = m[metric] || 0;
              const pct = (val / maxVal) * 100;
              const color = ALGO_COLORS[m.algorithm] || '#6b7280';
              return (
                <div key={m.algorithm} className="flex items-center gap-3">
                  <div className="w-36 text-xs font-mono font-bold text-[var(--text-main)] truncate">{m.algorithm}</div>
                  <div className="flex-1 bg-[var(--bg-main)] rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full flex items-center pl-2 text-[9px] font-bold text-white transition-all duration-700"
                         style={{width:`${Math.max(pct,8)}%`, backgroundColor: color}}>
                      {metric === 'directional_accuracy' || metric === 'f1_score' ? `${(val*100).toFixed(1)}%` : val.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] w-8 text-right font-bold">#{i+1}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Full Metrics Table */}
      {comparison.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-color)]">
            <span className="text-sm font-bold text-[var(--text-main)]">Full Metrics Comparison</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                  {['Rank','Algorithm','Dir Acc','RMSE','MAE','MAPE','R²','Precision','Recall','F1','Hit Ratio','Sharpe','Latency ms'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((m: any) => (
                  <tr key={m.algorithm} className={`border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-card)]/40 ${m.rank===1?'bg-amber-900/10':''}`}>
                    <td className="px-3 py-2 font-bold text-amber-400">#{m.rank||'?'}</td>
                    <td className="px-3 py-2 font-mono font-bold" style={{color: ALGO_COLORS[m.algorithm]||'#aaa'}}>{m.algorithm}</td>
                    <td className={`px-3 py-2 font-bold ${(m.directional_accuracy||0)>=0.62?'text-emerald-400':(m.directional_accuracy||0)>=0.55?'text-amber-400':'text-red-400'}`}>{((m.directional_accuracy||0)*100).toFixed(2)}%</td>
                    <td className="px-3 py-2 font-mono text-amber-400">{(m.rmse||0).toFixed(5)}</td>
                    <td className="px-3 py-2 font-mono text-amber-400">{(m.mae||0).toFixed(5)}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{(m.mape||0).toFixed(2)}%</td>
                    <td className="px-3 py-2 text-blue-400">{(m.r_squared||0).toFixed(4)}</td>
                    <td className="px-3 py-2 text-slate-300">{((m.precision||0)*100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-slate-300">{((m.recall||0)*100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-purple-400">{((m.f1_score||0)*100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-slate-300">{((m.hit_ratio||0)*100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-emerald-400">{(m.sharpe_ratio||0).toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono text-[var(--text-muted)]">{(m.prediction_latency_ms||0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Walk-Forward */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-2">
          <h3 className="text-sm font-bold text-[var(--text-main)]">Walk-Forward Validation</h3>
          <select value={selectedAlgo} onChange={e => setSelectedAlgo(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none">
            {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        {wf?.folds?.length > 0 ? (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {l:'Mean DA', v:`${((wf.mean?.directional_accuracy||0)*100).toFixed(2)}%`, c:'text-emerald-400'},
                {l:'Std DA',  v:`±${((wf.std?.directional_accuracy||0)*100).toFixed(2)}%`,  c:'text-amber-400'},
                {l:'Mean Sharpe', v:(wf.mean?.sharpe_ratio||0).toFixed(3), c:'text-purple-400'},
              ].map(item => (
                <div key={item.l} className="bg-[var(--bg-main)] rounded-lg p-3 text-center">
                  <div className={`text-lg font-extrabold font-mono ${item.c}`}>{item.v}</div>
                  <div className="text-[9px] uppercase font-bold text-[var(--text-muted)]">{item.l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {wf.folds.map((f: any) => (
                <div key={f.fold} className="flex items-center gap-3 text-xs border-b border-[var(--border-color)]/30 py-1.5">
                  <span className="w-10 font-bold text-[var(--text-muted)]">Fold {f.fold}</span>
                  <span className="w-24 font-mono text-[var(--text-muted)] text-[10px]">{f.test_start}→{f.test_end}</span>
                  <MiniBar value={f.directional_accuracy} max={maxDA} color={ALGO_COLORS[selectedAlgo]||'#3b82f6'} />
                  <span className={`w-14 text-right font-bold ${f.directional_accuracy>=0.60?'text-emerald-400':'text-amber-400'}`}>{(f.directional_accuracy*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div className="text-xs text-[var(--text-muted)] py-4 text-center">Loading walk-forward folds…</div>}
      </Card>
    </div>
  );
};
export default AIModelsPage;
