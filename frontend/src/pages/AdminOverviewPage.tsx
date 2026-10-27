import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck, Users, Layers, Activity, Cpu, Sliders,
  ArrowRightLeft, FileText, Zap, Clock, Server, Bell,
  RefreshCw, TrendingUp, Database, BarChart3, AlertTriangle,
  CheckCircle2, HardDrive, MemoryStick, Play
} from 'lucide-react';

const getH = (): HeadersInit => {
  const t = localStorage.getItem('access_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// ─── Sub-section navigation tiles ────────────────────────────────────────────
const ADMIN_TILES = [
  { label: 'Users Control', path: '/admin/users', icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', desc: 'RBAC & user registry' },
  { label: 'Global Portfolios', path: '/admin/portfolios', icon: Layers, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', desc: 'Platform-wide AUM' },
  { label: 'MLOps Hub', path: '/admin/mlops', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', desc: 'ML pipeline control' },
  { label: 'AI Config', path: '/admin/ai-config', icon: Sliders, color: 'text-[#0EA5E9]', bg: 'bg-sky-500/10 border-sky-500/20', desc: 'Hyperparameter governance' },
  { label: 'Training Queue', path: '/admin/training-queue', icon: Cpu, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', desc: 'Async job orchestration' },
  { label: 'Model Health', path: '/admin/model-health', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', desc: 'Drift & accuracy telemetry' },
  { label: 'Model Compare', path: '/admin/model-comparison', icon: ArrowRightLeft, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', desc: 'Side-by-side metrics' },
  { label: 'Research Analytics', path: '/admin/research', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', desc: 'Publication-grade reports' },
  { label: 'Autonomous Center', path: '/admin/autonomous', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', desc: 'Event-driven orchestration' },
  { label: 'Scheduler', path: '/admin/scheduler', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', desc: 'Cron job management' },
  { label: 'System Health', path: '/admin/system-health', icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', desc: 'Infrastructure telemetry' },
  { label: 'Worker Nodes', path: '/admin/workers', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', desc: 'Distributed task nodes' },
  { label: 'Benchmark', path: '/admin/benchmark', icon: BarChart3, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', desc: 'Alpha vs benchmarks' },
  { label: 'Strategy Compare', path: '/admin/strategy-comparison', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', desc: 'Long-term simulator' },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', desc: 'System alert feeds' },
];

interface HealthData {
  overall_status: string;
  cpu_pct: number;
  ram_pct: number;
  disk_pct: number;
  workers: any[];
  jobs: { total: number; active: number; failed: number };
  ai_readiness?: { registered_models: number; tracked_experiments: number };
}

interface PipelineStatus {
  readiness_score: number;
  readiness_status: string;
  queue_summary: { total_jobs: number; running: number; completed: number; queued: number; failed: number };
}

const MiniGauge: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-[var(--text-muted)]">{icon}{label}</span>
      <span className={`font-bold font-mono ${value > 90 ? 'text-red-400' : value > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {value.toFixed(1)}%
      </span>
    </div>
    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-[var(--border-color)]">
      <div
        className={`h-full rounded-full transition-all duration-700 ${value > 90 ? 'bg-red-500' : value > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

export const AdminOverviewPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    const h = getH();
    try {
      const [hRes, pRes] = await Promise.all([
        fetch('/api/v1/ai-infra/health', { headers: h }),
        fetch('/api/v1/ml/pipeline/status', { headers: h }),
      ]);
      if (hRes.ok) setHealth(await hRes.json());
      if (pRes.ok) setPipeline(await pRes.json());
      setLastUpdated(new Date());
    } catch (_) { }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const triggerJob = async (jobName: string) => {
    try {
      const token = localStorage.getItem('access_token') || '';
      await fetch(`http://localhost:8000/api/v1/autonomous/trigger/${jobName}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) { }
  };

  const isHealthy = health?.overall_status === 'HEALTHY';
  const qs = pipeline?.queue_summary;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Founder Console &bull; Admin Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Command Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Unified operational command for the OptiVest intelligence platform.
            {lastUpdated && (
              <span className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="px-3 py-2 bg-[var(--bg-[var(--bg-card)])] border border-[var(--border-color)] hover:bg-surface text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Platform Status Banner ── */}
      <Card className={`p-5 border ${isHealthy ? 'border-emerald-700/30 bg-gradient-to-r from-emerald-900/15 via-transparent to-transparent' : 'border-red-700/30 bg-gradient-to-r from-red-900/15 via-transparent to-transparent'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHealthy ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {isHealthy
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                : <AlertTriangle className="w-5 h-5 text-red-400" />}
            </div>
            <div>
              <div className={`text-sm font-bold ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                Platform {health?.overall_status ?? 'CHECKING...'}
              </div>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                ML Readiness: {pipeline?.readiness_score ?? '--'}% &bull; {pipeline?.readiness_status?.replace(/_/g, ' ') ?? 'Loading...'}
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-md space-y-2">
            <MiniGauge label="CPU" value={health?.cpu_pct ?? 0} icon={<Cpu className="w-3 h-3" />} />
            <MiniGauge label="RAM" value={health?.ram_pct ?? 0} icon={<MemoryStick className="w-3 h-3" />} />
            <MiniGauge label="Disk" value={health?.disk_pct ?? 0} icon={<HardDrive className="w-3 h-3" />} />
          </div>
        </div>
      </Card>

      {/* ── KPI Row ── */}
      {qs && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Jobs', value: qs.total_jobs, color: 'text-[var(--text-main)]' },
            { label: 'Running', value: qs.running, color: 'text-blue-400' },
            { label: 'Completed', value: qs.completed, color: 'text-emerald-400' },
            { label: 'Queued', value: qs.queued, color: 'text-amber-400' },
            { label: 'Failed', value: qs.failed, color: 'text-red-400' },
            { label: 'Workers', value: health?.workers?.length ?? 0, color: 'text-purple-400' },
          ].map((item) => (
            <Card key={item.label} className="p-3 text-center space-y-0.5">
              <div className={`text-xl font-extrabold font-mono ${item.color}`}>{item.value}</div>
              <div className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">{item.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <Play className="w-4 h-4 text-amber-400" />
          <span>Manual Override Actions</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Force Market Scan', job: 'market_regime', color: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400' },
            { label: 'Prediction Refresh', job: 'prediction_refresh', color: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400' },
            { label: 'APDE Reallocation', job: 'apde_analysis', color: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400' },
            { label: 'Drift Analysis', job: 'health_watcher', color: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-400' },
          ].map((action) => (
            <button
              key={action.job}
              onClick={() => triggerJob(action.job)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Admin Navigation Tiles ── */}
      <div>
        <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-1">
          Admin Sector Navigation
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {ADMIN_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <NavLink
                key={tile.path}
                to={tile.path}
                className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg group ${tile.bg}`}
              >
                <Icon className={`w-5 h-5 ${tile.color}`} />
                <div>
                  <div className="text-xs font-bold text-[var(--text-main)] leading-snug">{tile.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{tile.desc}</div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;

