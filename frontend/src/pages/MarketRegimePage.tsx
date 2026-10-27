import React, { useState, useEffect } from 'react';
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
  BULL_MARKET: { bg: 'bg-[var(--success)]/10', text: 'text-[var(--success)]', border: 'border-[var(--success)]/30', icon: TrendingUp },
  BEAR_MARKET: { bg: 'bg-[var(--danger)]/10', text: 'text-[var(--danger)]', border: 'border-[var(--danger)]/30', icon: TrendingDown },
  SIDEWAYS_MARKET: { bg: 'bg-background', text: 'text-[var(--text-muted)]', border: 'border-[var(--border-color)]', icon: Activity },
  HIGH_VOLATILITY: { bg: 'bg-[#eab308]/10', text: 'text-[#eab308]', border: 'border-[#eab308]/30', icon: ShieldAlert },
  LOW_VOLATILITY: { bg: 'bg-[var(--primary)]/10', text: 'text-[var(--primary)]', border: 'border-[var(--primary)]/30', icon: Activity },
  RECOVERY_PHASE: { bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]', border: 'border-[#a855f7]/30', icon: Zap },
  CORRECTION_PHASE: { bg: 'bg-[var(--secondary)]/10', text: 'text-[var(--secondary)]', border: 'border-[var(--secondary)]/30', icon: TrendingDown },
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <BarChart2 className="w-4 h-4" />
            <span>Module 15 &bull; Regime Engine</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Market Regime Detection
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Real-time classification of Bull, Bear, Sideways, &amp; Volatility regimes with model adaptation rules
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-[120px] bg-background border border-[var(--border-color)] rounded-[8px] p-[10px_14px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none cursor-pointer"
          >
            {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'SPY', 'BTC-USD'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => fetchRegime(symbol)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
            Re-Analyze
          </button>
        </div>
      </div>

      {/* Main Regime Card */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`inst-card lg:col-span-2 p-[24px] border-t-2 ${style.border} ${style.bg} relative overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)] font-mono">
                  Detected Regime ({data.asset_symbol})
                </span>
                <h2 className={`text-[32px] font-extrabold font-heading mt-2 ${style.text} flex items-center gap-3 drop-shadow-md`}>
                  <IconComponent className="w-8 h-8" />
                  {data.regime.replace('_', ' ')}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-bold block mb-1 font-mono">Regime Confidence</span>
                <span className="text-[32px] font-mono font-extrabold text-[var(--text-main)] leading-none">
                  {(data.regime_confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-[32px] pt-[24px] border-t border-[var(--border-color)]/50">
              <div className="bg-background/50 p-[12px] rounded-[8px] border border-[var(--border-color)]/30">
                <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider font-mono font-bold block mb-1">Ann. Volatility</span>
                <span className="text-[16px] font-mono font-bold text-[var(--text-main)]">
                  {(data.volatility_annualized * 100).toFixed(2)}%
                </span>
              </div>
              <div className="bg-background/50 p-[12px] rounded-[8px] border border-[var(--border-color)]/30">
                <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider font-mono font-bold block mb-1">Trend Slope</span>
                <span className={`text-[16px] font-mono font-bold ${data.trend_slope >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {(data.trend_slope * 100).toFixed(2)}%
                </span>
              </div>
              <div className="bg-background/50 p-[12px] rounded-[8px] border border-[var(--border-color)]/30">
                <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider font-mono font-bold block mb-1">SMA-20 Ratio</span>
                <span className="text-[16px] font-mono font-bold text-[var(--text-main)]">
                  {data.sma_20_ratio.toFixed(3)}
                </span>
              </div>
              <div className="bg-background/50 p-[12px] rounded-[8px] border border-[var(--border-color)]/30">
                <span className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider font-mono font-bold block mb-1">Reference Price</span>
                <span className="text-[16px] font-mono font-bold text-[var(--text-main)]">
                  ${data.last_price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Models Card */}
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading tracking-wider text-[var(--text-main)] flex items-center gap-2 mb-4 border-b border-[var(--border-color)] pb-3">
              <Zap className="w-4 h-4 text-[#eab308]" />
              Regime-Optimal Algorithms
            </h3>
            <p className="text-[12px] font-mono text-[var(--text-muted)] mb-[16px]">
              Algorithms optimized for current market dynamics:
            </p>
            <div className="flex flex-wrap gap-2 mb-[24px]">
              {data.recommended_algorithms.map((algo) => (
                <span
                  key={algo}
                  className="px-3 py-1.5 rounded-[6px] text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/30"
                >
                  {algo}
                </span>
              ))}
            </div>
            <div className="p-[16px] bg-background rounded-[8px] text-[12px] font-mono text-[var(--text-muted)] border border-[var(--border-color)] leading-relaxed">
              💡 <span className="font-bold text-[var(--text-main)]">Adaptive Routing Ready:</span> In Phase 6, prediction requests automatically route to these regime-ranked algorithms.
            </div>
          </div>
        </div>
      )}

      {/* History Log Table */}
      <div className="inst-card p-[24px]">
        <h3 className="text-[14px] font-bold font-heading tracking-wider text-[var(--text-main)] mb-6 border-b border-[var(--border-color)] pb-3">
          Market Regime Detection History ({symbol})
        </h3>
        {history.length === 0 ? (
          <p className="text-[13px] font-mono text-[var(--text-muted)] py-4">No historical regime logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-3 font-semibold">Timestamp</th>
                  <th className="py-3 px-3 font-semibold">Asset</th>
                  <th className="py-3 px-3 font-semibold">Regime</th>
                  <th className="py-3 px-3 font-semibold">Confidence</th>
                  <th className="py-3 px-3 font-semibold">Ann. Volatility</th>
                  <th className="py-3 px-3 font-semibold">Recommended Algos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-background transition-colors">
                    <td className="py-4 px-3 font-mono text-[12px] text-[var(--text-muted)]">
                      {row.detected_at ? new Date(row.detected_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-4 px-3 font-bold text-[var(--primary)] font-mono">{row.asset_symbol}</td>
                    <td className="py-4 px-3 font-bold font-heading">
                      <span className={`px-2.5 py-1 rounded-[6px] text-[11px] uppercase tracking-wider border ${(REGIME_COLORS[row.regime] || REGIME_COLORS.SIDEWAYS_MARKET).text} ${(REGIME_COLORS[row.regime] || REGIME_COLORS.SIDEWAYS_MARKET).bg} ${(REGIME_COLORS[row.regime] || REGIME_COLORS.SIDEWAYS_MARKET).border}`}>
                        {row.regime.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-3 font-mono text-[13px] font-bold text-[var(--text-main)]">{(row.regime_confidence * 100).toFixed(1)}%</td>
                    <td className="py-4 px-3 font-mono text-[13px] text-[var(--text-muted)]">{(row.volatility_annualized * 100).toFixed(2)}%</td>
                    <td className="py-4 px-3 text-[12px] font-mono text-[var(--text-muted)] leading-relaxed">
                      {(row.recommended_algorithms || []).join(', ')}
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

export default MarketRegimePage;
