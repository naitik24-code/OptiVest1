import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Play, RefreshCw, Zap, CheckCircle, AlertCircle, Loader2, Trophy, ArrowRight } from 'lucide-react';

const ALGORITHMS = ['LSTM','GRU','XGBOOST','LIGHTGBM','RANDOM_FOREST','EXTRA_TREES','LINEAR_REGRESSION'];
const HORIZONS   = ['1D','5D','10D','20D','30D'];
const ASSETS     = ['AAPL','MSFT','GOOGL','AMZN','NVDA'];
const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

const STATUS_MAP: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:   { color: 'text-[var(--text-muted)]', bg: 'bg-[var(--text-muted)]/10', icon: <AlertCircle className="w-3 h-3" /> },
  QUEUED:    { color: 'text-[var(--secondary)]',  bg: 'bg-[var(--secondary)]/10',  icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  RUNNING:   { color: 'text-[#eab308]',           bg: 'bg-[#eab308]/10',           icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  COMPLETED: { color: 'text-[var(--success)]',    bg: 'bg-[var(--success)]/10',    icon: <CheckCircle className="w-3 h-3" /> },
  FAILED:    { color: 'text-[var(--danger)]',     bg: 'bg-[var(--danger)]/10',     icon: <AlertCircle className="w-3 h-3" /> },
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" />
            <span>Module 1 &bull; Multi-Model Training Engine</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Training Dashboard
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Dispatch, monitor, and manage AI model training across all 7 algorithms.
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
          {[
            { l: 'Total Models',   v: reg.total || 0,     c: 'text-[var(--secondary)] drop-shadow-[0_0_5px_rgba(76,139,255,0.3)]' },
            { l: 'Active Models',  v: reg.active || 0,    c: 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' },
            { l: 'Running Jobs',   v: tq.running || 0,    c: 'text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]' },
            { l: 'Completed Jobs', v: tq.completed || 0,  c: 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' },
          ].map((item) => (
            <div key={item.l} className="inst-card p-[24px] text-center flex flex-col justify-center items-center hover:border-[var(--primary)]/30 transition-colors">
              <div className={`text-[36px] font-extrabold font-mono leading-none mb-2 ${item.c}`}>{item.v}</div>
              <div className="text-[10px] uppercase font-bold font-mono text-[var(--text-muted)] tracking-wider">{item.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Dispatch Controls ── */}
      <div className="inst-card p-[32px] border-l-4 border-l-[var(--secondary)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[radial-gradient(ellipse_at_top_right,rgba(76,139,255,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
        
        <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-2 flex items-center gap-2 relative z-10">
          <Zap className="w-5 h-5 text-[var(--secondary)]" />
          Dispatch Training Job
        </h3>
        <p className="text-[12px] font-mono text-[var(--text-muted)] mb-[24px] pb-[16px] border-b border-[var(--border-color)] relative z-10">
          Manual execution queue injection
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-[16px] mb-[24px] relative z-10">
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Algorithm</label>
            <select value={algorithm} onChange={e => setAlgorithm(e.target.value)} className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer">
              {ALGORITHMS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Asset</label>
            <select value={asset} onChange={e => setAsset(e.target.value)} className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer">
              {ASSETS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Horizon</label>
            <select value={horizon} onChange={e => setHorizon(e.target.value)} className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer">
              {HORIZONS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">HPO Trials</label>
            <input type="number" min={1} max={50} value={nHpo} onChange={e => setNHpo(Number(e.target.value))} className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors" />
          </div>
          <div className="flex flex-col justify-end">
            <button onClick={trainSingle} disabled={trainLoading} className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[#ff7a45] disabled:opacity-50 text-[#050608] text-[13px] font-mono font-bold uppercase tracking-wider py-[14px] rounded-[8px] transition-all shadow-[0_0_15px_rgba(255,90,31,0.3)] cursor-pointer">
              {trainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} Train
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[16px] relative z-10 pt-[16px] border-t border-[var(--border-color)]">
          <button onClick={trainAll} disabled={trainAllLoading} className="px-[20px] py-[12px] bg-background border border-[#a855f7]/50 hover:bg-[#a855f7]/10 hover:border-[#a855f7] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 text-[#a855f7] text-[11px] font-mono font-bold uppercase tracking-wider rounded-[8px] flex items-center gap-2 transition-all cursor-pointer">
            {trainAllLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Train ALL 7 Algorithms
          </button>
          <button onClick={electChampion} className="px-[20px] py-[12px] bg-background border border-[#eab308]/50 hover:bg-[#eab308]/10 hover:border-[#eab308] hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] text-[#eab308] text-[11px] font-mono font-bold uppercase tracking-wider rounded-[8px] flex items-center gap-2 transition-all cursor-pointer">
            <Trophy className="w-4 h-4" /> Elect Champion
          </button>
          {lastDispatch && (
            <span className="text-[12px] text-[var(--success)] font-mono font-bold px-[12px] py-[6px] bg-[var(--success)]/10 rounded-[6px] border border-[var(--success)]/30 shadow-[0_0_10px_rgba(23,217,140,0.1)]">
              {lastDispatch}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* ── Pipeline Stages ── */}
        <div className="lg:col-span-1 inst-card p-[32px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-[24px] border-b border-[var(--border-color)] pb-[16px]">
            Training Pipeline Matrix
          </h3>
          <div className="flex flex-col gap-[12px]">
            {['Feature Store','Dataset Build','HPO','Sequences','Training','Walk-Forward','Evaluation','Registry'].map((stage, i, arr) => (
              <React.Fragment key={stage}>
                <div className="px-[16px] py-[12px] bg-background border border-[var(--secondary)]/30 rounded-[6px] text-[11px] font-bold text-[var(--secondary)] font-mono uppercase tracking-widest text-center shadow-[0_0_10px_rgba(76,139,255,0.05)]">
                  {stage}
                </div>
                {i < arr.length - 1 && (
                  <div className="text-[var(--text-muted)] flex justify-center">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-[24px]">
          {/* ── Queue ── */}
          {jobs.length > 0 && (
            <div className="inst-card p-[32px]">
              <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-[24px] border-b border-[var(--border-color)] pb-[16px]">
                Active Training Queue ({jobs.length})
              </h3>
              <div className="space-y-[12px]">
                {jobs.slice(0, 10).map((j: any) => {
                  const s = STATUS_MAP[j.status] || STATUS_MAP.PENDING;
                  return (
                    <div key={j.id} className="flex items-center gap-[16px] p-[16px] bg-background rounded-[6px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors">
                      <div className={`w-[28px] h-[28px] rounded-[6px] ${s.bg} flex items-center justify-center shrink-0 border border-current opacity-70 ${s.color}`}>
                        {s.icon}
                      </div>
                      <span className="text-[12px] font-bold font-mono text-[var(--text-main)] flex-1 truncate">{j.job_name}</span>
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-[var(--text-muted)] w-[100px]">{j.algorithm}</span>
                      <div className="w-[120px] bg-surface rounded-full h-[6px] overflow-hidden border border-[var(--border-color)] hidden sm:block">
                        <div className="h-full bg-[var(--secondary)] shadow-[0_0_5px_var(--secondary)] rounded-full transition-all" style={{width:`${j.progress_pct || 0}%`}} />
                      </div>
                      <span className={`text-[10px] font-bold font-mono uppercase tracking-widest w-[80px] text-right ${s.color}`}>{j.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Trained Models ── */}
          {models.length > 0 && (
            <div className="inst-card p-[32px] flex-1">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px] mb-[20px]">
                <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] m-0">
                  Model Registry ({models.length})
                </h3>
                <button onClick={loadData} className="text-[var(--text-muted)] hover:text-[var(--secondary)] transition-colors cursor-pointer">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[13px]">
                  <thead className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)] bg-background/50 border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-4 px-4 border-b border-[var(--border-color)]">Algorithm</th>
                      <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Asset</th>
                      <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Dir Acc</th>
                      <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">RMSE</th>
                      <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Sharpe</th>
                      <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {models.slice(0, 10).map((m: any) => (
                      <tr key={m.id} className={`transition-colors ${m.is_champion ? 'bg-[#eab308]/5 hover:bg-[#eab308]/10' : 'hover:bg-background'}`}>
                        <td className="py-3 px-4 font-bold font-heading text-[13px] uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                          {m.is_champion && <Trophy className="w-3.5 h-3.5 text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />}
                          {m.algorithm}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--text-muted)] font-bold">{m.asset_symbol || '—'}</td>
                        <td className={`py-3 px-4 text-right font-extrabold ${m.directional_accuracy >= 0.62 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : m.directional_accuracy >= 0.55 ? 'text-[#eab308]' : 'text-[var(--danger)]'}`}>
                          {m.directional_accuracy != null ? `${(m.directional_accuracy * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--secondary)] font-bold">{m.rmse != null ? m.rmse.toFixed(4) : '—'}</td>
                        <td className="py-3 px-4 text-right text-[#a855f7] font-bold">{m.sharpe_ratio != null ? m.sharpe_ratio.toFixed(2) : '—'}</td>
                        <td className={`py-3 px-4 text-right font-bold text-[10px] uppercase tracking-widest ${STATUS_MAP[m.status]?.color || 'text-[var(--text-muted)]'}`}>{m.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDashboardPage;
