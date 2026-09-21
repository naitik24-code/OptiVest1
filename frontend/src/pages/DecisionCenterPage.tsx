import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { CheckCircle2, XCircle, RefreshCw, BarChart2, Zap } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface HealthData {
  health_score: number;
  diversification_score: number;
  risk_score: number;
  overall_health_rating: string;
  expected_return_annual: number;
  portfolio_volatility: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  sector_concentration: number;
  asset_concentration: number;
}

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

export const DecisionCenterPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [cards, setCards] = useState<DecisionCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        const [hRes, cRes] = await Promise.all([
          fetch(`/api/v1/apde/health/${activePid}`, { headers: getH() }),
          fetch(`/api/v1/apde/cards/${activePid}`, { headers: getH() }),
        ]);
        if (hRes.ok) setHealth(await hRes.json());
        if (cRes.ok) setCards(await cRes.json());
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (cardId: string, action: string) => {
    setActionLoading(cardId);
    try {
      const res = await fetch(`/api/v1/apde/cards/${cardId}/action?action=${action}`, {
        method: 'POST',
        headers: getH(),
      });
      if (res.ok) {
        setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, status: action } : c)));
      }
    } catch (_) {}
    setActionLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-400" />
            Adaptive Portfolio Decision Center
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Phase 6 — AI-driven reallocation recommendations with governance & decision explainability
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-3.5 py-1.5 rounded-lg transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Re-Analyze Portfolio
        </button>
      </div>

      {/* Portfolio Health Summary Bar */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Portfolio Health Score</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-emerald-400">{health.health_score} / 100</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {health.overall_health_rating}
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Sharpe & Sortino</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-[var(--text-main)]">Sharpe: {health.sharpe_ratio}</span>
              <span className="text-xs text-[var(--text-muted)]">Sortino: {health.sortino_ratio}</span>
            </div>
          </Card>

          <Card className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Expected Return</span>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">
              {(health.expected_return_annual * 100).toFixed(1)}% / yr
            </div>
          </Card>

          <Card className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Diversification Score</span>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">
              {health.diversification_score} / 100
            </div>
          </Card>
        </div>
      )}

      {/* Decision Cards List */}
      <div>
        <h2 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          Active Reallocation Proposals ({cards.length})
        </h2>

        {cards.length === 0 ? (
          <Card className="p-8 text-center bg-[var(--bg-card)] border border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-muted)]">No pending reallocation recommendations for this portfolio.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {cards.map((card) => (
              <Card key={card.id} className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                        {card.recommendation_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">Decision Score: <strong className="text-amber-400">{card.decision_score}</strong></span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-main)] mt-1">{card.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      card.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      card.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {card.status}
                    </span>
                  </div>
                </div>

                {/* Capital Shift Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center font-bold text-red-400 text-sm">
                      {card.source_asset || 'CASH'}
                    </div>
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block">Trim Position</span>
                      <span className="text-sm font-bold text-[var(--text-main)]">
                        {(card.current_allocation_pct * 100).toFixed(0)}% → {(card.proposed_allocation_pct * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-xs text-[var(--text-muted)] block">Reallocate Capital</span>
                      <span className="text-sm font-bold text-indigo-400">
                        ${card.capital_amount.toLocaleString()} ({(card.reallocation_pct * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block">Add Position</span>
                      <span className="text-sm font-bold text-[var(--text-main)]">
                        {card.target_asset}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">
                      {card.target_asset || 'SPY'}
                    </div>
                  </div>
                </div>

                {/* Structured Explainability Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="font-bold text-indigo-300 block mb-1">🎯 Why This Asset?</span>
                    <p className="text-[var(--text-muted)]">{card.why_this_stock}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="font-bold text-amber-300 block mb-1">⚖️ Why Not Another?</span>
                    <p className="text-[var(--text-muted)]">{card.why_not_another}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="font-bold text-emerald-300 block mb-1">⏱️ Why Now?</span>
                    <p className="text-[var(--text-muted)]">{card.why_now}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="font-bold text-blue-300 block mb-1">📊 Why This Percentage?</span>
                    <p className="text-[var(--text-muted)]">{card.why_this_percentage}</p>
                  </div>
                </div>

                {/* Actions Footer */}
                {card.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                    <button
                      onClick={() => handleAction(card.id, 'REJECTED')}
                      disabled={actionLoading === card.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Proposal
                    </button>
                    <button
                      onClick={() => handleAction(card.id, 'ACCEPTED')}
                      disabled={actionLoading === card.id}
                      className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept & Record Decision
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
