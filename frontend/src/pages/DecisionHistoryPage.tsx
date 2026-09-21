import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { History, RefreshCw } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface HistoryItem {
  id: string;
  card_id: string;
  action_taken: string;
  recommendation_type: string;
  source_asset: string;
  target_asset: string;
  reallocation_pct: number;
  confidence_score: number;
  market_regime: string;
  timestamp: string;
}

export const DecisionHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let activePid = portfolioId;
      if (!activePid) {
        const pRes = await fetch('/api/v1/portfolios', { headers: getH() });
        if (pRes.ok) {
          const pData = await pRes.json();
          const ports = pData.data || [];
          if (ports.length > 0) {
            activePid = ports[0].id;
            setPortfolioId(activePid);
          }
        }
      }
      
      if (activePid) {
        const res = await fetch(`/api/v1/apde/history/${activePid}`, { headers: getH() });
        if (res.ok) setHistory(await res.json());
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            APDE Decision History Audit Log
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Module 9 — Persistent audit trail of all accepted, rejected, and modified portfolio governance decisions
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-3.5 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Log
        </button>
      </div>

      {/* History Table */}
      <Card className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
        {history.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No decision history logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-color)] text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Recommendation</th>
                  <th className="py-2.5 px-3">Reallocation</th>
                  <th className="py-2.5 px-3">Market Regime</th>
                  <th className="py-2.5 px-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-[var(--text-muted)]">
                      {row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        row.action_taken === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300' :
                        row.action_taken === 'REJECTED' ? 'bg-red-500/20 text-red-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {row.action_taken}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--text-main)]">
                      {row.recommendation_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      {(row.reallocation_pct * 100).toFixed(0)}% ({row.source_asset || 'CASH'} → {row.target_asset})
                    </td>
                    <td className="py-3 px-3 text-xs text-[var(--text-muted)]">
                      {row.market_regime}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-400">
                      {(row.confidence_score * 100).toFixed(0)}%
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
