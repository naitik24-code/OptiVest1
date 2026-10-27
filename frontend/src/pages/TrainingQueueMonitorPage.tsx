import React, { useState, useEffect } from 'react';
import { Play, Terminal, Clock, RefreshCw, Cpu, Activity } from 'lucide-react';

interface TrainingJob {
  id: string;
  job_name: string;
  job_type: string;
  algorithm: string;
  dataset_version: string;
  feature_version: string;
  status: string;
  retry_count: number;
  max_retries: number;
  worker_id: string;
  progress_pct: number;
  error_message?: string;
  created_at: string;
}

interface JobLog {
  id: string;
  log_level: string;
  message: string;
  timestamp: string;
}

export const TrainingQueueMonitorPage: React.FC = () => {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newJobName, setNewJobName] = useState('');
  const [algorithm, setAlgorithm] = useState('LSTM');

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('access_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchJobs = () => {
    setLoading(true);
    fetch('/api/v1/ai-infra/training-queue', { headers: getAuthHeaders() })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data);
          if (data.length > 0 && !selectedJobId) {
            setSelectedJobId(data[0].id);
            fetchLogs(data[0].id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchLogs = (jobId: string) => {
    fetch(`/api/v1/ai-infra/training-queue/${jobId}/logs`, { headers: getAuthHeaders() })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleEnqueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName) return;

    fetch(
      `/api/v1/ai-infra/training-queue/enqueue?job_name=${encodeURIComponent(newJobName)}&algorithm=${algorithm}`,
      { method: 'POST', headers: getAuthHeaders() }
    )
      .then((res) => res.ok ? res.json() : null)
      .then(() => {
        setNewJobName('');
        fetchJobs();
      })
      .catch(() => {});
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="p-[60px] text-center flex flex-col items-center gap-[16px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--secondary)]" />
        <span className="text-[13px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)]">Loading AI Training Queue Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#14b8a6] uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Module 3 &amp; 10 &bull; Asynchronous Training Queue &amp; MLOps</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            AI Training Queue Orchestrator
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Asynchronous job queue, worker execution status, progress tracking, and live training logs.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="px-[16px] py-[10px] bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] rounded-[6px] flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Enqueue Form */}
      <div className="inst-card p-[32px] border-l-4 border-l-[var(--secondary)]">
        <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-[20px] flex items-center gap-2">
          <Play className="w-4 h-4 text-[var(--secondary)]" />
          <span>Enqueue New AI Training Job</span>
        </h3>
        <form onSubmit={handleEnqueue} className="flex flex-col sm:flex-row gap-[16px]">
          <input
            type="text"
            placeholder="Job Name (e.g. LSTM Price Predictor Baseline)"
            value={newJobName}
            onChange={(e) => setNewJobName(e.target.value)}
            className="flex-1 bg-background border border-[var(--border-color)] rounded-[8px] px-[16px] py-[14px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors"
          />
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="bg-background border border-[var(--border-color)] rounded-[8px] px-[16px] py-[14px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer w-full sm:w-[200px]"
          >
            <option value="LSTM">LSTM</option>
            <option value="XGBOOST">XGBOOST</option>
            <option value="TRANSFORMER">TRANSFORMER</option>
          </select>
          <button
            type="submit"
            className="px-[24px] py-[14px] bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] font-bold font-mono text-[13px] uppercase tracking-wider rounded-[8px] transition-all shadow-[0_0_15px_rgba(255,90,31,0.3)] shrink-0 cursor-pointer"
          >
            Enqueue Job
          </button>
        </form>
      </div>

      {/* Main Grid: Queue Table + Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        <div className="lg:col-span-2 inst-card p-[32px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[16px]">
            <Clock className="w-4 h-4 text-[var(--secondary)]" />
            <span>Active &amp; Historical Queue Jobs ({jobs.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)] bg-background/50 border-b border-[var(--border-color)] font-mono">
                <tr>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Job Name</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Algorithm</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Status</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Progress</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Worker ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      fetchLogs(job.id);
                    }}
                    className={`cursor-pointer transition-colors ${
                      selectedJobId === job.id ? 'bg-[var(--secondary)]/10 border-l-2 border-l-[var(--secondary)]' : 'hover:bg-background border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="py-4 px-4 font-bold text-[var(--text-main)]">{job.job_name}</td>
                    <td className="py-4 px-4 text-[var(--secondary)] font-bold">{job.algorithm}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-[8px] py-[4px] rounded-[4px] text-[10px] font-bold uppercase tracking-widest border flex w-fit items-center gap-1 ${
                          job.status === 'COMPLETED'
                            ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 shadow-[0_0_10px_rgba(23,217,140,0.1)]'
                            : job.status === 'RUNNING'
                            ? 'bg-[var(--secondary)]/10 text-[var(--secondary)] border-[var(--secondary)]/30 shadow-[0_0_10px_rgba(76,139,255,0.1)]'
                            : 'bg-background text-[var(--text-muted)] border-[var(--border-color)]'
                        }`}
                      >
                        {job.status === 'RUNNING' && <Activity className="w-3 h-3 animate-pulse" />}
                        {job.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-[100px] bg-surface border border-[var(--border-color)] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all shadow-sm ${job.status === 'COMPLETED' ? 'bg-[var(--success)]' : 'bg-[var(--secondary)] shadow-[0_0_5px_var(--secondary)]'}`}
                          style={{ width: `${job.progress_pct}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-muted)] text-right">{job.worker_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Logs Terminal */}
        <div className="inst-card p-[24px] bg-background border border-[var(--border-color)] font-mono flex flex-col h-[500px]">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px] mb-[16px]">
            <span className="text-[14px] text-[var(--text-main)] font-bold font-heading uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--success)]" />
              <span>Worker Log Stream</span>
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[var(--success)] animate-pulse border border-[var(--success)]/30 px-2 py-1 rounded bg-[var(--success)]/10">LIVE STDIN</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-[8px] text-[12px] text-[var(--text-main)] pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-[var(--text-muted)] italic text-center mt-[100px]">Select a job from the queue to view execution logs...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-[8px] border-l-2 border-[var(--border-color)] pl-[12px] py-[2px] hover:border-[var(--secondary)]/50 transition-colors group">
                  <span className="text-[var(--text-muted)] text-[10px] shrink-0 mt-0.5">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                  <span
                    className={`shrink-0 ${
                      log.log_level === 'ERROR' ? 'text-[var(--danger)] font-bold' : log.log_level === 'WARNING' ? 'text-[#eab308] font-bold' : 'text-[var(--success)] font-bold'
                    }`}
                  >
                    [{log.log_level}]
                  </span>
                  <span className="text-[var(--text-main)] break-all leading-tight opacity-90 group-hover:opacity-100">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingQueueMonitorPage;
