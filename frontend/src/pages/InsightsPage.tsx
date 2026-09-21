import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-500" />
            Quantitative Investment Insights &amp; Explainability
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Dynamic Explainable AI (XAI) feature attributions and APDE reallocation rationales.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!cards.length && !loading ? (
        <Card className="p-8 text-center text-[var(--text-muted)]">No active insights or recommendations.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((rec) => (
            <Card key={rec.id} title={`${rec.target_asset || 'CASH'} — ${rec.recommendation_type}`} subtitle={`Confidence Level: ${(rec.confidence_score * 100).toFixed(1)}%`}>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Suggested Reallocation</div>
                    <div className="text-base font-bold font-heading text-[var(--text-main)] mt-0.5">{rec.recommendation_type}</div>
                  </div>
                  <div className="text-lg font-mono font-black text-[#16A34A]">
                    +{(rec.reallocation_pct * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase mb-2 flex items-center gap-1">
                     <Activity className="w-3.5 h-3.5" /> Expected Portfolio Impact
                  </h4>
                  <p className="text-xs text-[var(--text-main)] leading-relaxed bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)]">
                    Expected return improvement: +{(rec.expected_return_improvement * 100).toFixed(2)}%. 
                    Risk reduction: {(rec.risk_reduction_pct * 100).toFixed(2)}%.
                    Optimization target aligned with {rec.market_regime.toLowerCase()} market regime.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase mb-2">Explainable AI Attributions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)] gap-4">
                      <span className="text-[var(--text-muted)] w-24 flex-shrink-0">Why Stock</span>
                      <span className="font-bold text-[#16A34A] text-right line-clamp-2">{rec.why_this_stock}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)] gap-4">
                      <span className="text-[var(--text-muted)] w-24 flex-shrink-0">Why Now</span>
                      <span className="font-bold text-amber-500 text-right line-clamp-2">{rec.why_now}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)] gap-4">
                      <span className="text-[var(--text-muted)] w-24 flex-shrink-0">Percentage</span>
                      <span className="font-bold text-blue-500 text-right line-clamp-2">{rec.why_this_percentage}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
