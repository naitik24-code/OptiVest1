import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { History, CheckCircle, XCircle, AlertCircle, RefreshCw, Filter } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };
const DIR_COLOR = (d: string) => d === 'UP' ? 'text-emerald-400' : d === 'DOWN' ? 'text-red-400' : 'text-slate-400';
const OUTCOME_ICON = (o: string | null) =>
  o === 'CORRECT' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
  o === 'INCORRECT' ? <XCircle className="w-4 h-4 text-red-400" /> :
  <AlertCircle className="w-4 h-4 text-slate-500" />;

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
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-1">
          <History className="w-4 h-4" /><span>Module 11 · Prediction History</span>
        </div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">Prediction History</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Every AI prediction with actual outcome tracking and error analysis.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {l:'Total Predictions', v: stats.total_predictions, c:'text-blue-400'},
            {l:'Resolved', v: stats.resolved_predictions, c:'text-slate-300'},
            {l:'Correct', v: stats.correct_predictions, c:'text-emerald-400'},
            {l:'Overall Accuracy', v:`${(stats.overall_accuracy*100).toFixed(1)}%`, c: stats.overall_accuracy >= 0.6 ? 'text-emerald-400' : 'text-amber-400'},
            {l:'Avg Confidence', v:`${(stats.average_confidence*100).toFixed(1)}%`, c:'text-purple-400'},
          ].map(item => (
            <Card key={item.l} className="p-4 text-center">
              <div className={`text-2xl font-extrabold font-mono ${item.c}`}>{item.v}</div>
              <div className="text-[9px] uppercase font-bold text-[var(--text-muted)] mt-1">{item.l}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 flex items-center gap-4">
        <Filter className="w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={assetFilter} onChange={e => setAssetFilter(e.target.value.toUpperCase())}
          placeholder="Filter by asset (e.g. AAPL)"
          className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] w-40 focus:outline-none"
        />
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] focus:outline-none">
          {[25,50,100,200].map(n => <option key={n} value={n}>Last {n}</option>)}
        </select>
        <button onClick={load} disabled={loading} className="px-4 py-1.5 bg-[#2563EB] text-white text-xs font-bold rounded-lg flex items-center gap-2 disabled:opacity-50">
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Apply'}
        </button>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[var(--text-muted)] text-sm">Loading prediction history…</div>
        ) : predictions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <History className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <p className="text-sm text-[var(--text-muted)]">No predictions recorded yet.</p>
            <p className="text-xs text-[var(--text-muted)]">Use the Prediction Explorer to generate predictions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                  {['Asset','Algorithm','Version','Horizon','Direction','Return','Confidence','Risk','Actual Return','Outcome','Timestamp'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map((p: any, i) => (
                  <tr key={p.id || i} className="border-b border-[var(--border-color)]/30 hover:bg-[var(--bg-card)]/40 transition-colors">
                    <td className="px-3 py-2 font-bold text-[var(--text-main)]">{p.asset_symbol}</td>
                    <td className="px-3 py-2 font-mono text-[var(--text-muted)]">{p.algorithm}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{p.model_version}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)]">{p.prediction_horizon}</td>
                    <td className={`px-3 py-2 font-bold ${DIR_COLOR(p.predicted_direction)}`}>{p.predicted_direction}</td>
                    <td className={`px-3 py-2 font-mono ${p.predicted_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(p.predicted_return * 100).toFixed(3)}%
                    </td>
                    <td className="px-3 py-2 text-blue-400">{(p.confidence_score * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 text-amber-400">{(p.risk_score * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 font-mono text-[var(--text-muted)]">
                      {p.actual_return != null ? `${(p.actual_return * 100).toFixed(3)}%` : '—'}
                    </td>
                    <td className="px-3 py-2">{OUTCOME_ICON(p.outcome)}</td>
                    <td className="px-3 py-2 text-[var(--text-muted)] font-mono">
                      {p.prediction_timestamp ? new Date(p.prediction_timestamp).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
export default PredictionHistoryPage;
