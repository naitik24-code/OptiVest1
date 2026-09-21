import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { ShieldAlert, TrendingUp, TrendingDown, Activity, Zap, RefreshCw, BarChart2 } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

interface RegimeData {
  asset_symbol: string;
  regime: string;
  regime_confidence: number;
  volatility_annualized: number;
  total_return_pct: number;
  trend_slope: number;
  sma_20_ratio: number;
  last_price: number;
  detected_at: string;
  recommended_algorithms: string[];
}

const REGIME_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  BULL_MARKET: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: TrendingUp },
  BEAR_MARKET: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: TrendingDown },
  SIDEWAYS_MARKET: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', icon: Activity },
  HIGH_VOLATILITY: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', icon: ShieldAlert },
  LOW_VOLATILITY: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: Activity },
  RECOVERY_PHASE: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', icon: Zap },
  CORRECTION_PHASE: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: TrendingDown },
};

export const MarketRegimePage: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [data, setData] = useState<RegimeData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRegime = async (sym: string) => {
    setLoading(true);
    try {
      const [dRes, hRes] = await Promise.all([
        fetch(`/api/v1/ai/regime/detect?asset_symbol=${sym}`, { headers: getH() }),
        fetch(`/api/v1/ai/regime/history?asset_symbol=${sym}`, { headers: getH() }),
      ]);
      if (dRes.ok) setData(await dRes.json());
      if (hRes.ok) setHistory(await hRes.json());
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRegime(symbol);
  }, [symbol]);

  const style = data ? (REGIME_COLORS[data.regime] || REGIME_COLORS.SIDEWAYS_MARKET) : REGIME_COLORS.SIDEWAYS_MARKET;
  const IconComponent = style.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-400" />
            Market Regime Detection Engine
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Module 15 — Real-time classification of Bull, Bear, Sideways, & Volatility regimes with model adaptation rules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-indigo-500"
          >
            {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'SPY', 'BTC-USD'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => fetchRegime(symbol)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-3.5 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Re-Analyze
          </button>
        </div>
      </div>

      {/* Main Regime Card */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className={`lg:col-span-2 p-6 border ${style.border} ${style.bg} relative overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                  Detected Regime ({data.asset_symbol})
                </span>
                <h2 className={`text-3xl font-extrabold mt-1 ${style.text} flex items-center gap-2.5`}>
                  <IconComponent className="w-8 h-8" />
                  {data.regime.replace('_', ' ')}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-[var(--text-muted)] block">Regime Confidence</span>
                <span className="text-2xl font-bold text-[var(--text-main)]">
                  {(data.regime_confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Ann. Volatility</span>
                <span className="text-base font-semibold text-[var(--text-main)]">
                  {(data.volatility_annualized * 100).toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Trend Slope</span>
                <span className={`text-base font-semibold ${data.trend_slope >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(data.trend_slope * 100).toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block">SMA-20 Ratio</span>
                <span className="text-base font-semibold text-[var(--text-main)]">
                  {data.sma_20_ratio.toFixed(3)}
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)] block">Reference Price</span>
                <span className="text-base font-semibold text-[var(--text-main)]">
                  ${data.last_price.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Recommended Models Card */}
          <Card className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-400" />
              Regime-Optimal Algorithms
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Algorithms optimized for current market dynamics:
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {data.recommended_algorithms.map((algo) => (
                <span
                  key={algo}
                  className="px-3 py-1.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >
                  {algo}
                </span>
              ))}
            </div>
            <div className="p-3 bg-[var(--bg-main)] rounded-lg text-xs text-[var(--text-muted)] border border-[var(--border-color)]">
              💡 <span className="font-semibold">Adaptive Routing Ready:</span> In Phase 6, prediction requests automatically route to these regime-ranked algorithms.
            </div>
          </Card>
        </div>
      )}

      {/* History Log Table */}
      <Card className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)]">
        <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">
          Market Regime Detection History ({symbol})
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No historical regime logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-color)] text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Asset</th>
                  <th className="py-2 px-3">Regime</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Ann. Volatility</th>
                  <th className="py-2 px-3">Recommended Algos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-[var(--text-muted)]">
                      {row.detected_at ? new Date(row.detected_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[var(--text-main)]">{row.asset_symbol}</td>
                    <td className="py-2.5 px-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-xs ${(REGIME_COLORS[row.regime] || REGIME_COLORS.SIDEWAYS_MARKET).text} bg-white/5`}>
                        {row.regime.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{(row.regime_confidence * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-mono">{(row.volatility_annualized * 100).toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-xs text-[var(--text-muted)]">
                      {(row.recommended_algorithms || []).join(', ')}
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
