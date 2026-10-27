import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowRightLeft, RefreshCw } from 'lucide-react';

interface ModelComparisonItem {
  version_id: string;
  model_name: string;
  algorithm: string;
  version: string;
  dataset_version: string;
  feature_set_version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  rmse: number;
  mae: number;
  mape: number;
  status: string;
  training_time_seconds: number;
  inference_time_ms: number;
}

export const ModelComparisonPage: React.FC = () => {
  const [compared, setCompared] = useState<ModelComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('access_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const headers = getAuthHeaders();
    fetch('/api/v1/ai/evaluate/compare/all', { headers })
      .then((res) => res.ok ? res.json() : null)
      .then(async (trained) => {
        const trainedRows = trained?.comparison || [];
        if (trainedRows.length > 0) {
          setCompared(trainedRows.map((m: any) => ({
            version_id: m.id,
            model_name: m.name || m.algorithm,
            algorithm: m.algorithm,
            version: m.version || 'v1.0.0',
            dataset_version: m.dataset_version || 'Yahoo Finance 5Y',
            feature_set_version: m.feature_version || 'v1.0.0',
            accuracy: m.directional_accuracy || 0,
            precision: m.precision || 0,
            recall: m.recall || 0,
            f1_score: m.f1_score || 0,
            rmse: m.rmse || 0,
            mae: m.mae || 0,
            mape: m.mape || 0,
            status: m.status || 'ACTIVE',
            training_time_seconds: m.training_duration_s || 0,
            inference_time_ms: m.inference_latency_ms || 0,
          })));
          setLoading(false);
          return;
        }
        const data = await (await fetch('/api/v1/ai-infra/models', { headers })).json();
        if (Array.isArray(data) && data.length > 0) {
          const verRes = await fetch(`/api/v1/ai-infra/models/${data[0].id}/versions`, { headers });
          const verData = verRes.ok ? await verRes.json() : [];
          if (Array.isArray(verData) && verData.length > 0) {
            const vIds = verData.map((v: any) => v.id).join(',');
            const compRes = await fetch(`/api/v1/ai-infra/models/compare?version_ids=${vIds}`, { headers });
            const compData = compRes.ok ? await compRes.json() : [];
            if (Array.isArray(compData)) setCompared(compData);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)] font-mono text-[13px]">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--secondary)]" />
        <span>Loading Model Comparison Engine...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#a855f7] uppercase tracking-wider mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Module 8 &bull; Model Comparison Engine</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Model Metrics Comparison &amp; Evaluation
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Side-by-side performance evaluation across Accuracy, Precision, Recall, RMSE, MAE, MAPE, and latency.
          </p>
        </div>
      </div>

      {compared.length === 0 ? (
        <div className="inst-card p-12 text-center text-[var(--text-muted)] text-[13px] font-mono">
          No registered model versions available for comparison. Register model versions in the AI Registry first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compared.map((item) => (
              <div key={item.version_id} className="inst-card p-[24px] relative overflow-hidden group border-l-4 border-l-[#a855f7]">
                <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-[16px] mb-[16px]">
                  <div>
                    <h3 className="font-bold font-heading text-[16px] text-[var(--text-main)] mb-1">{item.model_name}</h3>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
                      {item.algorithm} &bull; <span className="text-[#a855f7] font-bold">{item.version}</span>
                    </div>
                  </div>
                  <span className="px-[8px] py-[4px] rounded-[4px] text-[10px] font-bold uppercase tracking-wider font-mono bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/30">
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-[12px] mb-[20px]">
                  <div className="bg-background p-[12px] rounded-[8px] border border-[var(--border-color)]">
                    <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Accuracy</div>
                    <div className="text-[18px] font-bold font-mono text-[var(--success)] leading-none">{Math.round(item.accuracy * 100)}%</div>
                  </div>
                  <div className="bg-background p-[12px] rounded-[8px] border border-[var(--border-color)]">
                    <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">F1 Score</div>
                    <div className="text-[18px] font-bold font-mono text-[#a855f7] leading-none">{item.f1_score.toFixed(3)}</div>
                  </div>
                  <div className="bg-background p-[12px] rounded-[8px] border border-[var(--border-color)]">
                    <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">RMSE</div>
                    <div className="text-[16px] font-bold font-mono text-[var(--text-main)] leading-none">{item.rmse.toFixed(3)}</div>
                  </div>
                  <div className="bg-background p-[12px] rounded-[8px] border border-[var(--border-color)]">
                    <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">MAPE</div>
                    <div className="text-[16px] font-bold font-mono text-[var(--text-main)] leading-none">{item.mape.toFixed(2)}%</div>
                  </div>
                </div>

                <div className="space-y-[10px] text-[11px] font-mono pt-[16px] border-t border-[var(--border-color)]">
                  <div className="flex justify-between items-center text-[var(--text-muted)] uppercase tracking-wider">
                    <span>Dataset Version</span>
                    <span className="font-bold text-[var(--text-main)]">{item.dataset_version}</span>
                  </div>
                  <div className="flex justify-between items-center text-[var(--text-muted)] uppercase tracking-wider">
                    <span>Feature Version</span>
                    <span className="font-bold text-[var(--text-main)]">{item.feature_set_version}</span>
                  </div>
                  <div className="flex justify-between items-center text-[var(--text-muted)] uppercase tracking-wider">
                    <span>Training Time</span>
                    <span className="font-bold text-[var(--secondary)]">{item.training_time_seconds}s</span>
                  </div>
                  <div className="flex justify-between items-center text-[var(--text-muted)] uppercase tracking-wider">
                    <span>Inference Latency</span>
                    <span className="font-bold text-[var(--primary)]">{item.inference_time_ms}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Matrix Table */}
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading tracking-wider text-[var(--text-main)] mb-[24px] flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
              <BarChart3 className="w-5 h-5 text-[var(--secondary)]" />
              <span>Full Model Comparison Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-mono font-bold">
                    <th className="py-3 px-3">Model &amp; Version</th>
                    <th className="py-3 px-3">Algorithm</th>
                    <th className="py-3 px-3">Accuracy</th>
                    <th className="py-3 px-3">Precision</th>
                    <th className="py-3 px-3">Recall</th>
                    <th className="py-3 px-3">F1 Score</th>
                    <th className="py-3 px-3">RMSE</th>
                    <th className="py-3 px-3">MAE</th>
                    <th className="py-3 px-3">Inference Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)] font-mono text-[13px]">
                  {compared.map((c) => (
                    <tr key={c.version_id} className="hover:bg-background transition-colors">
                      <td className="py-4 px-3 font-bold text-[var(--text-main)] font-heading text-[14px]">
                        {c.model_name} <span className="text-[var(--text-muted)] font-normal text-[12px] font-mono">({c.version})</span>
                      </td>
                      <td className="py-4 px-3 text-[#a855f7] font-bold uppercase tracking-wider text-[11px]">{c.algorithm}</td>
                      <td className="py-4 px-3 text-[var(--success)] font-extrabold text-[15px]">{(c.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-4 px-3">{(c.precision * 100).toFixed(1)}%</td>
                      <td className="py-4 px-3">{(c.recall * 100).toFixed(1)}%</td>
                      <td className="py-4 px-3 font-bold">{c.f1_score.toFixed(3)}</td>
                      <td className="py-4 px-3">{c.rmse.toFixed(3)}</td>
                      <td className="py-4 px-3">{c.mae.toFixed(3)}</td>
                      <td className="py-4 px-3 font-bold text-[var(--secondary)]">{c.inference_time_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelComparisonPage;
