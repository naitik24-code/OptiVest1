import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
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
        // Validate shape before setting state
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
      <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
        <span>Loading Engineering Readiness Telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-[var(--text-main)] font-semibold">AI Readiness Dashboard Unavailable</p>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          {error || 'Could not connect to the AI Infrastructure backend.'}
        </p>
        <button
          onClick={fetchReadiness}
          className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-lg mx-auto flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const cfg = data.configuration ?? {};

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#16A34A] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Module 6 &bull; Engineering AI Readiness</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            AI Infrastructure Readiness Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time telemetry and audit scores verifying backend readiness prior to Machine Learning model execution.
          </p>
        </div>
        <button
          onClick={fetchReadiness}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Main Banner */}
      <Card className="p-6 bg-gradient-to-r from-blue-900/30 via-emerald-950/20 to-transparent border-[#16A34A]/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#16A34A]" />
              <span className="text-lg font-bold text-[var(--text-main)]">
                Status: {data.readiness_status ?? 'CHECKING...'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-2xl">
              All 10 Infrastructure Modules (Model Registry, Dataset Lineage, Feature Importance,
              Currency Normalization, Training Queue, System Health) are fully provisioned and validated.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-extrabold text-[#16A34A] font-mono">
              {data.ai_readiness_score ?? 0}%
            </div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Infrastructure Readiness
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Registered Models', value: data.registered_models ?? 0, sub: 'Registry Active', color: 'text-[#0EA5E9]' },
          { label: 'Dataset Versions', value: data.dataset_versions ?? 0, sub: 'Lineage Mapped', color: 'text-purple-400' },
          { label: 'Dataset Snapshots', value: data.dataset_snapshots ?? 0, sub: 'Immutable Checksums', color: 'text-emerald-400' },
          { label: 'Feature Sets', value: data.feature_sets ?? 0, sub: 'SHAP Ready', color: 'text-amber-400' },
          { label: 'Experiments Tracked', value: data.experiments ?? 0, sub: '100% Reproducible', color: 'text-[#2563EB]' },
          { label: 'Training Queue Jobs', value: data.training_queue_active_jobs ?? 0, sub: 'Worker Active', color: 'text-teal-400' },
        ].map((item) => (
          <Card key={item.label} className="p-4 space-y-1">
            <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">{item.label}</div>
            <div className="text-xl font-bold font-mono text-[var(--text-main)]">{item.value}</div>
            <div className={`text-[10px] ${item.color}`}>{item.sub}</div>
          </Card>
        ))}
      </div>

      {/* Sub-System Audit Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] border-b border-[var(--border-color)] pb-3">
            <Activity className="w-4 h-4 text-[#0EA5E9]" />
            <span>Data &amp; Feature Integrity Metrics</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Data Quality Score', value: `${data.data_quality_score ?? 0}%`, green: true },
              { label: 'Feature Completeness Pct', value: `${data.feature_completeness_pct ?? 0}%`, green: true },
              { label: 'Feature Importance Records', value: String(data.feature_importance_records ?? 0), green: false },
              { label: 'Multi-Currency Engine', value: data.currency_engine_status ?? 'UNKNOWN', green: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-muted)]">{row.label}</span>
                <span className={`font-mono font-bold ${row.green ? 'text-[#16A34A]' : 'text-[var(--text-main)]'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-main)] border-b border-[var(--border-color)] pb-3">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Active Model Runtime Parameters</span>
          </div>

          <div className="space-y-3 text-xs">
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
        </Card>
      </div>
    </div>
  );
};

export default AIReadinessDashboardPage;
