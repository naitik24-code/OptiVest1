import React, { useState, useEffect } from 'react';
import { RefreshCw, BrainCircuit, Activity } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface DecisionCardData {
  id: string;
  title: string;
  recommendation_type: string;
  source_asset: string;
  target_asset: string;
  reallocation_pct: number;
  capital_amount: number;
  current_allocation_pct: number;
  proposed_allocation_pct: number;
  expected_return_improvement: number;
  risk_reduction_pct: number;
  confidence_score: number;
  decision_score: number;
  why_this_stock: string;
  why_not_another: string;
  why_now: string;
  why_this_percentage: string;
  model_used: string;
  market_regime: string;
  status: string;
}

export const InsightsPage: React.FC = () => {
  const [cards, setCards] = useState<DecisionCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);

  const fetchData = async () => {
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
        const cRes = await fetch(`/api/v1/apde/cards/${activePid}`, { headers: getH() });
        if (cRes.ok) setCards(await cRes.json());
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#a855f7] uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span>Explainable AI</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Quantitative Investment Insights
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Dynamic Explainable AI (XAI) feature attributions and APDE reallocation rationales.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[#a855f7] text-[var(--text-main)] transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#a855f7]' : ''}`} />
          Refresh Insights
        </button>
      </div>

      {!cards.length && !loading ? (
        <div className="inst-card p-12 text-center text-[var(--text-muted)] font-mono text-[13px]">No active insights or recommendations available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((rec) => (
            <div key={rec.id} className="inst-card p-[24px] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-[#a855f7] group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-shadow" />
              
              <div className="mb-5 pb-4 border-b border-[var(--border-color)]">
                <div className="text-[18px] font-bold font-heading text-[var(--text-main)] mb-1">
                  {rec.target_asset || 'CASH'} &mdash; {rec.recommendation_type}
                </div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Confidence Level: <span className="text-[#a855f7] font-bold">{(rec.confidence_score * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-[16px] rounded-[10px] bg-background border border-[var(--border-color)]">
                  <div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">Suggested Reallocation</div>
                    <div className="text-[15px] font-bold font-heading text-[var(--text-main)]">{rec.recommendation_type}</div>
                  </div>
                  <div className="text-[28px] font-mono font-extrabold text-[var(--success)] leading-none drop-shadow-[0_0_8px_rgba(23,217,140,0.3)]">
                    +{(rec.reallocation_pct * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <h4 className="text-[12px] font-mono font-bold text-[var(--text-muted)] uppercase mb-[10px] tracking-wider flex items-center gap-2">
                     <Activity className="w-4 h-4 text-[var(--primary)]" /> Expected Portfolio Impact
                  </h4>
                  <p className="text-[13px] text-[var(--text-muted)] font-mono leading-relaxed bg-background p-[16px] rounded-[10px] border border-[var(--border-color)]">
                    Expected return improvement: <span className="text-[var(--success)] font-bold">+{(rec.expected_return_improvement * 100).toFixed(2)}%</span>.<br/> 
                    Risk reduction: <span className="text-[var(--secondary)] font-bold">{(rec.risk_reduction_pct * 100).toFixed(2)}%</span>.<br/>
                    Optimization target aligned with <span className="text-[var(--text-main)] font-bold uppercase">{rec.market_regime.toLowerCase()}</span> market regime.
                  </p>
                </div>

                <div>
                  <h4 className="text-[12px] font-mono font-bold text-[var(--text-muted)] uppercase mb-[10px] tracking-wider flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-[#a855f7]" />
                    Explainable AI Attributions
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[12px] font-mono p-[14px] rounded-[8px] bg-background border border-[var(--border-color)] gap-4">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider w-[100px] flex-shrink-0">Why Stock</span>
                      <span className="font-bold text-[var(--success)] text-right line-clamp-2 leading-relaxed">{rec.why_this_stock}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12px] font-mono p-[14px] rounded-[8px] bg-background border border-[var(--border-color)] gap-4">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider w-[100px] flex-shrink-0">Why Now</span>
                      <span className="font-bold text-[#eab308] text-right line-clamp-2 leading-relaxed">{rec.why_now}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12px] font-mono p-[14px] rounded-[8px] bg-background border border-[var(--border-color)] gap-4">
                      <span className="text-[var(--text-muted)] uppercase tracking-wider w-[100px] flex-shrink-0">Percentage</span>
                      <span className="font-bold text-[var(--secondary)] text-right line-clamp-2 leading-relaxed">{rec.why_this_percentage}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
