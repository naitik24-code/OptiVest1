import React, { useState, useEffect } from 'react';
import { History, CheckCircle, XCircle, AlertCircle, RefreshCw, Filter } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };
const DIR_COLOR = (d: string) => d === 'UP' ? 'text-[var(--success)]' : d === 'DOWN' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]';
const OUTCOME_ICON = (o: string | null) =>
  o === 'CORRECT' ? <CheckCircle className="w-5 h-5 text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]" /> :
  o === 'INCORRECT' ? <XCircle className="w-5 h-5 text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]" /> :
  <AlertCircle className="w-5 h-5 text-[var(--text-muted)]" />;

export const PredictionHistoryPage: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState('');
  const [limit, setLimit] = useState(50);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (assetFilter) params.set('asset_symbol', assetFilter);
      const [hRes, sRes] = await Promise.all([
        fetch(`/api/v1/ai/predictions/history?${params}`, { headers: getH() }),
        fetch('/api/v1/ai/predictions/stats', { headers: getH() }),
      ]);
      if (hRes.ok) { const d = await hRes.json(); setPredictions(d.predictions || []); }
      if (sRes.ok) setStats(await sRes.json());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Module 11 &bull; Prediction History</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Prediction History
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Every AI prediction with actual outcome tracking and error analysis.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[16px]">
          {[
            {l:'Total Predictions', v: stats.total_predictions, c:'text-[var(--primary)] drop-shadow-[0_0_5px_rgba(255,90,31,0.3)]'},
            {l:'Resolved', v: stats.resolved_predictions, c:'text-[var(--text-main)]'},
            {l:'Correct', v: stats.correct_predictions, c:'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]'},
            {l:'Overall Accuracy', v:`${(stats.overall_accuracy*100).toFixed(1)}%`, c: stats.overall_accuracy >= 0.6 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'},
            {l:'Avg Confidence', v:`${(stats.average_confidence*100).toFixed(1)}%`, c:'text-[#a855f7] drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]'},
          ].map(item => (
            <div key={item.l} className="inst-card p-[20px] flex flex-col items-center justify-center transition-colors hover:border-[var(--primary)]/30">
              <div className={`text-[28px] font-extrabold font-mono leading-none mb-2 ${item.c}`}>{item.v}</div>
              <div className="text-[10px] uppercase font-bold font-mono tracking-wider text-[var(--text-muted)] text-center">{item.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="inst-card p-[16px] flex flex-wrap items-center gap-[16px]">
        <div className="flex items-center gap-2 px-3">
          <Filter className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Filters</span>
        </div>
        <input
          value={assetFilter} onChange={e => setAssetFilter(e.target.value.toUpperCase())}
          placeholder="Symbol (e.g. AAPL)"
          className="bg-background border border-[var(--border-color)] rounded-[6px] px-[14px] py-[10px] text-[13px] font-mono font-bold text-[var(--text-main)] w-48 focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--text-muted)]"
        />
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="bg-background border border-[var(--border-color)] rounded-[6px] px-[14px] py-[10px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer">
          {[25,50,100,200].map(n => <option key={n} value={n}>Last {n} Records</option>)}
        </select>
        <button onClick={load} disabled={loading} className="px-[20px] py-[10px] bg-[var(--primary)] text-[#050608] text-[13px] font-bold font-mono uppercase tracking-wider rounded-[6px] flex items-center gap-2 disabled:opacity-50 hover:bg-[#ff7a45] shadow-[0_0_15px_rgba(255,90,31,0.2)] transition-all cursor-pointer ml-auto">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin fill-current" /> : 'Apply'}
        </button>
      </div>

      {/* Table */}
      <div className="inst-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-[40px] text-center text-[var(--text-muted)] text-[13px] font-mono uppercase tracking-wider">Loading prediction history…</div>
        ) : predictions.length === 0 ? (
          <div className="p-[60px] text-center flex flex-col items-center gap-[16px]">
            <History className="w-12 h-12 text-[var(--text-muted)] opacity-50" />
            <div>
              <p className="text-[15px] font-bold text-[var(--text-main)] mb-1">No predictions recorded yet.</p>
              <p className="text-[13px] font-mono text-[var(--text-muted)]">Use the Prediction Explorer to generate predictions.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] font-mono">
              <thead className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] border-b border-[var(--border-color)] bg-background/50">
                <tr>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Asset</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Algorithm</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Version</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Horizon</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Direction</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Return</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Confidence</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Risk</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)] text-right">Actual Return</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)] text-center">Outcome</th>
                  <th className="py-4 px-4 border-b border-[var(--border-color)]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {predictions.map((p: any, i) => (
                  <tr key={p.id || i} className="hover:bg-background transition-colors">
                    <td className="py-4 px-4 font-bold font-heading text-[15px] text-[var(--text-main)]">{p.asset_symbol}</td>
                    <td className="py-4 px-4 font-mono font-bold text-[var(--text-muted)] uppercase">{p.algorithm}</td>
                    <td className="py-4 px-4 text-[var(--text-muted)]">{p.model_version}</td>
                    <td className="py-4 px-4 text-[var(--text-muted)]">{p.prediction_horizon}</td>
                    <td className={`py-4 px-4 font-extrabold ${DIR_COLOR(p.predicted_direction)}`}>{p.predicted_direction}</td>
                    <td className={`py-4 px-4 text-right font-bold ${p.predicted_return >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {(p.predicted_return * 100).toFixed(3)}%
                    </td>
                    <td className="py-4 px-4 text-right text-[var(--secondary)] font-bold">{(p.confidence_score * 100).toFixed(1)}%</td>
                    <td className="py-4 px-4 text-right text-[#eab308] font-bold">{(p.risk_score * 100).toFixed(1)}%</td>
                    <td className="py-4 px-4 text-right font-mono text-[var(--text-main)] font-bold">
                      {p.actual_return != null ? `${(p.actual_return * 100).toFixed(3)}%` : '—'}
                    </td>
                    <td className="py-4 px-4 flex justify-center">{OUTCOME_ICON(p.outcome)}</td>
                    <td className="py-4 px-4 text-[var(--text-muted)] font-mono text-[11px]">
                      {p.prediction_timestamp ? new Date(p.prediction_timestamp).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default PredictionHistoryPage;
