import React, { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, RefreshCw, Database, Clock } from 'lucide-react';
import { apiClient as api } from '../services/apiClient';

const GaugeBar: React.FC<{ label: string; value: number | null | undefined; icon: React.ReactNode; colorClass: string }> = ({
  label, value, icon, colorClass,
}) => {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return (
    <div className="space-y-[6px]">
      <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
        <span className="flex items-center gap-1.5 text-[var(--text-muted)] uppercase">{icon} {label}</span>
        <span className={`font-bold ${num > 90 ? 'text-[var(--danger)]' : num > 75 ? 'text-[#eab308]' : 'text-[var(--text-main)]'}`}>
          {num.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-[6px] bg-background rounded-[4px] overflow-hidden border border-[var(--border-color)]">
        <div className={`h-full rounded-[4px] transition-all duration-[1200ms] ease-out ${colorClass}`} style={{ width: `${Math.min(Math.max(num, 0), 100)}%` }} />
      </div>
    </div>
  );
};

const timeAgo = (dateStr: string): string => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  } catch {
    return '—';
  }
};

export const BackgroundWorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/autonomous/workers/status');
      setWorkers(Array.isArray(response.data) ? response.data : []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = workers.filter((w) => w.status === 'ACTIVE' || w.status === 'BUSY').length;
  const idleCount = workers.filter((w) => w.status === 'IDLE').length;

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)] font-mono text-[13px]">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
        <span>Loading worker node telemetry...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Infrastructure &bull; Distributed Task Execution</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Background Worker Nodes
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Monitor distributed async task execution, resource utilization, and heartbeat telemetry.
          </p>
        </div>
        <button
          onClick={fetchWorkers}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Nodes',  value: workers.length, color: 'text-[var(--text-main)]' },
          { label: 'Active/Busy',  value: activeCount,    color: 'text-[var(--secondary)]' },
          { label: 'Idle',         value: idleCount,      color: 'text-[#a855f7]' },
        ].map((item) => (
          <div key={item.label} className="inst-card p-[20px] text-center space-y-1">
            <div className={`text-[28px] font-extrabold font-mono ${item.color} leading-none`}>{item.value}</div>
            <div className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── Worker Cards ── */}
      {workers.length === 0 ? (
        <div className="inst-card p-12 text-center">
          <Server className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-[14px] font-mono text-[var(--text-muted)]">No active workers detected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workers.map((worker: any) => {
            const isActive = worker.status === 'ACTIVE' || worker.status === 'BUSY';
            return (
              <div key={worker.id || worker.worker_id} className={`inst-card p-[24px] relative overflow-hidden group border-t-2 ${isActive ? 'border-t-[var(--secondary)] shadow-[0_0_20px_rgba(76,139,255,0.05)]' : 'border-t-[var(--border-color)]'}`}>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-[44px] h-[44px] rounded-[10px] flex items-center justify-center ${isActive ? 'bg-[var(--secondary)]/10' : 'bg-background'} border border-[var(--border-color)] group-hover:border-[var(--secondary)]/50 transition-colors`}>
                      <Server className={`w-5 h-5 ${isActive ? 'text-[var(--secondary)] drop-shadow-[0_0_8px_rgba(76,139,255,0.4)]' : 'text-[var(--text-muted)]'}`} />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-[var(--text-main)] font-mono">{worker.worker_id}</div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)] mt-[2px]">Node ID: {String(worker.id || '').slice(0, 8) || 'N/A'}</div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-[6px] border ${
                    isActive
                      ? 'bg-[var(--secondary)]/10 text-[var(--secondary)] border-[var(--secondary)]/30'
                      : 'bg-background text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--secondary)] shadow-[0_0_8px_rgba(76,139,255,0.8)] animate-pulse' : 'bg-[var(--text-muted)]'}`} />
                    {worker.status}
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <GaugeBar
                    label="CPU Usage"
                    value={worker.cpu_usage ?? 0}
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    colorClass="bg-[var(--secondary)]"
                  />
                  <GaugeBar
                    label="Memory Usage"
                    value={worker.memory_usage ?? 0}
                    icon={<HardDrive className="w-3.5 h-3.5" />}
                    colorClass="bg-[#a855f7]"
                  />
                </div>

                <div className="bg-background border border-[var(--border-color)] rounded-[8px] px-4 py-3 mb-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-[6px]">Current Task</div>
                  <div className={`text-[13px] font-mono font-bold ${worker.current_job_id ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)] italic'}`}>
                    {worker.current_job_id ? `Job: ${worker.current_job_id}` : 'Idle — Waiting for tasks'}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Last Heartbeat: {worker.last_heartbeat ? timeAgo(worker.last_heartbeat) : '—'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BackgroundWorkersPage;
