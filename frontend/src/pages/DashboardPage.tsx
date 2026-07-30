import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { portfolioService } from '../services/portfolioService';
import { Portfolio, Watchlist } from '../types/portfolio';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, Activity, TrendingUp, ShieldCheck, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ports, wls] = await Promise.all([
          portfolioService.getPortfolios(),
          portfolioService.getWatchlists()
        ]);
        setPortfolios(ports);
        setWatchlists(wls);
      } catch (err) {
        console.error('Failed to load dashboard portfolio data', err);
      }
    };
    fetchData();
  }, []);

  const defaultPortfolio = portfolios.find((p) => p.is_default) || portfolios[0];
  const metrics = defaultPortfolio?.metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Institutional Portfolio Command Console
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time multi-asset intelligence, holdings tracking, and continuous APDE risk governance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="font-mono text-xs px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse mr-1.5 inline-block"></span>
            PORTFOLIO ENGINE ACTIVE
          </Badge>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Account &amp; Portfolio" subtitle="Verified Identity &amp; Active Vault">
          <div className="space-y-2">
            <div className="text-xl font-bold font-mono text-[var(--text-main)] truncate">
              {user?.email}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono flex justify-between pt-1 border-t border-[var(--border-color)]">
              <span>Active Portfolios:</span>
              <span className="text-[#2563EB] font-bold">{portfolios.length} Portfolio(s)</span>
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono flex justify-between">
              <span>Default Vault:</span>
              <span className="text-[var(--text-main)] font-bold">{defaultPortfolio?.name || 'Primary Portfolio'}</span>
            </div>
          </div>
        </Card>

        <Card title="APDE Governance Caps" subtitle="Active Rebalancer Parameters">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-2.5">
              <span className="text-[var(--text-muted)] text-xs font-semibold">Max Reallocation (C_realloc)</span>
              <span className="font-extrabold text-base text-[#2563EB] font-mono">{user?.preference?.max_reallocation_pct || 15}%</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-[var(--border-color)] pb-2.5">
              <span className="text-[var(--text-muted)] text-xs font-semibold">Risk Penalty (&lambda;)</span>
              <span className="font-extrabold text-base text-[#0EA5E9] font-mono">{user?.preference?.risk_tolerance_level || 3}/5</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-muted)] text-xs font-semibold">Target Objective</span>
              <span className="font-bold text-xs uppercase text-[#16A34A] font-mono">{user?.preference?.investment_goal || 'Growth'}</span>
            </div>
          </div>
        </Card>

        <Card title="Real Portfolio Metrics" subtitle="Active Holdings Valuation">
          <div className="space-y-2 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Total Portfolio Value</span>
              <span className="font-bold text-base text-[var(--text-main)]">
                ${metrics ? metrics.portfolio_value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Total Invested</span>
              <span className="font-bold text-[var(--text-main)]">
                ${metrics ? metrics.total_invested.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Unrealized P&amp;L</span>
              <span className={`font-bold flex items-center gap-1 ${(metrics?.profit_loss || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#F87171]'}`}>
                {(metrics?.profit_loss || 0) >= 0 ? '+' : ''}${metrics ? metrics.profit_loss.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'} ({metrics?.profit_loss_pct || 0}%)
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Operations Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/portfolio" className="inst-card p-4 rounded-xl inst-card-hover flex flex-col gap-2">
          <TrendingUp className="w-5 h-5 text-[#2563EB]" />
          <span className="text-xs font-bold text-[var(--text-main)]">Holdings &amp; Allocation</span>
          <span className="text-[11px] text-[var(--text-muted)]">Manage {metrics?.holdings_count || 0} asset positions</span>
        </Link>
        <Link to="/markets" className="inst-card p-4 rounded-xl inst-card-hover flex flex-col gap-2">
          <Activity className="w-5 h-5 text-[#0EA5E9]" />
          <span className="text-xs font-bold text-[var(--text-main)]">Asset Master Registry</span>
          <span className="text-[11px] text-[var(--text-muted)]">Search global equities &amp; tickers</span>
        </Link>
        <Link to="/watchlist" className="inst-card p-4 rounded-xl inst-card-hover flex flex-col gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-bold text-[var(--text-main)]">Watchlists</span>
          <span className="text-[11px] text-[var(--text-muted)]">{watchlists.length} Watchlist(s) configured</span>
        </Link>
        <Link to="/paper-trading" className="inst-card p-4 rounded-xl inst-card-hover flex flex-col gap-2">
          <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
          <span className="text-xs font-bold text-[var(--text-main)]">Paper Sandbox</span>
          <span className="text-[11px] text-[var(--text-muted)]">Simulated order execution</span>
        </Link>
      </div>

      {/* Top Holdings & Recent Activity Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Top Portfolio Positions" subtitle="Active Holdings Breakdown">
          {defaultPortfolio?.holdings && defaultPortfolio.holdings.length > 0 ? (
            <div className="space-y-3 pt-2">
              {defaultPortfolio.holdings.slice(0, 5).map((h) => (
                <div key={h.id} className="flex justify-between items-center p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#2563EB]">{h.asset?.symbol}</span>
                    <span className="text-xs text-[var(--text-muted)] ml-2">{h.asset?.company_name}</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-[var(--text-main)]">${h.market_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className={h.unrealized_pnl >= 0 ? 'text-[#16A34A]' : 'text-[#F87171]'}>
                      {h.unrealized_pnl >= 0 ? '+' : ''}${h.unrealized_pnl.toFixed(2)} ({h.unrealized_pnl_pct}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              No holdings in this portfolio yet.{' '}
              <Link to="/portfolio" className="text-[#2563EB] underline font-bold ml-1">
                Add your first holding
              </Link>
            </div>
          )}
        </Card>

        <Card title="System Architectural Roadmap Status" subtitle="OptiVest AI Engine Foundation">
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#16A34A] uppercase tracking-wider px-2 py-0.5 rounded bg-[#16A34A]/15 border border-[#16A34A]/30">
                  Phase 1 &amp; 2
                </span>
                <h4 className="text-xs font-bold text-[var(--text-main)] mt-1">Auth &amp; Core Engine</h4>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[#16A34A]/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#16A34A] uppercase tracking-wider px-2 py-0.5 rounded bg-[#16A34A]/15 border border-[#16A34A]/30">
                  Phase 3
                </span>
                <h4 className="text-xs font-bold text-[var(--text-main)] mt-1">Portfolio &amp; Market Infrastructure</h4>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
