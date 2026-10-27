import React, { useState, useEffect } from 'react';
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
      <div className="p-[60px] text-center flex flex-col items-center gap-[16px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--secondary)]" />
        <span className="text-[13px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">Loading scheduler telemetry...</span>
      </div>
    );
  }

  const isRunning = schedulerStatus?.running;
  const jobs: any[] = schedulerStatus?.jobs ?? [];

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--primary)] uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Infrastructure &bull; Job Scheduler</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Scheduler Dashboard
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Manage and monitor background scheduled autonomous jobs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-[12px]">
          <span className={`px-[16px] py-[10px] rounded-[6px] text-[11px] font-mono font-bold uppercase tracking-wider border flex items-center gap-2 ${
            isRunning
              ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 shadow-[0_0_15px_rgba(23,217,140,0.1)]'
              : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30 shadow-[0_0_15px_rgba(255,74,99,0.1)]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[var(--success)] animate-pulse shadow-[0_0_5px_var(--success)]' : 'bg-[var(--danger)]'}`} />
            Engine: {isRunning ? 'RUNNING' : 'STOPPED'}
          </span>
          <button
            onClick={fetchStatus}
            className="px-[16px] py-[10px] bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] rounded-[6px] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
        {[
          { label: 'Total Jobs',  value: jobs.length,                                    color: 'text-[var(--text-main)]' },
          { label: 'Running',     value: jobs.filter((j) => j.status === 'RUNNING').length, color: 'text-[var(--secondary)] drop-shadow-[0_0_5px_rgba(76,139,255,0.3)]' },
          { label: 'Paused',      value: jobs.filter((j) => j.status === 'PAUSED').length,  color: 'text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]' },
        ].map((item) => (
          <div key={item.label} className="inst-card p-[24px] text-center flex flex-col justify-center items-center hover:border-[var(--primary)]/30 transition-colors">
            <div className={`text-[36px] font-extrabold font-mono leading-none mb-2 ${item.color}`}>{item.value}</div>
            <div className="text-[10px] uppercase font-bold font-mono text-[var(--text-muted)] tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── Job Cards Grid ── */}
      {jobs.length === 0 ? (
        <div className="inst-card p-[60px] text-center flex flex-col items-center justify-center">
          <Clock className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
          <p className="text-[14px] font-bold font-heading text-[var(--text-main)] mb-1">No Jobs Found</p>
          <p className="text-[13px] font-mono text-[var(--text-muted)]">No scheduled jobs configured in the system yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {jobs.map((job: any) => {
            const isActive = job.status === 'RUNNING';
            const isPaused = job.status === 'PAUSED';
            return (
              <div key={job.id} className={`inst-card p-[20px] relative overflow-hidden transition-colors hover:border-[var(--primary)]/30 border-t-4 ${
                isActive ? 'border-t-[var(--secondary)]' : isPaused ? 'border-t-[#eab308]' : 'border-t-[var(--success)]'
              }`}>
                {isActive && <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-[radial-gradient(ellipse_at_top_right,rgba(76,139,255,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />}
                
                <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold font-heading text-[var(--text-main)] truncate m-0">{job.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mt-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Interval: {job.interval}</span>
                    </div>
                  </div>
                  <span className={`px-[8px] py-[4px] rounded-[4px] text-[9px] font-bold font-mono uppercase tracking-widest border shrink-0 flex items-center ${
                    isActive
                      ? 'bg-[var(--secondary)]/10 text-[var(--secondary)] border-[var(--secondary)]/30 shadow-[0_0_10px_rgba(76,139,255,0.1)]'
                      : isPaused
                      ? 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                      : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 shadow-[0_0_10px_rgba(23,217,140,0.1)]'
                  }`}>
                    {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--secondary)] shadow-[0_0_5px_var(--secondary)] animate-pulse mr-1.5" />}
                    {job.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[var(--text-main)] font-mono font-bold bg-background border border-[var(--border-color)] rounded-[6px] px-[12px] py-[10px] mb-4 relative z-10">
                  <Activity className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span>Next: <span className="text-[var(--text-muted)] font-normal ml-1">{job.next_run ? new Date(job.next_run).toLocaleString() : 'N/A'}</span></span>
                </div>

                <div className="flex items-center justify-end gap-[8px] pt-[16px] border-t border-[var(--border-color)] relative z-10">
                  <button
                    onClick={() => handleAction(job.id, 'run')}
                    className="p-[8px] rounded-[6px] text-[var(--text-main)] hover:text-[var(--secondary)] hover:bg-[var(--secondary)]/10 transition-all cursor-pointer"
                    title="Run Now"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  {isPaused ? (
                    <button
                      onClick={() => handleAction(job.id, 'resume')}
                      className="p-[8px] rounded-[6px] text-[var(--text-main)] hover:text-[var(--success)] hover:bg-[var(--success)]/10 transition-all cursor-pointer"
                      title="Resume"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(job.id, 'pause')}
                      className="p-[8px] rounded-[6px] text-[var(--text-main)] hover:text-[#eab308] hover:bg-[#eab308]/10 transition-all cursor-pointer"
                      title="Pause"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(job.id, 'run')}
                    className="p-[8px] rounded-[6px] text-[var(--text-main)] hover:text-[var(--success)] hover:bg-[var(--success)]/10 transition-all cursor-pointer"
                    title="Mark Done"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchedulerDashboardPage;
