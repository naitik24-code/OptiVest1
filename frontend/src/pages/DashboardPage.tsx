import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { portfolioService } from '../services/portfolioService';
import { marketService, MarketQuote } from '../services/marketService';
import { Portfolio } from '../types/portfolio';
import { LayoutDashboard } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [marketQuotes, setMarketQuotes] = useState<MarketQuote[]>([]);
  const [bignum, setBignum] = useState(1248950);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ports = await portfolioService.getPortfolios();
        const quotes = await Promise.all([
          marketService.getLiveQuote('NVDA'),
          marketService.getLiveQuote('MSFT'),
          marketService.getLiveQuote('TSLA'),
          marketService.getLiveQuote('AAPL'),
        ]);
        setPortfolios(ports);
        setMarketQuotes(quotes);
      } catch (err) {
        console.error('Failed to load dashboard portfolio data', err);
      }
    };
    fetchData();

    const interval = setInterval(() => {
      setBignum(prev => prev + (Math.random() - 0.4) * 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const defaultPortfolio = portfolios.find((p) => p.is_default) || portfolios[0];

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
        <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--primary)] uppercase tracking-wider mb-1">
          <LayoutDashboard className="w-4 h-4" /><span>OptiVest Operations</span>
        </div>
        <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">Portfolio Command Console</h2>
        <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">{defaultPortfolio?.name || 'Primary Portfolio'} &bull; {user?.preference?.investment_goal || 'Institutional Growth'}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]"><span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />MARKET OPEN <span className="opacity-40">•</span> DATA LIVE</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        {/* Left Column */}
        <div className="inst-card p-[24px]">
          <div className="text-[14px] font-bold text-[var(--text-main)] flex items-center mb-1">
            Total Value <span className="font-mono text-[var(--success)] text-[12px] ml-3 tracking-wider">+2.14% today</span>
          </div>
          
          <div className="metric-value text-[clamp(2.5rem,6vw,3.5rem)] font-extrabold leading-none text-[var(--text-main)] mt-2">
            {formatAmount(bignum)}
          </div>
          <div className="font-mono text-[13px] mt-[8px] text-[var(--text-muted)] tracking-wider">
            Invested {formatAmount(defaultPortfolio?.metrics?.total_invested || 1090200)} &bull; Cash {formatAmount(58410)}
          </div>

          <div className="mt-[30px] overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] pb-3 border-b border-[var(--border-color)]">Asset</th>
                  <th className="text-left font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] pb-3 border-b border-[var(--border-color)]">Qty</th>
                  <th className="text-left font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] pb-3 border-b border-[var(--border-color)]">Price</th>
                  <th className="text-left font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] pb-3 border-b border-[var(--border-color)]">P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] font-mono">
                {marketQuotes.map((q, idx) => {
                  const qty = [140, 90, 60, 210][idx] || 100;
                  const pnl = [18.4, 9.2, -3.1, 2.8][idx] || 0;
                  return (
                    <tr key={q.symbol} className="data-row">
                      <td className="py-4 text-[var(--primary)] font-bold">{q.symbol}</td>
                      <td className="py-4 text-[var(--text-main)]">{qty}</td>
                      <td className="py-4 text-[var(--text-main)]">{formatAmount(q.price)}</td>
                      <td className={`py-4 font-bold ${pnl >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {pnl > 0 ? '+' : ''}{pnl}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border border-[rgba(255,90,31,0.3)] bg-gradient-to-r from-[rgba(255,90,31,0.1)] to-transparent rounded-[10px] p-[20px] mt-[24px] shadow-[0_0_15px_rgba(255,90,31,0.05)]">
            <div className="font-mono text-[11px] text-[var(--primary)] font-bold uppercase tracking-wider">APDE RECOMMENDATION &bull; PENDING</div>
            <div className="text-[18px] font-bold mt-[8px] mb-[12px] text-[var(--text-main)] font-heading">Trim TSLA 8% &rarr; Add NVDA</div>
            <div className="h-[6px] rounded-[3px] bg-background border border-[var(--border-color)] overflow-hidden my-[12px] relative">
              <div className="absolute top-0 left-0 h-full bg-[var(--primary)] w-[78%] transition-all duration-[1400ms] ease-out"></div>
            </div>
            <div className="text-[12px] text-[var(--text-muted)] font-mono">Confidence 78% &bull; Expected Sharpe +0.14</div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="inst-card p-[24px]">
            <div className="text-[14px] font-bold text-[var(--text-main)] mb-6 font-heading">Allocation</div>
            <div className="flex items-center justify-center flex-col gap-6">
              <svg width="140" height="140" viewBox="0 0 42 42" className="-rotate-90">
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface2)" strokeWidth="6"/>
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--primary)" strokeWidth="6" strokeDasharray="42 58" strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--secondary)" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="-17" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--success)" strokeWidth="6" strokeDasharray="28 72" strokeDashoffset="-47" />
              </svg>
              <div className="text-[12px] font-mono flex flex-col gap-[8px] w-full px-4">
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span className="flex items-center gap-[8px]"><i className="w-[10px] h-[10px] rounded-[2px] bg-[var(--primary)] block"></i>Equities</span>
                  <span className="font-bold text-[var(--text-main)]">42%</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span className="flex items-center gap-[8px]"><i className="w-[10px] h-[10px] rounded-[2px] bg-[var(--secondary)] block"></i>Fixed income</span>
                  <span className="font-bold text-[var(--text-main)]">30%</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-muted)]">
                  <span className="flex items-center gap-[8px]"><i className="w-[10px] h-[10px] rounded-[2px] bg-[var(--success)] block"></i>Cash &amp; alt</span>
                  <span className="font-bold text-[var(--text-main)]">28%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="inst-card p-[24px]">
            <div className="text-[14px] font-bold text-[var(--text-main)] mb-4 font-heading">Governance</div>
            <div className="font-mono text-[13px] flex justify-between py-[12px] border-b border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">C_realloc cap</span>
              <span className="text-[var(--text-main)] font-bold">{user?.preference?.max_reallocation_pct || 15}%</span>
            </div>
            <div className="font-mono text-[13px] flex justify-between py-[12px]">
              <span className="text-[var(--text-muted)]">Risk penalty &lambda;</span>
              <span className="text-[var(--text-main)] font-bold">{user?.preference?.risk_tolerance_level || 3} / 5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
