import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
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
}

export const AdminPortfoliosPage: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/portfolios', { headers: getH() });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data ?? []);
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
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Founder Console &bull; Global Portfolio Oversight</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Platform Portfolio Registry
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Aggregated AUM, cross-user portfolio performance, and risk distribution across the platform.
          </p>
        </div>
        <button
          onClick={fetchPortfolios}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Platform KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-violet-900/15 to-transparent border-violet-700/20">
          <div className="text-xs text-[var(--text-muted)] mb-1">Platform AUM</div>
          <div className="text-2xl font-extrabold font-mono text-violet-400">
            ${totalAUM >= 1_000_000
              ? `${(totalAUM / 1_000_000).toFixed(2)}M`
              : totalAUM >= 1_000
              ? `${(totalAUM / 1_000).toFixed(1)}K`
              : totalAUM.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Across {portfolios.length} portfolios</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
            <BarChart3 className="w-3.5 h-3.5" />Avg Return
          </div>
          <div className={`text-2xl font-extrabold font-mono ${avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(2)}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Platform average</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
            <PieChart className="w-3.5 h-3.5" />Avg Sharpe
          </div>
          <div className={`text-2xl font-extrabold font-mono ${avgSharpe >= 1 ? 'text-emerald-400' : avgSharpe >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
            {avgSharpe.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Risk-adjusted return</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
            <TrendingUp className="w-3.5 h-3.5" />Profitable
          </div>
          <div className="text-2xl font-extrabold font-mono text-sky-400">
            {portfolios.length ? Math.round((profitableCount / portfolios.length) * 100) : 0}%
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">{profitableCount} of {portfolios.length}</div>
        </Card>
      </div>

      {/* ── Search ── */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by portfolio name or strategy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </Card>

      {/* ── Portfolio Table ── */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-3">
          <Layers className="w-4 h-4 text-violet-400" />
          <span>All Portfolios ({filtered.length})</span>
        </h3>

        {loading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
            <span className="text-xs">Loading portfolio registry...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">
              {portfolios.length === 0 ? 'No portfolios found in registry.' : 'No results match your search.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase text-[10px] font-mono">
                  <th className="py-2.5 px-3">Portfolio</th>
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3">Risk Profile</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Return</th>
                  <th className="py-2.5 px-3">Sharpe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {filtered.map((p) => {
                  const ret = p.total_return_pct ?? 0;
                  const name = p.portfolio_name || p.name || `Portfolio ${p.id.slice(0, 6)}`;
                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[var(--text-main)]">{name}</td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">{p.strategy || '—'}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]">
                          {p.risk_profile || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-main)]">
                        ${(p.total_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`flex items-center gap-1 font-bold ${ret >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ret >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                        </span>
                      </td>
                      <td className={`py-3 px-3 font-bold ${(p.sharpe_ratio ?? 0) >= 1 ? 'text-emerald-400' : (p.sharpe_ratio ?? 0) >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {(p.sharpe_ratio ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminPortfoliosPage;
