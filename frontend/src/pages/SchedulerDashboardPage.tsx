import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Clock, PlayCircle, PauseCircle, Activity, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { apiClient as api } from '../services/apiClient';

export const SchedulerDashboardPage: React.FC = () => {
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/autonomous/scheduler/status');
      setSchedulerStatus(response.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (jobId: number, action: 'run' | 'pause' | 'resume') => {
    try {
      await api.post(`/autonomous/scheduler/job/${jobId}/${action}`);
      fetchStatus();
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
        <span className="text-xs">Loading scheduler telemetry...</span>
      </div>
    );
  }

  const isRunning = schedulerStatus?.running;
  const jobs: any[] = schedulerStatus?.jobs ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Infrastructure &bull; Job Scheduler</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Scheduler Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage and monitor background scheduled autonomous jobs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
            isRunning
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            Engine: {isRunning ? 'RUNNING' : 'STOPPED'}
          </span>
          <button
            onClick={fetchStatus}
            className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Jobs',  value: jobs.length,                                    color: 'text-[var(--text-main)]' },
          { label: 'Running',     value: jobs.filter((j) => j.status === 'RUNNING').length, color: 'text-blue-400' },
          { label: 'Paused',      value: jobs.filter((j) => j.status === 'PAUSED').length,  color: 'text-amber-400' },
        ].map((item) => (
          <Card key={item.label} className="p-4 text-center space-y-0.5">
            <div className={`text-2xl font-extrabold font-mono ${item.color}`}>{item.value}</div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">{item.label}</div>
          </Card>
        ))}
      </div>

      {/* ── Job Cards Grid ── */}
      {jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">No scheduled jobs configured in the system yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job: any) => {
            const isActive = job.status === 'RUNNING';
            const isPaused = job.status === 'PAUSED';
            return (
              <Card key={job.id} className={`p-5 space-y-4 border-l-4 ${
                isActive ? 'border-l-blue-500' : isPaused ? 'border-l-amber-500' : 'border-l-emerald-500'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[var(--text-main)] truncate">{job.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">Interval: {job.interval}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : isPaused
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse mr-1" />}
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2">
                  <Activity className="w-3 h-3 shrink-0" />
                  <span>Next: {job.next_run ? new Date(job.next_run).toLocaleString() : 'N/A'}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border-color)]">
                  <button
                    onClick={() => handleAction(job.id, 'run')}
                    className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all"
                    title="Run Now"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  {isPaused ? (
                    <button
                      onClick={() => handleAction(job.id, 'resume')}
                      className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
                      title="Resume"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(job.id, 'pause')}
                      className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all"
                      title="Pause"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(job.id, 'run')}
                    className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
                    title="Mark Done"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchedulerDashboardPage;
