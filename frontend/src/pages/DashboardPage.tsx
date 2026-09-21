import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { portfolioService } from '../services/portfolioService';
import { marketService, MarketQuote } from '../services/marketService';
import { Portfolio, Watchlist } from '../types/portfolio';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Activity, TrendingUp, TrendingDown, ShieldCheck, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ports, wls, q1, q2, q3, q4] = await Promise.all([
          portfolioService.getPortfolios(),
          portfolioService.getWatchlists(),
          marketService.getLiveQuote('AAPL'),
          marketService.getLiveQuote('NVDA'),
          marketService.getLiveQuote('MSFT'),
          marketService.getLiveQuote('GOOGL'),
        ]);
        setPortfolios(ports);
        setWatchlists(wls);
        setMarketQuotes([q1, q2, q3, q4]);
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

      {/* Live Market Overview Bar */}
      {marketQuotes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {marketQuotes.map((q) => (
            <div key={q.symbol} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-mono">
              <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
                <span className="font-bold text-[#2563EB]">{q.symbol}</span>
                <span className="text-[10px]">{q.exchange}</span>
              </div>
              <div className="text-lg font-bold text-[var(--text-main)] mt-0.5">{formatAmount(q.price)}</div>
              <div className={`text-xs font-bold flex items-center gap-1 mt-0.5 ${
                q.change_amount >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}>
                {q.change_amount >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{q.change_amount >= 0 ? '+' : ''}{q.change_amount.toFixed(2)} ({q.change_percent.toFixed(2)}%)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Account &amp; Portfolio" subtitle="Verified Identity &amp; Active Portfolio">
          <div className="space-y-2">
            <div className="text-xl font-bold font-mono text-[var(--text-main)] truncate">
              {user?.email}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono flex justify-between pt-1 border-t border-[var(--border-color)]">
              <span>Active Portfolios:</span>
              <span className="text-[#2563EB] font-bold">{portfolios.length} Portfolio(s)</span>
            </div>
            <div className="text-xs text-[var(--text-muted)] font-mono flex justify-between">
              <span>Default Portfolio:</span>
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
                {formatAmount(metrics?.portfolio_value || 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Total Invested</span>
              <span className="font-bold text-[var(--text-main)]">
                {formatAmount(metrics?.total_invested || 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Unrealized P&amp;L</span>
              <span className={`font-bold flex items-center gap-1 ${(metrics?.profit_loss || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#F87171]'}`}>
                {(metrics?.profit_loss || 0) >= 0 ? '+' : ''}{formatAmount(metrics?.profit_loss || 0)} ({metrics?.profit_loss_pct || 0}%)
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

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Portfolio Performance Trend" subtitle="Historical Value" className="lg:col-span-2 relative overflow-hidden">
          {(!defaultPortfolio?.holdings || defaultPortfolio.holdings.length === 0) && (
            <div className="absolute inset-0 z-10 bg-[var(--bg-main)]/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
              <Activity className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-50" />
              <div className="text-sm font-bold text-[var(--text-main)]">Add your first holding to unlock analytics</div>
              <Link to="/portfolio" className="mt-3 text-xs bg-[#2563EB] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#1D4ED8] transition-colors">
                Manage Portfolio
              </Link>
            </div>
          )}
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', value: 90000 }, { name: 'Feb', value: 95000 },
                { name: 'Mar', value: 92000 }, { name: 'Apr', value: 98000 },
                { name: 'May', value: 105000 }, { name: 'Jun', value: 102000 },
                { name: 'Jul', value: 110000 },
              ]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `$${(val/1000)}k`} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  itemStyle={{ color: '#2563EB', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Asset Allocation" subtitle="Distribution by Symbol" className="relative overflow-hidden">
          {(!defaultPortfolio?.holdings || defaultPortfolio.holdings.length === 0) && (
            <div className="absolute inset-0 z-10 bg-[var(--bg-main)]/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
              <div className="text-sm font-bold text-[var(--text-main)]">Awaiting Data</div>
            </div>
          )}
          <div className="h-[300px] w-full mt-4 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defaultPortfolio?.holdings?.length > 0 ? defaultPortfolio.holdings.map(h => ({ name: h.asset?.symbol || 'Unknown', value: h.market_value })) : [{ name: 'Empty', value: 100 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(defaultPortfolio?.holdings || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#2563EB', '#16A34A', '#0EA5E9', '#8B5CF6', '#F59E0B'][index % 5]} />
                  ))}
                  {(!defaultPortfolio?.holdings || defaultPortfolio.holdings.length === 0) && (
                    <Cell fill="var(--border-color)" />
                  )}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value: any) => typeof value === 'number' ? formatAmount(value) : value}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
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
                    <div className="font-bold text-[var(--text-main)]">{formatAmount(h.market_value)}</div>
                    <div className={h.unrealized_pnl >= 0 ? 'text-[#16A34A]' : 'text-[#F87171]'}>
                      {h.unrealized_pnl >= 0 ? '+' : ''}{formatAmount(h.unrealized_pnl)} ({h.unrealized_pnl_pct}%)
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

        <Card title="Recent Portfolio Transactions" subtitle="Ledger Audit Trail">
          {defaultPortfolio?.recent_transactions && defaultPortfolio.recent_transactions.length > 0 ? (
            <div className="space-y-3 pt-2">
              {defaultPortfolio.recent_transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <div>
                    <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border mr-2 ${
                      tx.transaction_type === 'BUY' ? 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/30' :
                      tx.transaction_type === 'SELL' ? 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30' :
                      'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/30'
                    }`}>
                      {tx.transaction_type}
                    </span>
                    <span className="font-mono font-bold text-xs text-[var(--text-main)]">{tx.asset?.symbol}</span>
                    <span className="text-xs text-[var(--text-muted)] ml-2">({tx.quantity} shares @ {formatAmount(tx.price)})</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-[var(--text-main)]">{formatAmount(tx.total_amount)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{new Date(tx.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>

          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">
              No recent transactions recorded.{' '}
              <Link to="/portfolio" className="text-[#2563EB] underline font-bold ml-1">
                Record a transaction
              </Link>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
};
