import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import {
  Activity, Cpu, BarChart3, Database, GitBranch,
  Layers, Play, CheckCircle2, RefreshCw, Zap, Terminal, ArrowRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────
interface PipelineStatus {
  pipeline_phase: string;
  worker_engine: string;
  readiness_score: number;
  readiness_status: string;
  feature_pipeline: {
    version: string;
    feature_count: number;
    window_size: number;
    prediction_steps: number;
    model_target: string;
    source_breakdown: Record<string, number>;
  };
  queue_summary: {
    total_jobs: number;
    running: number;
    completed: number;
    queued: number;
    failed: number;
  };
  active_jobs: any[];
  recent_completed: any[];
}

interface FeatureRank {
  rank: number;
  feature_name: string;
  importance_score: number;
  source: string;
  normalized_importance: number;
}

interface FeatureBreakdown {
  total_features: number;
  by_source: Record<string, number>;
  avg_importance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SOURCE_COLORS: Record<string, string> = {
  RAW:           'text-blue-400 bg-blue-900/30 border-blue-700/40',
  TECHNICAL:     'text-emerald-400 bg-emerald-900/30 border-emerald-700/40',
  FUNDAMENTAL:   'text-amber-400 bg-amber-900/30 border-amber-700/40',
  MACRO:         'text-purple-400 bg-purple-900/30 border-purple-700/40',
  SENTIMENT:     'text-pink-400 bg-pink-900/30 border-pink-700/40',
};

const STAGE_ICONS = [
  { label: 'PREPROCESSING',        icon: Database,    color: 'text-blue-400' },
  { label: 'FEATURE ENGINEERING',  icon: Layers,      color: 'text-emerald-400' },
  { label: 'SEQUENCE BUILDING',    icon: GitBranch,   color: 'text-amber-400' },
  { label: 'TRAINING',             icon: Cpu,         color: 'text-purple-400' },
  { label: 'EVALUATING',           icon: BarChart3,   color: 'text-teal-400' },
  { label: 'FINALISING',           icon: CheckCircle2,color: 'text-[#16A34A]' },
];

// ─── Component ─────────────────────────────────────────────────────────────
export const MLOpsDashboardPage: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [features, setFeatures] = useState<FeatureRank[]>([]);
  const [breakdown, setBreakdown] = useState<FeatureBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [jobName, setJobName] = useState('');
  const [algorithm, setAlgorithm] = useState('LSTM');
  const [dispatchMsg, setDispatchMsg] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const h = getAuthHeaders();
    try {
      const [ps, fr, fb] = await Promise.all([
        fetch('/api/v1/ml/pipeline/status', { headers: h }).then(r => r.ok ? r.json() : null),
        fetch('/api/v1/ml/features/ranking?version=v1.0.0', { headers: h }).then(r => r.ok ? r.json() : []),
        fetch('/api/v1/ml/features/source-breakdown?version=v1.0.0', { headers: h }).then(r => r.ok ? r.json() : null),
      ]);
      if (ps) setPipeline(ps);
      if (Array.isArray(fr)) setFeatures(fr.slice(0, 15));
      if (fb) setBreakdown(fb);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName) return;
    setDispatching(true);
    setDispatchMsg('');
    const h = getAuthHeaders();
    try {
      const res = await fetch(
        `/api/v1/ml/jobs/enqueue-and-dispatch?job_name=${encodeURIComponent(jobName)}&algorithm=${algorithm}`,
        { method: 'POST', headers: h }
      );
      const data = res.ok ? await res.json() : null;
      if (data?.dispatch_status === 'DISPATCHED') {
        setDispatchMsg(`✓ Job "${jobName}" dispatched to ML worker pipeline.`);
        setJobName('');
        setTimeout(fetchAll, 1500);
      }
    } catch (_) {}
    setDispatching(false);
  };

  if (loading && !pipeline) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
        <span>Initialising ML Pipeline Telemetry...</span>
      </div>
    );
  }

  const fp = pipeline?.feature_pipeline;
  const qs = pipeline?.queue_summary;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Phase 5 &bull; ML Engine Initiation</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            MLOps Engineering Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Unified ML pipeline control — feature engineering, async worker dispatch, and live training telemetry.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── System Banner ── */}
      {pipeline && (
        <Card className="p-5 bg-gradient-to-r from-purple-900/25 via-blue-950/20 to-transparent border-purple-700/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                <span className="text-sm font-bold text-[var(--text-main)]">
                  {pipeline.readiness_status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Worker Engine: <span className="font-mono text-[#0EA5E9]">{pipeline.worker_engine}</span>
                &ensp;|&ensp;Phase: <span className="font-mono text-purple-400">{pipeline.pipeline_phase.replace(/_/g, ' ')}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-extrabold text-[#16A34A] font-mono">{pipeline.readiness_score}%</div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Infra Readiness</div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Pipeline Stage Flow ── */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#0EA5E9]" />
          <span>Training Pipeline Stages</span>
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          {STAGE_ICONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.label}>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] font-mono font-semibold">
                  <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                  <span className="text-[var(--text-main)]">{s.label}</span>
                </div>
                {i < STAGE_ICONS.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* ── Quick Stats Row ── */}
      {qs && fp && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Total Jobs',   value: qs.total_jobs,      color: 'text-[var(--text-main)]' },
            { label: 'Running',      value: qs.running,         color: 'text-blue-400' },
            { label: 'Completed',    value: qs.completed,       color: 'text-[#16A34A]' },
            { label: 'Queued',       value: qs.queued,          color: 'text-amber-400' },
            { label: 'Failed',       value: qs.failed,          color: 'text-red-400' },
            { label: 'Features',     value: fp.feature_count,   color: 'text-purple-400' },
            { label: 'Window',       value: `${fp.window_size}d`, color: 'text-[#0EA5E9]' },
            { label: 'Pred Steps',   value: `+${fp.prediction_steps}d`, color: 'text-teal-400' },
          ].map((item) => (
            <Card key={item.label} className="p-3 text-center space-y-0.5">
              <div className={`text-lg font-extrabold font-mono ${item.color}`}>{item.value}</div>
              <div className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">{item.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Importance Panel */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Top 15 Features by SHAP Importance (Pipeline v1.0.0)</span>
          </h3>

          {breakdown && (
            <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
              {Object.entries(breakdown.by_source).map(([src, cnt]) => (
                <span key={src} className={`px-2 py-0.5 rounded border ${SOURCE_COLORS[src] || 'text-zinc-400 bg-zinc-900/30 border-zinc-700/40'}`}>
                  {src}: {cnt}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-muted)]">
                Avg Importance: {breakdown.avg_importance}
              </span>
            </div>
          )}

          <div className="space-y-2">
            {features.map((f) => (
              <div key={f.feature_name} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[var(--text-muted)] w-5 text-right shrink-0">{f.rank}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${SOURCE_COLORS[f.source] || 'text-zinc-400 bg-zinc-900/30 border-zinc-700/40'}`}>
                  {f.source.slice(0, 4)}
                </span>
                <span className="text-xs font-mono text-[var(--text-main)] w-40 shrink-0 truncate">
                  {f.feature_name}
                </span>
                <div className="flex-1 bg-[var(--bg-main)] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${f.normalized_importance * 100}%`,
                      background: `linear-gradient(90deg, #2563EB, #16A34A ${f.normalized_importance * 100}%)`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[var(--text-main)] w-10 text-right shrink-0">
                  {f.importance_score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Enqueue & Dispatch Form */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <Play className="w-4 h-4 text-[#2563EB]" />
              <span>Enqueue &amp; Dispatch Job</span>
            </h3>

            <form onSubmit={handleDispatch} className="space-y-3">
              <input
                type="text"
                placeholder="Job name (e.g. LSTM Baseline AAPL)"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              />
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="LSTM">LSTM</option>
                <option value="XGBOOST">XGBOOST</option>
                <option value="TRANSFORMER">TRANSFORMER</option>
              </select>
              <button
                type="submit"
                disabled={dispatching || !jobName}
                className="w-full px-4 py-2 bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                {dispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{dispatching ? 'Dispatching...' : 'Dispatch to Worker'}</span>
              </button>

              {dispatchMsg && (
                <div className="text-[11px] text-[#16A34A] font-semibold bg-emerald-900/20 border border-emerald-700/30 rounded px-3 py-2">
                  {dispatchMsg}
                </div>
              )}
            </form>
          </Card>

          {/* Active Jobs Terminal */}
          <Card className="p-4 bg-slate-950 border-slate-800 font-mono space-y-2">
            <div className="text-slate-200 text-xs font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Jobs</span>
            </div>
            <div className="space-y-1.5 text-[11px] min-h-[60px]">
              {(!pipeline?.active_jobs || pipeline.active_jobs.length === 0) ? (
                <span className="text-slate-600 italic">No jobs currently running.</span>
              ) : (
                pipeline.active_jobs.map((job: any) => (
                  <div key={job.id} className="flex justify-between items-center">
                    <span className="text-slate-300 truncate">{job.job_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-blue-500 h-full animate-pulse" style={{ width: `${job.progress_pct}%` }} />
                      </div>
                      <span className="text-blue-400 font-bold">{job.progress_pct}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recently Completed */}
          {pipeline?.recent_completed && pipeline.recent_completed.length > 0 && (
            <Card className="p-4 space-y-2">
              <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Recently Completed</span>
              </div>
              <div className="space-y-1.5">
                {pipeline.recent_completed.map((job: any) => (
                  <div key={job.id} className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--text-main)] truncate">{job.job_name}</span>
                    <span className="text-[#16A34A] font-mono font-bold shrink-0">✓ {job.algorithm}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLOpsDashboardPage;
