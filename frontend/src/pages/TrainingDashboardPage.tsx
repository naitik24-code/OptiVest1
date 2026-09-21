import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Brain, Play, RefreshCw, Zap, CheckCircle, AlertCircle, Loader2, Trophy } from 'lucide-react';

const ALGORITHMS = ['LSTM','GRU','XGBOOST','LIGHTGBM','RANDOM_FOREST','EXTRA_TREES','LINEAR_REGRESSION'];
const HORIZONS   = ['1D','5D','10D','20D','30D'];
const ASSETS     = ['AAPL','MSFT','GOOGL','AMZN','NVDA'];
const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

const STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  PENDING:   { color: 'text-slate-400',  icon: <AlertCircle className="w-3.5 h-3.5" /> },
  QUEUED:    { color: 'text-blue-400',   icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  RUNNING:   { color: 'text-amber-400',  icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
  COMPLETED: { color: 'text-emerald-400',icon: <CheckCircle className="w-3.5 h-3.5" /> },
  FAILED:    { color: 'text-red-400',    icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export const TrainingDashboardPage: React.FC = () => {
  const [asset, setAsset] = useState('AAPL');
  const [horizon, setHorizon] = useState('5D');
  const [algorithm, setAlgorithm] = useState('LSTM');
  const [nHpo, setNHpo] = useState(5);
  const [jobs, setJobs] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainAllLoading, setTrainAllLoading] = useState(false);
  const [lastDispatch, setLastDispatch] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const [dRes, mRes, jRes] = await Promise.all([
        fetch('/api/v1/ai/dashboard', { headers: getH() }),
        fetch('/api/v1/ai/models', { headers: getH() }),
        fetch('/api/v1/ai-infra/training-queue', { headers: getH() }),
      ]);
      if (dRes.ok) setDashboard(await dRes.json());
      if (mRes.ok) setModels(await mRes.json());
      if (jRes.ok) setJobs(await jRes.json());
    } catch (_) {}
  }, []);

  useEffect(() => { loadData(); const t = setInterval(loadData, 15000); return () => clearInterval(t); }, [loadData]);

  const trainSingle = async () => {
    setTrainLoading(true);
    try {
      const r = await fetch(`/api/v1/ai/train?algorithm=${algorithm}&asset_symbol=${asset}&prediction_horizon=${horizon}&n_hpo_trials=${nHpo}`, { method: 'POST', headers: getH() });
      if (r.ok) { const d = await r.json(); setLastDispatch(`Job dispatched: ${d.job_name}`); }
    } catch (_) {}
    setTrainLoading(false);
    setTimeout(loadData, 3000);
  };

  const trainAll = async () => {
    setTrainAllLoading(true);
    try {
      const r = await fetch(`/api/v1/ai/train/all?asset_symbol=${asset}&prediction_horizon=${horizon}`, { method: 'POST', headers: getH() });
      if (r.ok) { const d = await r.json(); setLastDispatch(`${d.total_jobs} jobs dispatched for all algorithms.`); }
    } catch (_) {}
    setTrainAllLoading(false);
    setTimeout(loadData, 3000);
  };

  const electChampion = async () => {
    await fetch('/api/v1/ai/models/elect-champion', { method: 'POST', headers: getH() });
    await loadData();
  };

  const tq = dashboard?.training_queue || {};
  const reg = dashboard?.registered_models || {};

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Brain className="w-4 h-4" /><span>Module 1 · Multi-Model Training Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">Training Dashboard</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Dispatch, monitor, and manage AI model training across all 7 algorithms.</p>
      </div>

      {/* Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {l:'Total Models',   v: reg.total || 0,             c:'text-blue-400'},
            {l:'Active Models',  v: reg.active || 0,            c:'text-emerald-400'},
            {l:'Running Jobs',   v: tq.running || 0,            c:'text-amber-400'},
            {l:'Completed Jobs', v: tq.completed || 0,          c:'text-emerald-400'},
          ].map(item => (
            <Card key={item.l} className="p-4 text-center">
              <div className={`text-3xl font-extrabold font-mono ${item.c}`}>{item.v}</div>
              <div className="text-[9px] uppercase font-bold text-[var(--text-muted)] mt-1">{item.l}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Dispatch Controls */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-2">Dispatch Training Job</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Algorithm</label>
            <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none">
              {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Asset</label>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none">
              {ASSETS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">Horizon</label>
            <select value={horizon} onChange={e => setHorizon(e.target.value)} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none">
              {HORIZONS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1 block">HPO Trials</label>
            <input type="number" min={1} max={50} value={nHpo} onChange={e => setNHpo(Number(e.target.value))} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none" />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <button onClick={trainSingle} disabled={trainLoading} className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2">
              {trainLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Train
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={trainAll} disabled={trainAllLoading} className="px-5 py-2 bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all">
            {trainAllLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Train ALL 7 Algorithms
          </button>
          <button onClick={electChampion} className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Elect Champion
          </button>
          {lastDispatch && <span className="text-xs text-emerald-400 font-mono">{lastDispatch}</span>}
        </div>
      </Card>

      {/* Pipeline Stages */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-2">Training Pipeline</h3>
        <div className="flex items-center gap-1 flex-wrap">
          {['Feature Store','Dataset Build','HPO','Sequences','Training','Walk-Forward','Evaluation','Registry'].map((stage, i, arr) => (
            <React.Fragment key={stage}>
              <div className="px-2.5 py-1 bg-blue-900/30 border border-blue-700/40 rounded text-[10px] font-bold text-blue-300 font-mono">{stage}</div>
              {i < arr.length - 1 && <div className="text-[var(--text-muted)] text-xs">→</div>}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Trained Models */}
      {models.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-color)] flex justify-between items-center">
            <span className="text-sm font-bold text-[var(--text-main)]">Trained Models ({models.length})</span>
            <button onClick={loadData} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                  {['Algorithm','Asset','Horizon','Dir Acc','RMSE','F1','Sharpe','Status','Champion','Trained'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((m: any) => (
                  <tr key={m.id} className={`border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-card)]/40 transition-colors ${m.is_champion ? 'bg-amber-900/10' : ''}`}>
                    <td className="px-3 py-2 font-mono font-bold text-[var(--text-main)]">{m.algorithm}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{m.asset_symbol || '—'}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{m.prediction_horizon}</td>
                    <td className={`px-3 py-2 font-bold ${m.directional_accuracy >= 0.62 ? 'text-emerald-400' : m.directional_accuracy >= 0.55 ? 'text-amber-400' : 'text-red-400'}`}>
                      {m.directional_accuracy != null ? `${(m.directional_accuracy * 100).toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-amber-400">{m.rmse != null ? m.rmse.toFixed(5) : '—'}</td>
                    <td className="px-3 py-2 text-slate-300">{m.f1_score != null ? m.f1_score.toFixed(4) : '—'}</td>
                    <td className="px-3 py-2 text-purple-400">{m.sharpe_ratio != null ? m.sharpe_ratio.toFixed(3) : '—'}</td>
                    <td className={`px-3 py-2 font-bold text-[10px] ${STATUS_MAP[m.status]?.color || 'text-slate-400'}`}>{m.status}</td>
                    <td className="px-3 py-2">{m.is_champion ? <Trophy className="w-4 h-4 text-amber-400" /> : ''}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)] font-mono">{m.trained_at ? new Date(m.trained_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Queue */}
      {jobs.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 border-b border-[var(--border-color)] pb-2">Training Queue ({jobs.length})</h3>
          <div className="space-y-2">
            {jobs.slice(0, 10).map((j: any) => {
              const s = STATUS_MAP[j.status] || STATUS_MAP.PENDING;
              return (
                <div key={j.id} className="flex items-center gap-3 py-1.5 border-b border-[var(--border-color)]/30">
                  <span className={s.color}>{s.icon}</span>
                  <span className="text-xs font-mono text-[var(--text-main)] flex-1 truncate">{j.job_name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{j.algorithm}</span>
                  <div className="w-24 bg-[var(--bg-main)] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{width:`${j.progress_pct || 0}%`}} />
                  </div>
                  <span className={`text-[10px] font-bold ${s.color}`}>{j.status}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
export default TrainingDashboardPage;
