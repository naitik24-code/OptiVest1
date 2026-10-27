import React, { useState, useEffect, useCallback } from 'react';
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
  RAW:           'text-[var(--secondary)] bg-[var(--secondary)]/10 border-[var(--secondary)]/30',
  TECHNICAL:     'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30',
  FUNDAMENTAL:   'text-[#eab308] bg-[#eab308]/10 border-[#eab308]/30',
  MACRO:         'text-[#a855f7] bg-[#a855f7]/10 border-[#a855f7]/30',
  SENTIMENT:     'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/30',
};

const STAGE_ICONS = [
  { label: 'PREPROCESSING',        icon: Database,    color: 'text-[var(--secondary)]' },
  { label: 'FEATURE ENGINEERING',  icon: Layers,      color: 'text-[var(--success)]' },
  { label: 'SEQUENCE BUILDING',    icon: GitBranch,   color: 'text-[#eab308]' },
  { label: 'TRAINING',             icon: Cpu,         color: 'text-[#a855f7]' },
  { label: 'EVALUATING',           icon: BarChart3,   color: 'text-[var(--primary)]' },
  { label: 'FINALISING',           icon: CheckCircle2,color: 'text-[var(--success)]' },
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
      <div className="p-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)] font-mono text-[13px]">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--secondary)]" />
        <span>Initialising ML Pipeline Telemetry...</span>
      </div>
    );
  }

  const fp = pipeline?.feature_pipeline;
  const qs = pipeline?.queue_summary;

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#a855f7] uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Phase 5 &bull; ML Engine Initiation</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            MLOps Engineering Dashboard
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Unified ML pipeline control &mdash; feature engineering, async worker dispatch, and live training telemetry.
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── System Banner ── */}
      {pipeline && (
        <div className="inst-card p-[24px] bg-gradient-to-r from-[rgba(168,85,247,0.1)] via-transparent to-transparent border-l-4 border-l-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.05)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[18px] font-bold font-heading text-[var(--text-main)] drop-shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                {pipeline.readiness_status.replace(/_/g, ' ')}
              </div>
              <p className="text-[13px] text-[var(--text-muted)] font-mono">
                Worker Engine: <span className="text-[var(--secondary)] font-bold">{pipeline.worker_engine}</span>
                &ensp;|&ensp;Phase: <span className="text-[#a855f7] font-bold uppercase tracking-wider">{pipeline.pipeline_phase.replace(/_/g, ' ')}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[32px] font-extrabold text-[var(--success)] font-mono leading-none drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]">
                {pipeline.readiness_score}%
              </div>
              <div className="text-[11px] uppercase font-bold font-mono text-[var(--text-muted)] tracking-wider mt-1">
                Infra Readiness
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline Stage Flow ── */}
      <div className="inst-card p-[24px]">
        <h3 className="text-[14px] font-bold font-heading text-[var(--text-main)] mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--secondary)]" />
          <span>Training Pipeline Stages</span>
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          {STAGE_ICONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <React.Fragment key={s.label}>
                <div className="flex items-center gap-2 px-[14px] py-[8px] rounded-[6px] bg-background border border-[var(--border-color)] text-[11px] font-mono font-bold tracking-wider shadow-sm transition-colors hover:border-[var(--secondary)]/40">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-[var(--text-main)]">{s.label}</span>
                </div>
                {i < STAGE_ICONS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      {qs && fp && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { label: 'Total Jobs',   value: qs.total_jobs,      color: 'text-[var(--text-main)]' },
            { label: 'Running',      value: qs.running,         color: 'text-[var(--secondary)]' },
            { label: 'Completed',    value: qs.completed,       color: 'text-[var(--success)]' },
            { label: 'Queued',       value: qs.queued,          color: 'text-[#eab308]' },
            { label: 'Failed',       value: qs.failed,          color: 'text-[var(--danger)]' },
            { label: 'Features',     value: fp.feature_count,   color: 'text-[#a855f7]' },
            { label: 'Window',       value: `${fp.window_size}d`, color: 'text-[var(--primary)]' },
            { label: 'Pred Steps',   value: `+${fp.prediction_steps}d`, color: 'text-[var(--success)]' },
          ].map((item) => (
            <div key={item.label} className="inst-card p-[16px] text-center space-y-1 group hover:-translate-y-1 transition-transform">
              <div className={`text-[20px] font-extrabold font-mono ${item.color} leading-none`}>{item.value}</div>
              <div className="text-[10px] uppercase font-bold font-mono text-[var(--text-muted)] tracking-wider pt-1">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Importance Panel */}
        <div className="inst-card lg:col-span-2 p-[24px]">
          <h3 className="text-[14px] font-bold font-heading tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-4 mb-5">
            <BarChart3 className="w-5 h-5 text-[var(--success)]" />
            <span>Top 15 Features by SHAP Importance (Pipeline v1.0.0)</span>
          </h3>

          {breakdown && (
            <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold uppercase tracking-wider mb-6">
              {Object.entries(breakdown.by_source).map(([src, cnt]) => (
                <span key={src} className={`px-2 py-1 rounded-[4px] border ${SOURCE_COLORS[src] || 'text-[var(--text-muted)] bg-[var(--text-muted)]/10 border-[var(--text-muted)]/30'}`}>
                  {src}: {cnt}
                </span>
              ))}
              <span className="px-2 py-1 rounded-[4px] border border-[var(--border-color)] text-[var(--text-muted)]">
                Avg Importance: {breakdown.avg_importance}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.feature_name} className="flex items-center gap-4 bg-background p-[10px] rounded-[6px] border border-[var(--border-color)] hover:border-[var(--secondary)]/30 transition-colors">
                <span className="text-[12px] font-mono font-bold text-[var(--text-muted)] w-6 text-right shrink-0">{f.rank}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border shrink-0 tracking-wider font-mono uppercase ${SOURCE_COLORS[f.source] || 'text-[var(--text-muted)] bg-[var(--text-muted)]/10 border-[var(--text-muted)]/30'}`}>
                  {f.source.slice(0, 4)}
                </span>
                <span className="text-[13px] font-mono font-bold text-[var(--text-main)] w-[180px] shrink-0 truncate">
                  {f.feature_name}
                </span>
                <div className="flex-1 bg-[var(--surface2)] rounded-full h-[6px] overflow-hidden border border-[var(--border-color)]">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${f.normalized_importance * 100}%`,
                      background: `linear-gradient(90deg, var(--secondary), var(--success) ${f.normalized_importance * 100}%)`,
                    }}
                  />
                </div>
                <span className="text-[12px] font-mono font-extrabold text-[var(--text-main)] w-12 text-right shrink-0">
                  {f.importance_score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Enqueue & Dispatch Form */}
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-4 mb-5">
              <Play className="w-5 h-5 text-[var(--secondary)]" />
              <span>Enqueue &amp; Dispatch Job</span>
            </h3>

            <form onSubmit={handleDispatch} className="space-y-4">
              <input
                type="text"
                placeholder="Job name (e.g. LSTM Baseline AAPL)"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors placeholder:text-[var(--text-muted)]/50"
              />
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[14px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer appearance-none"
              >
                <option value="LSTM">LSTM</option>
                <option value="XGBOOST">XGBOOST</option>
                <option value="TRANSFORMER">TRANSFORMER</option>
              </select>
              <button
                type="submit"
                disabled={dispatching || !jobName}
                className="w-full px-[14px] py-[12px] bg-[var(--secondary)] hover:bg-[#3b78ff] disabled:opacity-50 text-white text-[13px] font-bold font-mono rounded-[8px] shadow-[0_0_15px_rgba(76,139,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {dispatching ? <RefreshCw className="w-4 h-4 animate-spin fill-current" /> : <Zap className="w-4 h-4 fill-current" />}
                <span>{dispatching ? 'Dispatching...' : 'Dispatch to Worker'}</span>
              </button>

              {dispatchMsg && (
                <div className="text-[11px] font-mono text-[var(--success)] font-bold bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-[6px] px-3 py-2 mt-2">
                  {dispatchMsg}
                </div>
              )}
            </form>
          </div>

          {/* Active Jobs Terminal */}
          <div className="inst-card p-[20px] bg-background border border-[var(--border-color)] font-mono space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--success)]" />
            <div className="text-[var(--text-main)] text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <Terminal className="w-4 h-4 text-[var(--success)]" />
              <span>Active Jobs</span>
            </div>
            <div className="space-y-2 text-[12px] min-h-[60px] pt-1">
              {(!pipeline?.active_jobs || pipeline.active_jobs.length === 0) ? (
                <span className="text-[var(--text-muted)] italic">No jobs currently running.</span>
              ) : (
                pipeline.active_jobs.map((job: any) => (
                  <div key={job.id} className="flex justify-between items-center bg-[var(--surface2)] p-2 rounded-[6px] border border-[var(--border-color)]">
                    <span className="text-[var(--text-main)] truncate w-[140px] font-bold">{job.job_name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-[60px] bg-background rounded-full h-[6px] overflow-hidden border border-[var(--border-color)]">
                        <div className="bg-[var(--secondary)] h-full animate-pulse shadow-[0_0_5px_rgba(76,139,255,0.8)]" style={{ width: `${job.progress_pct}%` }} />
                      </div>
                      <span className="text-[var(--secondary)] font-bold w-10 text-right">{job.progress_pct}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recently Completed */}
          {pipeline?.recent_completed && pipeline.recent_completed.length > 0 && (
            <div className="inst-card p-[20px]">
              <div className="text-[12px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                <span>Recently Completed</span>
              </div>
              <div className="space-y-2">
                {pipeline.recent_completed.map((job: any) => (
                  <div key={job.id} className="flex justify-between items-center text-[12px] bg-background p-2 rounded-[6px] border border-[var(--border-color)]">
                    <span className="text-[var(--text-main)] truncate font-bold font-mono">{job.job_name}</span>
                    <span className="text-[var(--success)] font-mono font-bold shrink-0">✓ {job.algorithm}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLOpsDashboardPage;
