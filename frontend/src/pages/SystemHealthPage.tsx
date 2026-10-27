import React, { useState, useEffect } from 'react';
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
  <div className="space-y-[12px] bg-background border border-[var(--border-color)] rounded-[8px] p-[16px] transition-colors hover:border-[var(--primary)]/30 group">
    <div className="flex items-center justify-between text-[13px]">
      <span className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
        {icon} {label}
      </span>
      <span className={`text-[20px] font-extrabold font-mono leading-none ${value > 90 ? 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]' : value > 75 ? 'text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]' : 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]'}`}>
        {value.toFixed(1)}%
      </span>
    </div>
    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-[var(--border-color)]">
      <div
        className={`h-full rounded-full transition-all duration-700 shadow-sm ${value > 90 ? 'bg-[var(--danger)]' : value > 75 ? 'bg-[#eab308]' : 'bg-[var(--success)]'}`}
        style={{ width: `${Math.min(value, 100)}%` }}
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
      <div className="p-[60px] text-center flex flex-col items-center gap-[16px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--secondary)]" />
        <span className="text-[13px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">Fetching system telemetry...</span>
      </div>
    );
  }

  const isHealthy = healthData?.overall_status === 'HEALTHY';

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Server className="w-4 h-4" />
            <span>Infrastructure &bull; System Telemetry</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            System Health Dashboard
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono flex items-center gap-2">
            Real-time monitoring of all Autonomous Intelligence Platform components.
            {lastUpdated && (
              <span className="text-[10px] px-2 py-0.5 bg-[var(--surface2)] rounded border border-[var(--border-color)]">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-[12px]">
          <span className={`px-[16px] py-[10px] rounded-[6px] text-[11px] font-mono font-bold uppercase tracking-wider border flex items-center gap-2 ${
            isHealthy
              ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 shadow-[0_0_15px_rgba(23,217,140,0.1)]'
              : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30 shadow-[0_0_15px_rgba(255,74,99,0.1)]'
          }`}>
            {isHealthy
              ? <CheckCircle2 className="w-4 h-4 text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.5)]" />
              : <AlertCircle className="w-4 h-4 text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.5)]" />}
            {healthData?.overall_status ?? 'UNKNOWN'}
          </span>
          <button
            onClick={fetchHealth}
            className="px-[16px] py-[10px] bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] rounded-[6px] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Resource Gauges ── */}
      <div className="inst-card p-[32px] border-l-4 border-l-[var(--secondary)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[radial-gradient(ellipse_at_top_right,rgba(76,139,255,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
        <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[24px] relative z-10">
          <Zap className="w-5 h-5 text-[var(--secondary)]" />
          <span>Server Resource Utilization</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] relative z-10">
          <GaugeBar label="CPU" value={healthData?.cpu_pct ?? 0} icon={<Cpu className="w-4 h-4 text-[var(--secondary)]" />} />
          <GaugeBar label="Memory (RAM)" value={healthData?.ram_pct ?? 0} icon={<MemoryStick className="w-4 h-4 text-[var(--secondary)]" />} />
          <GaugeBar label="Disk" value={healthData?.disk_pct ?? 0} icon={<HardDrive className="w-4 h-4 text-[var(--secondary)]" />} />
        </div>
      </div>

      {/* ── Component Grid ── */}
      <div className="inst-card p-[32px]">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
          <Server className="w-5 h-5 text-[var(--text-main)]" />
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] m-0">
            Infrastructure Components
          </h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px]">
          {(healthData?.components ?? []).map((comp: any, idx: number) => (
            <div key={idx} className={`p-[16px] bg-background rounded-[8px] border transition-colors hover:border-[var(--primary)]/30 group ${comp.status === 'HEALTHY' ? 'border-[var(--success)]/20' : 'border-[var(--danger)]/20'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors truncate mb-2">{comp.component}</p>
                  <h3 className={`text-[15px] font-bold font-heading uppercase tracking-widest leading-none ${comp.status === 'HEALTHY' ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' : comp.status === 'DEGRADED' ? 'text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.2)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]'}`}>
                    {comp.status}
                  </h3>
                  {comp.value && <p className="text-[11px] text-[var(--text-muted)] mt-2 font-mono truncate bg-surface px-2 py-1 rounded border border-[var(--border-color)]">{comp.value}</p>}
                </div>
                <div className={`w-[40px] h-[40px] rounded-[8px] flex items-center justify-center shrink-0 border ${comp.status === 'HEALTHY' ? 'bg-[var(--success)]/5 border-[var(--success)]/20 shadow-[0_0_10px_rgba(23,217,140,0.1)]' : 'bg-[var(--danger)]/5 border-[var(--danger)]/20 shadow-[0_0_10px_rgba(255,74,99,0.1)]'}`}>
                  {comp.status === 'HEALTHY'
                    ? <CheckCircle2 className="w-5 h-5 text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.4)]" />
                    : <AlertCircle className="w-5 h-5 text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.4)]" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Workers & Scheduler ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* Background Workers */}
        <div className="inst-card p-[32px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
            <Cpu className="w-5 h-5 text-[var(--secondary)]" />
            <span>Background Workers</span>
          </h3>
          <div className="space-y-[12px]">
            {(healthData?.workers ?? []).length === 0 ? (
              <div className="text-[12px] font-mono text-[var(--text-muted)] p-[24px] bg-background border border-[var(--border-color)] rounded-[6px] text-center">No active workers found.</div>
            ) : (
              (healthData?.workers ?? []).map((w: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-[16px] bg-background rounded-[6px] border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-colors">
                  <div>
                    <p className="text-[13px] font-bold text-[var(--text-main)] font-mono uppercase tracking-wider">{w.worker_id}</p>
                    <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">Job: <span className="text-[var(--text-main)]">{w.current_job ?? 'Idle'}</span></p>
                  </div>
                  <span className={`flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest px-[10px] py-[6px] rounded-[4px] border ${
                    w.status === 'IDLE'
                      ? 'bg-background text-[var(--text-muted)] border-[var(--border-color)]'
                      : w.status === 'BUSY'
                      ? 'bg-[var(--secondary)]/10 text-[var(--secondary)] border-[var(--secondary)]/30 shadow-[0_0_10px_rgba(76,139,255,0.1)]'
                      : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 shadow-[0_0_10px_rgba(23,217,140,0.1)]'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${w.status === 'IDLE' ? 'bg-[var(--text-muted)]' : 'bg-[var(--secondary)] animate-pulse shadow-[0_0_5px_var(--secondary)]'}`} />
                    {w.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scheduler & AI Readiness */}
        <div className="inst-card p-[32px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
            <Database className="w-5 h-5 text-[#a855f7]" />
            <span>Scheduler &amp; AI Registry</span>
          </h3>
          
          <div className="space-y-[16px]">
            {[
              { label: 'Total Scheduled Jobs', value: healthData?.jobs?.total ?? 0, color: 'text-[var(--text-main)]' },
              { label: 'Active Jobs',           value: healthData?.jobs?.active ?? 0, color: 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' },
              { label: 'Failed Jobs',           value: healthData?.jobs?.failed ?? 0, color: 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-[16px] bg-background border border-[var(--border-color)] rounded-[6px]">
                <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">{item.label}</span>
                <span className={`font-extrabold font-mono text-[18px] leading-none ${item.color}`}>{item.value}</span>
              </div>
            ))}

            <div className="border-t border-[var(--border-color)] pt-[24px] mt-[8px]">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#a855f7] uppercase tracking-wider mb-[16px]">
                <ShieldCheck className="w-4 h-4" /> AI Registry State
              </div>
              
              <div className="grid grid-cols-2 gap-[16px]">
                {[
                  { label: 'Registered Models',    value: healthData?.ai_readiness?.registered_models ?? 0 },
                  { label: 'Tracked Experiments',  value: healthData?.ai_readiness?.tracked_experiments ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="bg-background border border-[var(--border-color)] rounded-[6px] p-[16px] text-center">
                    <div className="text-[20px] font-extrabold font-mono text-[var(--text-main)] leading-none mb-2">{item.value}</div>
                    <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;
