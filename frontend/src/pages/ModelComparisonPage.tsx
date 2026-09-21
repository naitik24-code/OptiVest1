import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { BarChart3, ArrowRightLeft } from 'lucide-react';

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
    fetch('/api/v1/ai-infra/models', { headers })
      .then((res) => res.ok ? res.json() : [])
      .then(async (data) => {
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
    return <div className="p-8 text-center text-[var(--text-muted)]">Loading Model Comparison Engine...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Module 8 &bull; Model Comparison Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Model Metrics Comparison &amp; Evaluation
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Side-by-side performance evaluation across Accuracy, Precision, Recall, RMSE, MAE, MAPE, and latency.
          </p>
        </div>
      </div>

      {compared.length === 0 ? (
        <Card className="p-8 text-center text-[var(--text-muted)] text-sm">
          No registered model versions available for comparison. Register model versions in the AI Registry first.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {compared.map((item) => (
              <Card key={item.version_id} className="p-5 space-y-4 border-l-4 border-l-[#2563EB]">
                <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-main)]">{item.model_name}</h3>
                    <div className="text-xs text-[var(--text-muted)] font-mono">
                      {item.algorithm} &bull; {item.version}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-900/40 text-blue-400 border border-blue-700/50">
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)]">Accuracy</div>
                    <div className="text-sm font-bold font-mono text-[#16A34A]">{Math.round(item.accuracy * 100)}%</div>
                  </div>
                  <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)]">F1 Score</div>
                    <div className="text-sm font-bold font-mono text-[#0EA5E9]">{item.f1_score.toFixed(3)}</div>
                  </div>
                  <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)]">RMSE</div>
                    <div className="text-sm font-bold font-mono text-[var(--text-main)]">{item.rmse.toFixed(3)}</div>
                  </div>
                  <div className="bg-[var(--bg-main)] p-2.5 rounded border border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)]">MAPE</div>
                    <div className="text-sm font-bold font-mono text-[var(--text-main)]">{item.mape.toFixed(2)}%</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] pt-2 border-t border-[var(--border-color)]">
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Dataset Version</span>
                    <span className="font-mono text-[var(--text-main)]">{item.dataset_version}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Feature Version</span>
                    <span className="font-mono text-[var(--text-main)]">{item.feature_set_version}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Training Time</span>
                    <span className="font-mono text-[var(--text-main)]">{item.training_time_seconds}s</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Inference Latency</span>
                    <span className="font-mono text-[var(--text-main)]">{item.inference_time_ms}ms</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Comparison Matrix Table */}
          <Card className="p-5 overflow-hidden">
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0EA5E9]" />
              <span>Full Model Comparison Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono">
                    <th className="py-2.5 px-3">Model &amp; Version</th>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">F1 Score</th>
                    <th className="py-2.5 px-3">RMSE</th>
                    <th className="py-2.5 px-3">MAE</th>
                    <th className="py-2.5 px-3">Inference Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-main)] font-mono">
                  {compared.map((c) => (
                    <tr key={c.version_id} className="hover:bg-[var(--bg-main)]/50">
                      <td className="py-3 px-3 font-semibold text-[var(--text-main)]">
                        {c.model_name} <span className="text-[var(--text-muted)] font-normal">({c.version})</span>
                      </td>
                      <td className="py-3 px-3 text-[#0EA5E9]">{c.algorithm}</td>
                      <td className="py-3 px-3 text-[#16A34A] font-bold">{(c.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(c.precision * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{(c.recall * 100).toFixed(1)}%</td>
                      <td className="py-3 px-3">{c.f1_score.toFixed(3)}</td>
                      <td className="py-3 px-3">{c.rmse.toFixed(3)}</td>
                      <td className="py-3 px-3">{c.mae.toFixed(3)}</td>
                      <td className="py-3 px-3">{c.inference_time_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ModelComparisonPage;
