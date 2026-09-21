import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Server, Database, AlertCircle, CheckCircle2, Cpu, HardDrive, MemoryStick, RefreshCw, Zap, ShieldCheck } from 'lucide-react';

const getH = (): HeadersInit => {
  const t = localStorage.getItem('access_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

interface HealthComponent { component: string; status: string; value?: string; }
interface Worker { worker_id: string; status: string; current_job?: string | null; jobs_completed?: number; }
interface HealthData {
  overall_status: string;
  components: HealthComponent[];
  workers: Worker[];
  jobs: { total: number; active: number; failed: number };
  cpu_pct: number; ram_pct: number; disk_pct: number;
  ai_readiness?: { registered_models: number; tracked_experiments: number };
}

const GaugeBar: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-[var(--text-muted)]">{icon} {label}</span>
      <span className={`font-bold font-mono ${value > 90 ? 'text-red-400' : value > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {value.toFixed(1)}%
      </span>
    </div>
    <div className="w-full h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(value, 100)}%`,
          background: value > 90
            ? 'linear-gradient(90deg, #DC2626, #EF4444)'
            : value > 75
            ? 'linear-gradient(90deg, #D97706, #F59E0B)'
            : 'linear-gradient(90deg, #059669, #10B981)',
        }}
      />
    </div>
  </div>
);

export const SystemHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/v1/ai-infra/health', { headers: getH() });
      if (response.ok) {
        setHealthData(await response.json());
        setLastUpdated(new Date());
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !healthData) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
        <span className="text-xs">Fetching system telemetry...</span>
      </div>
    );
  }

  const isHealthy = healthData?.overall_status === 'HEALTHY';

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Server className="w-4 h-4" />
            <span>Infrastructure &bull; System Telemetry</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            System Health Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time monitoring of all Autonomous Intelligence Platform components.
            {lastUpdated && (
              <span className="ml-2 font-mono text-[10px]">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
            isHealthy
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            {isHealthy
              ? <CheckCircle2 className="w-3.5 h-3.5" />
              : <AlertCircle className="w-3.5 h-3.5" />}
            {healthData?.overall_status ?? 'UNKNOWN'}
          </span>
          <button
            onClick={fetchHealth}
            className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Resource Gauges ── */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4">
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Server Resource Utilization</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GaugeBar label="CPU" value={healthData?.cpu_pct ?? 0} icon={<Cpu className="w-3.5 h-3.5" />} />
          <GaugeBar label="Memory (RAM)" value={healthData?.ram_pct ?? 0} icon={<MemoryStick className="w-3.5 h-3.5" />} />
          <GaugeBar label="Disk" value={healthData?.disk_pct ?? 0} icon={<HardDrive className="w-3.5 h-3.5" />} />
        </div>
      </Card>

      {/* ── Component Grid ── */}
      <div>
        <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Infrastructure Components
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(healthData?.components ?? []).map((comp: any, idx: number) => (
            <Card key={idx} className={`p-4 border ${comp.status === 'HEALTHY' ? 'border-emerald-700/20' : 'border-red-700/20'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">{comp.component}</p>
                  <h3 className={`text-sm font-bold mt-0.5 ${comp.status === 'HEALTHY' ? 'text-emerald-400' : comp.status === 'DEGRADED' ? 'text-amber-400' : 'text-red-400'}`}>
                    {comp.status}
                  </h3>
                  {comp.value && <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{comp.value}</p>}
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${comp.status === 'HEALTHY' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {comp.status === 'HEALTHY'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Workers & Scheduler ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Background Workers */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Server className="w-4 h-4 text-blue-400" />
            <span>Background Workers</span>
          </h3>
          <div className="space-y-2">
            {(healthData?.workers ?? []).length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic">No active workers found.</p>
            ) : (
              (healthData?.workers ?? []).map((w: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-main)] font-mono">{w.worker_id}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Job: {w.current_job ?? 'Idle'}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${
                    w.status === 'IDLE'
                      ? 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)]'
                      : w.status === 'BUSY'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${w.status === 'IDLE' ? 'bg-[var(--text-muted)]' : 'bg-blue-400 animate-pulse'}`} />
                    {w.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Scheduler & AI Readiness */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Scheduler &amp; AI Registry</span>
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Total Scheduled Jobs', value: healthData?.jobs?.total ?? 0, color: 'text-[var(--text-main)]' },
              { label: 'Active Jobs',           value: healthData?.jobs?.active ?? 0, color: 'text-emerald-400' },
              { label: 'Failed Jobs',           value: healthData?.jobs?.failed ?? 0, color: 'text-red-400' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                <span className={`font-bold font-mono text-sm ${item.color}`}>{item.value}</span>
              </div>
            ))}

            <div className="border-t border-[var(--border-color)] pt-3 mt-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3 h-3" />AI Registry
              </div>
              {[
                { label: 'Registered Models',    value: healthData?.ai_readiness?.registered_models ?? 0 },
                { label: 'Tracked Experiments',  value: healthData?.ai_readiness?.tracked_experiments ?? 0 },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-1">
                  <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                  <span className="font-bold font-mono text-sm text-[var(--text-main)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealthPage;
