import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Server, Cpu, HardDrive, RefreshCw, Database, Clock } from 'lucide-react';
import { apiClient as api } from '../services/apiClient';

const GaugeBar: React.FC<{ label: string; value: number; icon: React.ReactNode; colorClass: string }> = ({
  label, value, icon, colorClass,
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-[var(--text-muted)]">{icon} {label}</span>
      <span className={`font-bold font-mono ${value > 90 ? 'text-red-400' : value > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {value !== undefined ? value.toFixed(1) : '0.0'}%
      </span>
    </div>
    <div className="w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
      <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${Math.min(value ?? 0, 100)}%` }} />
    </div>
  </div>
);

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
      <div className="p-8 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
        <span className="text-xs">Loading worker node telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Infrastructure &bull; Distributed Task Execution</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Background Worker Nodes
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Monitor distributed async task execution, resource utilization, and heartbeat telemetry.
          </p>
        </div>
        <button
          onClick={fetchWorkers}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Nodes',  value: workers.length, color: 'text-[var(--text-main)]' },
          { label: 'Active/Busy',  value: activeCount,    color: 'text-blue-400' },
          { label: 'Idle',         value: idleCount,      color: 'text-emerald-400' },
        ].map((item) => (
          <Card key={item.label} className="p-4 text-center space-y-0.5">
            <div className={`text-2xl font-extrabold font-mono ${item.color}`}>{item.value}</div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">{item.label}</div>
          </Card>
        ))}
      </div>

      {/* ── Worker Cards ── */}
      {workers.length === 0 ? (
        <Card className="p-12 text-center">
          <Server className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">No active workers detected.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {workers.map((worker: any) => {
            const isActive = worker.status === 'ACTIVE' || worker.status === 'BUSY';
            return (
              <Card key={worker.id || worker.worker_id} className={`p-5 space-y-4 border-t-2 ${isActive ? 'border-t-blue-500' : 'border-t-[var(--border-color)]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-500/10' : 'bg-[var(--bg-main)]'} border border-[var(--border-color)]`}>
                      <Server className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-[var(--text-muted)]'}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-main)] font-mono">{worker.worker_id}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Node ID: {(worker.id || '').slice(0, 8)}</div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : 'bg-[var(--text-muted)]'}`} />
                    {worker.status}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <GaugeBar
                    label="CPU Usage"
                    value={worker.cpu_usage ?? 0}
                    icon={<Cpu className="w-3.5 h-3.5" />}
                    colorClass="bg-gradient-to-r from-blue-600 to-blue-400"
                  />
                  <GaugeBar
                    label="Memory Usage"
                    value={worker.memory_usage ?? 0}
                    icon={<HardDrive className="w-3.5 h-3.5" />}
                    colorClass="bg-gradient-to-r from-purple-600 to-purple-400"
                  />
                </div>

                <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2">
                  <div className="text-[10px] text-[var(--text-muted)] mb-0.5">Current Task</div>
                  <div className="text-xs font-mono font-semibold text-[var(--text-main)]">
                    {worker.current_job_id ? `Job: ${worker.current_job_id}` : 'Idle — Waiting for tasks'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono">
                  <Clock className="w-3 h-3" />
                  Last Heartbeat: {worker.last_heartbeat ? timeAgo(worker.last_heartbeat) : '—'}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BackgroundWorkersPage;
