import React, { useState, useEffect, useCallback } from 'react';
import { Layers, RefreshCw, TrendingUp, TrendingDown, PieChart, AlertTriangle, BarChart3, Search } from 'lucide-react';

const getH = (): HeadersInit => {
  const t = localStorage.getItem('access_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

interface Portfolio {
  id: string;
  portfolio_name?: string;
  name?: string;
  strategy?: string;
  risk_profile?: string;
  total_value?: number;
  cash_balance?: number;
  total_return_pct?: number;
  sharpe_ratio?: number;
  user_id?: string;
  health_rating?: string;
  holding_count?: number;
  max_drawdown_pct?: number;
  var_95_pct?: number;
}

export const AdminPortfoliosPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/apde/admin/portfolios/overview', { headers: getH() });
      if (res.ok) {
        const data = await res.json();
        const payload = data.data ?? data;
        const raw = Array.isArray(payload) ? payload : (payload.portfolios ?? []);
        const list = raw.map((p: any) => ({
          ...p,
          id: p.id || p.portfolio_id,
          name: p.name || p.portfolio_name,
          total_value: p.total_value ?? 0,
          total_return_pct: p.total_return_pct ?? 0,
          risk_profile: p.risk_profile || p.health_rating || 'UNANALYZED',
        }));
        setPortfolios(list);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const filtered = portfolios.filter((p) => {
    const name = p.portfolio_name || p.name || '';
    return search === '' || name.toLowerCase().includes(search.toLowerCase()) || (p.strategy || '').toLowerCase().includes(search.toLowerCase());
  });

  // Aggregated platform stats
  const totalAUM = portfolios.reduce((acc, p) => acc + (p.total_value ?? 0), 0);
  const avgReturn = portfolios.length
    ? portfolios.reduce((acc, p) => acc + (p.total_return_pct ?? 0), 0) / portfolios.length
    : 0;
  const avgSharpe = portfolios.length
    ? portfolios.reduce((acc, p) => acc + (p.sharpe_ratio ?? 0), 0) / portfolios.length
    : 0;
  const profitableCount = portfolios.filter((p) => (p.total_return_pct ?? 0) > 0).length;

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">Platform Portfolio Registry</h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">Aggregated AUM, cross-user portfolio performance, and risk distribution</p>
        </div>
        <button
          onClick={fetchPortfolios}
          className="px-4 py-2 bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[13px] font-bold text-[var(--text-main)] rounded-[8px] flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>Refresh Registry</span>
        </button>
      </div>

      {/* ── Platform KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="inst-card p-[20px]">
          <div className="text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-[8px]">Platform AUM</div>
          <div className="text-[28px] font-bold font-mono text-[var(--text-main)]">
            ${totalAUM >= 1_000_000
              ? `${(totalAUM / 1_000_000).toFixed(2)}M`
              : totalAUM >= 1_000
              ? `${(totalAUM / 1_000).toFixed(1)}K`
              : totalAUM.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--primary)] mt-[6px] font-bold">Across {portfolios.length} portfolios</div>
        </div>

        <div className="inst-card p-[20px]">
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-[8px]">
            <BarChart3 className="w-3.5 h-3.5" /> Avg Return
          </div>
          <div className={`text-[28px] font-bold font-mono ${avgReturn >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(2)}%
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-[6px]">Platform average</div>
        </div>

        <div className="inst-card p-[20px]">
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-[8px]">
            <PieChart className="w-3.5 h-3.5" /> Avg Sharpe
          </div>
          <div className={`text-[28px] font-bold font-mono ${avgSharpe >= 1 ? 'text-[var(--success)]' : avgSharpe >= 0 ? 'text-[#eab308]' : 'text-[var(--danger)]'}`}>
            {avgSharpe.toFixed(2)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-[6px]">Risk-adjusted return</div>
        </div>

        <div className="inst-card p-[20px]">
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-[8px]">
            <TrendingUp className="w-3.5 h-3.5" /> Profitable
          </div>
          <div className="text-[28px] font-bold font-mono text-[var(--secondary)]">
            {portfolios.length ? Math.round((profitableCount / portfolios.length) * 100) : 0}%
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-[6px]">{profitableCount} of {portfolios.length} accounts</div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="inst-card p-[16px]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by portfolio name or strategy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-[var(--border-color)] rounded-[8px] pl-10 pr-4 py-2.5 text-[14px] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>
      </div>

      {/* ── Portfolio Table ── */}
      <div className="inst-card p-[24px]">
        <h3 className="text-[14px] font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4">
          <Layers className="w-4 h-4 text-[var(--primary)]" />
          <span>All Portfolios ({filtered.length})</span>
        </h3>

        {loading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
            <span className="text-[13px]">Loading portfolio registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-[14px] text-[var(--text-muted)]">
              {portfolios.length === 0 ? 'No portfolios found in registry.' : 'No results match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-4 font-semibold">Portfolio Name</th>
                  <th className="py-3 px-4 font-semibold">Strategy</th>
                  <th className="py-3 px-4 font-semibold">Risk Profile</th>
                  <th className="py-3 px-4 font-semibold">Total Value</th>
                  <th className="py-3 px-4 font-semibold">Return</th>
                  <th className="py-3 px-4 font-semibold">Sharpe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {filtered.map((p) => {
                  const ret = p.total_return_pct ?? 0;
                  const name = p.portfolio_name || p.name || `Portfolio ${p.id.slice(0, 6)}`;
                  return (
                    <tr key={p.id} className="hover:bg-background transition-colors">
                      <td className="py-4 px-4 font-bold text-[var(--text-main)]">{name}</td>
                      <td className="py-4 px-4 text-[var(--text-muted)]">{p.strategy || '—'}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-muted)]">
                          {p.risk_profile || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[var(--text-main)] font-bold">
                        ${(p.total_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`flex items-center gap-1 font-bold ${ret >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                          {ret >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                        </span>
                      </td>
                      <td className={`py-4 px-4 font-bold ${(p.sharpe_ratio ?? 0) >= 1 ? 'text-[var(--success)]' : (p.sharpe_ratio ?? 0) >= 0 ? 'text-[#eab308]' : 'text-[var(--danger)]'}`}>
                        {(p.sharpe_ratio ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortfoliosPage;
