import React, { useState, useEffect } from 'react';
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Module 9 &bull; Audit Trail</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            APDE Decision History Log
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Persistent audit trail of all accepted, rejected, and modified portfolio governance decisions
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          Refresh Audit Log
        </button>
      </div>

      {/* History Table */}
      <div className="inst-card p-[24px]">
        {history.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] font-mono text-[13px]">
             {loading ? (
               <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
             ) : (
               <span>No decision history logs recorded yet.</span>
             )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] uppercase font-mono text-[var(--text-muted)] tracking-wider">
                  <th className="py-3 px-3 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">Action</th>
                  <th className="py-3 px-3 font-semibold">Recommendation</th>
                  <th className="py-3 px-3 font-semibold">Reallocation</th>
                  <th className="py-3 px-3 font-semibold">Market Regime</th>
                  <th className="py-3 px-3 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-background transition-colors">
                    <td className="py-4 px-3 font-mono text-[12px] text-[var(--text-muted)]">
                      {row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-[10px] py-[4px] rounded-[6px] text-[10px] font-bold font-mono tracking-wider uppercase border ${
                        row.action_taken === 'ACCEPTED' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30' :
                        row.action_taken === 'REJECTED' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30' :
                        'bg-[#eab308]/10 text-[#eab308] border-[#eab308]/30'
                      }`}>
                        {row.action_taken}
                      </span>
                    </td>
                    <td className="py-4 px-3 font-bold font-heading text-[14px] text-[var(--text-main)]">
                      {row.recommendation_type.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-3 font-mono text-[13px]">
                      {(row.reallocation_pct * 100).toFixed(0)}% ({row.source_asset || 'CASH'} &rarr; {row.target_asset})
                    </td>
                    <td className="py-4 px-3 text-[12px] font-mono text-[var(--text-muted)]">
                      {row.market_regime}
                    </td>
                    <td className="py-4 px-3 font-mono font-extrabold text-[15px] text-[var(--secondary)]">
                      {(row.confidence_score * 100).toFixed(0)}%
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

export default DecisionHistoryPage;
