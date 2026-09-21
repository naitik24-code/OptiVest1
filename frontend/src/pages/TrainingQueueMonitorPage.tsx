import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Play, Terminal, Clock, RefreshCw, Cpu } from 'lucide-react';


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

  if (loading) {
    return <div className="p-8 text-center text-[var(--text-muted)]">Loading AI Training Queue Telemetry...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>Module 3 &amp; 10 &bull; Asynchronous Training Queue &amp; MLOps</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            AI Training Queue Orchestrator
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Asynchronous job queue, worker execution status, progress tracking, and live training logs.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Enqueue Form */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-[#2563EB]" />
          <span>Enqueue New AI Training Job</span>
        </h3>
        <form onSubmit={handleEnqueue} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Job Name (e.g. LSTM Price Predictor Baseline)"
            value={newJobName}
            onChange={(e) => setNewJobName(e.target.value)}
            className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
          />
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
          >
            <option value="LSTM">LSTM</option>
            <option value="XGBOOST">XGBOOST</option>
            <option value="TRANSFORMER">TRANSFORMER</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md transition-all shrink-0"
          >
            Enqueue Job
          </button>
        </form>
      </Card>

      {/* Main Grid: Queue Table + Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0EA5E9]" />
            <span>Active &amp; Historical Queue Jobs ({jobs.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono">
                  <th className="py-2.5 px-3">Job Name</th>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Worker ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)] font-mono">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      fetchLogs(job.id);
                    }}
                    className={`cursor-pointer transition-colors ${
                      selectedJobId === job.id ? 'bg-[#2563EB]/15' : 'hover:bg-[var(--bg-main)]/50'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-[var(--text-main)]">{job.job_name}</td>
                    <td className="py-3 px-3 text-[#0EA5E9]">{job.algorithm}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/50'
                            : job.status === 'RUNNING'
                            ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50 animate-pulse'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-20 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#2563EB] h-full transition-all"
                          style={{ width: `${job.progress_pct}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{job.worker_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Logs Terminal */}
        <Card className="p-5 space-y-3 bg-slate-950 border-slate-800 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
            <span className="text-slate-200 font-bold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Worker Log Stream</span>
            </span>
            <span className="text-[10px] text-slate-500">LIVE STDIN</span>
          </div>

          <div className="h-80 overflow-y-auto space-y-2 text-[11px] text-slate-300 pr-1">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">Select a job from the queue to view execution logs...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="space-x-2 border-l-2 border-slate-800 pl-2 py-0.5">
                  <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span
                    className={
                      log.log_level === 'ERROR' ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'
                    }
                  >
                    [{log.log_level}]
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TrainingQueueMonitorPage;
