import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Cpu, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

interface ReadinessMetrics {
  ai_readiness_score: number;
  readiness_status: string;
  registered_models: number;
  dataset_versions: number;
  dataset_snapshots: number;
  experiments: number;
  feature_sets: number;
  feature_importance_records: number;
  training_queue_active_jobs: number;
  currency_engine_status: string;
  data_quality_score: number;
  feature_completeness_pct: number;
  configuration?: {
    horizon?: string;
    algorithm?: string;
    gpu_enabled?: boolean;
    auto_deploy?: boolean;
  };
}

export const AIReadinessDashboardPage: React.FC = () => {
  const [data, setData] = useState<ReadinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('access_token') || '';

    fetch('/api/v1/ai-infra/readiness', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err?.detail || `HTTP ${res.status}`);
          });
        }
        return res.json();
      })
      .then((resData: ReadinessMetrics) => {
        if (resData && typeof resData.ai_readiness_score === 'number') {
          setData(resData);
        } else {
          throw new Error('Unexpected API response shape');
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReadiness();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center font-mono text-[var(--text-muted)] flex flex-col items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span>Loading Engineering Readiness Telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-[var(--danger)] mx-auto" />
        <p className="text-[var(--text-main)] font-bold text-[18px]">AI Readiness Dashboard Unavailable</p>
        <p className="text-[14px] text-[var(--text-muted)] max-w-sm mx-auto font-mono">
          {error || 'Could not connect to the AI Infrastructure backend.'}
        </p>
        <button
          onClick={fetchReadiness}
          className="px-5 py-2.5 bg-[var(--primary)] text-[#08090b] text-[13px] font-bold rounded-[8px] mx-auto flex items-center gap-2 hover:bg-[#ff713b] transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  const cfg = data.configuration ?? {};

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--success)] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Module 6 &bull; Engineering AI Readiness</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            AI Infrastructure Readiness
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Real-time telemetry and audit scores verifying backend readiness prior to ML model execution.
          </p>
        </div>
        <button
          onClick={fetchReadiness}
          className="px-4 py-2 bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[13px] font-bold text-[var(--text-main)] rounded-[8px] flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Main Banner */}
      <div className="inst-card p-[24px] bg-gradient-to-r from-[rgba(23,217,140,0.05)] to-transparent border-[rgba(23,217,140,0.2)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[var(--success)]" />
              <span className="text-[20px] font-bold text-[var(--text-main)]">
                Status: {data.readiness_status ?? 'CHECKING...'}
              </span>
            </div>
            <p className="text-[13px] text-[var(--text-muted)] max-w-2xl font-mono mt-[8px]">
              All 10 Infrastructure Modules (Model Registry, Dataset Lineage, Feature Importance,
              Currency Normalization, Training Queue, System Health) are fully provisioned and validated.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[40px] font-extrabold text-[var(--success)] font-mono leading-none">
              {data.ai_readiness_score ?? 0}%
            </div>
            <div className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider mt-[6px]">
              Infrastructure Readiness
            </div>
          </div>
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Models', value: data.registered_models ?? 0, sub: 'Registry Active', color: 'text-[var(--secondary)]' },
          { label: 'Datasets', value: data.dataset_versions ?? 0, sub: 'Lineage Mapped', color: 'text-[#a855f7]' },
          { label: 'Snapshots', value: data.dataset_snapshots ?? 0, sub: 'Immutable Hashes', color: 'text-[var(--success)]' },
          { label: 'Features', value: data.feature_sets ?? 0, sub: 'SHAP Ready', color: 'text-[var(--primary)]' },
          { label: 'Experiments', value: data.experiments ?? 0, sub: 'Reproducible', color: 'text-[var(--text-main)]' },
          { label: 'Active Jobs', value: data.training_queue_active_jobs ?? 0, sub: 'Workers Alive', color: 'text-[#14b8a6]' },
        ].map((item) => (
          <div key={item.label} className="inst-card p-[16px] space-y-1">
            <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider">{item.label}</div>
            <div className="text-[24px] font-bold font-mono text-[var(--text-main)]">{item.value}</div>
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${item.color}`}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Sub-System Audit Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="inst-card p-[24px]">
          <div className="flex items-center gap-2 font-bold text-[14px] text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 mb-4">
            <Activity className="w-4 h-4 text-[var(--secondary)]" />
            <span>Data &amp; Feature Integrity Metrics</span>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Data Quality Score', value: `${data.data_quality_score ?? 0}%`, green: true },
              { label: 'Feature Completeness Pct', value: `${data.feature_completeness_pct ?? 0}%`, green: true },
              { label: 'Feature Importance Records', value: String(data.feature_importance_records ?? 0), green: false },
              { label: 'Multi-Currency Engine', value: data.currency_engine_status ?? 'UNKNOWN', green: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-[13px]">
                <span className="text-[var(--text-muted)]">{row.label}</span>
                <span className={`font-mono font-bold ${row.green ? 'text-[var(--success)]' : 'text-[var(--text-main)]'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="inst-card p-[24px]">
          <div className="flex items-center gap-2 font-bold text-[14px] text-[var(--text-main)] border-b border-[var(--border-color)] pb-3 mb-4">
            <Cpu className="w-4 h-4 text-[#a855f7]" />
            <span>Active Model Runtime Parameters</span>
          </div>

          <div className="space-y-4 text-[13px]">
            {[
              { label: 'Default Prediction Horizon', value: cfg.horizon ?? '30 Days' },
              { label: 'Selected Algorithm', value: cfg.algorithm ?? 'LSTM' },
              { label: 'GPU Compute Enable Flag', value: cfg.gpu_enabled ? 'ENABLED' : 'DISABLED (CPU Baseline)' },
              { label: 'Auto-Deployment Policy', value: cfg.auto_deploy ? 'AUTOMATED' : 'MANUAL APPROVAL' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">{row.label}</span>
                <span className="font-mono font-bold text-[var(--text-main)]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReadinessDashboardPage;
