import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Cpu,
  ArrowRight,
  BarChart2,
  Sliders,
  Layers,
  Zap,
  Check,
  Eye
} from 'lucide-react';
import { Navbar } from '../components/shared/Navbar';

export const LandingPage: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1M');

  // Market indices data
  const indices = [
    { symbol: 'S&P 500', name: 'SPX', value: '5,088.80', change: '+24.60', pct: '+0.49%', isUp: true },
    { symbol: 'NASDAQ 100', name: 'NDX', value: '17,937.60', change: '+142.10', pct: '+0.80%', isUp: true },
    { symbol: 'DOW JONES', name: 'DJI', value: '38,989.84', change: '-23.40', pct: '-0.06%', isUp: false },
    { symbol: 'FTSE 100', name: 'UKX', value: '7,706.28', change: '+18.90', pct: '+0.25%', isUp: true },
  ];

  // Top gainers/losers
  const topGainers = [
    { ticker: 'NVDA', name: 'NVIDIA Corp', price: '$788.17', change: '+4.2% ', isUp: true },
    { ticker: 'MSFT', name: 'Microsoft Corp', price: '$410.34', change: '+1.8%', isUp: true },
    { ticker: 'AMD', name: 'Adv Micro Devices', price: '$176.50', change: '+3.1%', isUp: true },
  ];

  const topLosers = [
    { ticker: 'TSLA', name: 'Tesla Inc', price: '$197.40', change: '-2.4%', isUp: false },
    { ticker: 'AAPL', name: 'Apple Inc', price: '$182.52', change: '-0.8%', isUp: false },
    { ticker: 'INTC', name: 'Intel Corp', price: '$42.80', change: '-1.5%', isUp: false },
  ];

  // Market news items
  const newsItems = [
    { title: 'Fed Signals Patience on Interest Rate Adjustments', source: 'Bloomberg', time: '12m ago' },
    { title: 'Tech Sector Earnings Outperform Consensus Targets by 8.4%', source: 'Reuters', time: '45m ago' },
    { title: 'Treasury Yields Stabilize Near 4.25% Benchmark', source: 'Financial Times', time: '2h ago' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white transition-colors duration-200">
      <Navbar />

      {/* ==================== 1. HERO SECTION (TWO-COLUMN) ==================== */}
      <section className="relative py-16 lg:py-24 px-6 max-w-7xl mx-auto w-full border-b border-[var(--border-color)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* LEFT COLUMN: Headlines & CTAs */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] font-mono text-[#0EA5E9] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              INSTITUTIONAL PORTFOLIO INTELLIGENCE
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight text-[var(--text-main)] leading-[1.1]">
              Invest Smarter. <br />
              <span className="text-[#2563EB]">Manage Wealth</span> with Confidence.
            </h1>

            <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-lg font-normal">
              Professional wealth management platform providing real-time portfolio tracking, multi-asset risk analytics, and quantitative allocation optimization powered by adaptive intelligence.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link to="/register">
                <button className="w-full sm:w-auto px-6 py-3 bg-[#2563EB] hover:bg-blue-500 text-white font-heading font-bold text-sm rounded-lg shadow-lg shadow-blue-900/30 transition-all border border-blue-400/30 flex items-center justify-center gap-2">
                  <span>Open Investor Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/login">
                <button className="w-full sm:w-auto px-6 py-3 bg-[var(--bg-card)] hover:bg-[var(--border-color)] text-[var(--text-main)] font-heading font-semibold text-sm rounded-lg border border-[var(--border-color)] transition-all flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>View Live Demo</span>
                </button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 border-t border-[var(--border-color)] grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-xs font-mono font-bold text-[var(--text-main)] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> 256-bit AES
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Enterprise Security</div>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[var(--text-main)] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#0EA5E9]" /> &lt; 15ms
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Execution Latency</div>
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[var(--text-main)] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> 100% Audit
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Clean Architecture</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Investor-Grade Dashboard Preview */}
          <div className="lg:col-span-7">
            <div className="inst-card rounded-xl p-5 border border-[var(--border-color)] shadow-2xl relative">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#16A34A]"></div>
                  <span className="font-heading text-xs font-bold text-[var(--text-main)] tracking-wider uppercase">
                    PORTFOLIO OVERVIEW &bull; GLOBAL MACRO
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-md border border-[var(--border-color)] text-[10px] font-mono">
                  {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTimeframe(t)}
                      className={`px-2 py-0.5 rounded ${
                        selectedTimeframe === t ? 'bg-[#2563EB] text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-[var(--bg-main)] p-3.5 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Total Asset Value</div>
                  <div className="text-xl font-mono font-bold text-[var(--text-main)] mt-0.5">$1,248,950.40</div>
                  <div className="text-[11px] font-mono text-[#16A34A] font-semibold flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> +$14,230.80 (+1.15%) Today
                  </div>
                </div>

                <div className="bg-[var(--bg-main)] p-3.5 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Sharpe Ratio</div>
                  <div className="text-xl font-mono font-bold text-[var(--text-main)] mt-0.5">2.48</div>
                  <div className="text-[11px] font-mono text-[#0EA5E9] font-semibold mt-1">
                    Top 5% Risk-Adjusted Return
                  </div>
                </div>

                <div className="bg-[var(--bg-main)] p-3.5 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Reallocation Cap (C_realloc)</div>
                  <div className="text-xl font-mono font-bold text-[#0EA5E9] mt-0.5">15.0%</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                    Risk Penalty &lambda; = 3/5
                  </div>
                </div>
              </div>

              {/* Performance SVG Line Chart Mock */}
              <div className="bg-[var(--bg-main)] p-4 rounded-lg border border-[var(--border-color)] mb-5">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] mb-2">
                  <span>HISTORICAL EQUITY CURVE (USD)</span>
                  <span className="text-[#16A34A] font-bold">+18.4% YTD</span>
                </div>
                <div className="h-36 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,90 Q50,85 100,70 T200,60 T300,45 T400,30 T500,15 L500,120 L0,120 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M0,90 Q50,85 100,70 T200,60 T300,45 T400,30 T500,15"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                    />
                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth="0.8" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth="0.8" />
                    <line x1="0" y1="90" x2="500" y2="90" stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth="0.8" />
                  </svg>
                </div>
              </div>

              {/* Asset Allocation & Watchlist Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-main)] p-3.5 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase mb-2">Asset Allocation</div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between font-mono mb-1 text-[11px]">
                        <span>Equities</span>
                        <span className="font-bold text-[var(--text-main)]">65%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono mb-1 text-[11px]">
                        <span>Fixed Income</span>
                        <span className="font-bold text-[var(--text-main)]">20%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0EA5E9] rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-mono mb-1 text-[11px]">
                        <span>Commodities &amp; Cash</span>
                        <span className="font-bold text-[var(--text-main)]">15%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-card)] rounded-full overflow-hidden">
                        <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-main)] p-3.5 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase mb-2">Target Recommendations</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <div className="font-mono">
                        <span className="font-bold text-[var(--text-main)]">NVDA</span>
                        <span className="text-[10px] text-[var(--text-muted)] ml-2">Overweight</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.5 rounded border border-[#16A34A]/20">+3.5%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <div className="font-mono">
                        <span className="font-bold text-[var(--text-main)]">TSLA</span>
                        <span className="text-[10px] text-[var(--text-muted)] ml-2">Underweight</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#DC2626] bg-[#DC2626]/10 px-1.5 py-0.5 rounded border border-[#DC2626]/20">-2.0%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ==================== 2. MARKET OVERVIEW SECTION ==================== */}
      <section id="markets" className="py-16 px-6 max-w-7xl mx-auto w-full border-b border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-mono text-[#0EA5E9] font-bold uppercase tracking-wider mb-1">
              REAL-TIME MARKET INTELLIGENCE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-main)]">
              Global Markets &amp; Asset Benchmark Performance
            </h2>
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Updated live from institutional market feeds
          </div>
        </div>

        {/* Global Indices Ticker Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {indices.map((idx) => (
            <div key={idx.symbol} className="inst-card p-4 rounded-xl inst-card-hover">
              <div className="flex justify-between items-center text-xs font-mono text-[var(--text-muted)]">
                <span>{idx.symbol}</span>
                <span className="font-bold text-[var(--text-main)]">{idx.name}</span>
              </div>
              <div className="text-lg font-mono font-bold text-[var(--text-main)] mt-1">{idx.value}</div>
              <div className={`text-xs font-mono font-semibold flex items-center gap-1 mt-1 ${idx.isUp ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {idx.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{idx.change} ({idx.pct})</span>
              </div>
            </div>
          ))}
        </div>

        {/* Gainers, Losers, and Market News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Gainers Card */}
          <div className="inst-card p-5 rounded-xl border border-[var(--border-color)]">
            <h3 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Top Gainers Today</span>
              <span className="text-[#16A34A]">OVERWEIGHT SYMBOLS</span>
            </h3>
            <div className="space-y-3">
              {topGainers.map((stk) => (
                <div key={stk.ticker} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <div>
                    <div className="font-mono font-bold text-sm text-[var(--text-main)]">{stk.ticker}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{stk.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-[var(--text-main)]">{stk.price}</div>
                    <div className="text-xs font-mono font-bold text-[#16A34A]">{stk.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers Card */}
          <div className="inst-card p-5 rounded-xl border border-[var(--border-color)]">
            <h3 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Top Decliners</span>
              <span className="text-[#DC2626]">UNDERWEIGHT SYMBOLS</span>
            </h3>
            <div className="space-y-3">
              {topLosers.map((stk) => (
                <div key={stk.ticker} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <div>
                    <div className="font-mono font-bold text-sm text-[var(--text-main)]">{stk.ticker}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">{stk.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-[var(--text-main)]">{stk.price}</div>
                    <div className="text-xs font-mono font-bold text-[#DC2626]">{stk.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market News Feed */}
          <div className="inst-card p-5 rounded-xl border border-[var(--border-color)]">
            <h3 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Institutional Market Wire
            </h3>
            <div className="space-y-3">
              {newsItems.map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <h4 className="text-xs font-semibold text-[var(--text-main)] leading-snug line-clamp-2 hover:text-[#0EA5E9] cursor-pointer transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                    <span>{item.source}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 3. PORTFOLIO FEATURES & INTELLIGENCE ==================== */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto w-full border-b border-[var(--border-color)]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider">
            ENTERPRISE CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-main)]">
            Institutional-Grade Wealth Management Architecture
          </h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Built for institutional investors and family offices requiring rigorous risk controls, continuous rebalancing, and transparent quantitative decision rationales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="inst-card p-6 rounded-xl inst-card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#2563EB] flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-[var(--text-main)]">Multi-Horizon Risk Analytics</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Compute VaR (Value at Risk), Sharpe ratio, and Maximum Drawdown metrics continuously across equity and fixed income holdings under various market stress scenarios.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center gap-2 text-xs font-mono text-[#0EA5E9]">
              <Check className="w-4 h-4 text-[#16A34A]" />
              <span>Real-Time Factor Attribution</span>
            </div>
          </div>

          <div className="inst-card p-6 rounded-xl inst-card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 text-[#0EA5E9] flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-[var(--text-main)]">Adaptive Rebalancing Solver</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Execute constrained multi-objective utility optimizations bounded strictly by your custom reallocation cap (C_realloc) and risk tolerance level (&lambda;).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center gap-2 text-xs font-mono text-[#0EA5E9]">
              <Check className="w-4 h-4 text-[#16A34A]" />
              <span>Quadratic Program Utility</span>
            </div>
          </div>

          <div className="inst-card p-6 rounded-xl inst-card-hover flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/15 border border-[#16A34A]/30 text-[#16A34A] flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-[var(--text-main)]">Transparent Explainability</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Every trade recommendation is coupled with explicit Shapley feature attributions detailing momentum, volatility, and macroeconomic drivers for complete transparency.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center gap-2 text-xs font-mono text-[#0EA5E9]">
              <Check className="w-4 h-4 text-[#16A34A]" />
              <span>Audit-Ready SHAP Rationales</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 4. HOW IT WORKS ==================== */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full border-b border-[var(--border-color)]">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-mono text-[#0EA5E9] font-bold uppercase tracking-wider">
            WORKFLOW &amp; EXECUTION
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-main)]">
            Four Steps to Continuous Portfolio Governance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="inst-card p-5 rounded-xl border border-[var(--border-color)] relative">
            <div className="text-3xl font-mono font-black text-[#2563EB]/40 mb-3">01</div>
            <h3 className="text-sm font-bold font-heading text-[var(--text-main)] mb-2">Set Risk Governance</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Define your maximum reallocation cap (C_realloc) and risk penalty coefficient (&lambda;).
            </p>
          </div>

          <div className="inst-card p-5 rounded-xl border border-[var(--border-color)] relative">
            <div className="text-3xl font-mono font-black text-[#0EA5E9]/40 mb-3">02</div>
            <h3 className="text-sm font-bold font-heading text-[var(--text-main)] mb-2">Continuous Factor Analysis</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Ingest real-time pricing, macro indicators, and technical metrics across multi-asset universes.
            </p>
          </div>

          <div className="inst-card p-5 rounded-xl border border-[var(--border-color)] relative">
            <div className="text-3xl font-mono font-black text-indigo-500/40 mb-3">03</div>
            <h3 className="text-sm font-bold font-heading text-[var(--text-main)] mb-2">APDE Optimization</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Compute utility-maximizing target weights balancing return expectations and drawdown risk.
            </p>
          </div>

          <div className="inst-card p-5 rounded-xl border border-[var(--border-color)] relative">
            <div className="text-3xl font-mono font-black text-[#16A34A]/40 mb-3">04</div>
            <h3 className="text-sm font-bold font-heading text-[var(--text-main)] mb-2">Paper Trading Audit</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Validate rebalancing performance in simulated sandbox execution before deploying capital.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 5. SECURITY & TRUST ==================== */}
      <section id="security" className="py-20 px-6 max-w-7xl mx-auto w-full border-b border-[var(--border-color)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs font-mono text-[#16A34A] font-bold uppercase tracking-wider">
              ENTERPRISE SECURITY &amp; COMPLIANCE
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-main)]">
              Bank-Grade Infrastructure Designed for Institutional Trust
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              OptiVest AI enforces strict data isolation, zero-trust token authentication, and continuous vulnerability monitoring across all backend microservices.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">End-to-End Payload Encryption</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">256-bit AES encryption at rest and TLS 1.3 in transit.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Isolated Database Schema</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Strict relational user foreign-key boundaries with cascading deletion isolation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Clean Architecture Separation</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Strict Router &rarr; Service &rarr; Repository decoupling ensures reliable testability.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="inst-card p-6 rounded-xl border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <span className="text-xs font-mono font-bold text-[var(--text-main)]">SECURITY AUDIT LOG</span>
                <span className="text-[10px] font-mono text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded border border-[#16A34A]/20">PASSED 100%</span>
              </div>
              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] flex justify-between">
                  <span className="text-[var(--text-muted)]">Bcrypt Hash Salt (72-byte Limit)</span>
                  <span className="text-[#16A34A]">VERIFIED</span>
                </div>
                <div className="p-2.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] flex justify-between">
                  <span className="text-[var(--text-muted)]">JWT Bearer Token Signature</span>
                  <span className="text-[#16A34A]">HS256 ACTIVE</span>
                </div>
                <div className="p-2.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] flex justify-between">
                  <span className="text-[var(--text-muted)]">Pytest SQLite &amp; Postgres Dialect Check</span>
                  <span className="text-[#16A34A]">0 ERRORS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. TECHNOLOGY STACK ==================== */}
      <section id="technology" className="py-16 px-6 max-w-7xl mx-auto w-full border-b border-[var(--border-color)]">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-mono text-[#2563EB] font-bold uppercase tracking-wider">
            SYSTEM ENGINEERING
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text-main)]">
            Powered by High-Performance FinTech Architecture
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="inst-card p-4 rounded-xl border border-[var(--border-color)]">
            <div className="text-sm font-bold font-heading text-[var(--text-main)]">FastAPI</div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">Python 3.11 Async Backend</div>
          </div>
          <div className="inst-card p-4 rounded-xl border border-[var(--border-color)]">
            <div className="text-sm font-bold font-heading text-[var(--text-main)]">SQLAlchemy 2.0</div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">ORM &amp; Relational Schema</div>
          </div>
          <div className="inst-card p-4 rounded-xl border border-[var(--border-color)]">
            <div className="text-sm font-bold font-heading text-[var(--text-main)]">React 18 &amp; Vite</div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">High-Speed Single Page App</div>
          </div>
          <div className="inst-card p-4 rounded-xl border border-[var(--border-color)]">
            <div className="text-sm font-bold font-heading text-[var(--text-main)]">Docker &amp; Nginx</div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">Containerized Deployment</div>
          </div>
        </div>
      </section>

      {/* ==================== 7. INSTITUTIONAL CALL TO ACTION ==================== */}
      <section className="py-20 px-6 max-w-5xl mx-auto w-full text-center">
        <div className="inst-card p-10 rounded-2xl border border-[var(--border-color)] shadow-2xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-main)]">
            Ready to Elevate Your Wealth Management?
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            Join institutional investors utilizing OptiVest AI for real-time risk analytics, portfolio optimization, and continuous asset intelligence.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <button className="px-8 py-3.5 bg-[#2563EB] hover:bg-blue-500 text-white font-heading font-bold text-sm rounded-lg shadow-lg shadow-blue-900/30 transition-all border border-blue-400/30 flex items-center gap-2">
                <span>Create Investor Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3.5 bg-[var(--bg-main)] hover:bg-[var(--border-color)] text-[var(--text-main)] font-heading font-semibold text-sm rounded-lg border border-[var(--border-color)] transition-all">
                Sign In to Platform
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== 8. PROFESSIONAL INSTITUTIONAL FOOTER ==================== */}
      <footer className="mt-auto border-t border-[var(--border-color)] py-12 px-6 bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-[var(--text-muted)]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--text-main)] font-bold font-heading text-sm">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" />
              <span>OptiVest Intelligence</span>
            </div>
            <p className="leading-relaxed">
              Institutional wealth management platform providing real-time portfolio analytics and adaptive allocation governance.
            </p>
          </div>

          <div>
            <div className="font-mono font-bold text-[var(--text-main)] uppercase mb-3">Platform</div>
            <ul className="space-y-2">
              <li><a href="#markets" className="hover:text-[var(--text-main)]">Market Overview</a></li>
              <li><a href="#intelligence" className="hover:text-[var(--text-main)]">Risk Analytics</a></li>
              <li><a href="#features" className="hover:text-[var(--text-main)]">APDE Optimization</a></li>
              <li><Link to="/login" className="hover:text-[var(--text-main)]">Paper Trading Sandbox</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono font-bold text-[var(--text-main)] uppercase mb-3">Security &amp; Docs</div>
            <ul className="space-y-2">
              <li><a href="#security" className="hover:text-[var(--text-main)]">256-bit Encryption</a></li>
              <li><a href="#technology" className="hover:text-[var(--text-main)]">Clean Architecture</a></li>
              <li><Link to="/profile" className="hover:text-[var(--text-main)]">Governance Controls</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono font-bold text-[var(--text-main)] uppercase mb-3">Compliance &amp; Status</div>
            <div className="p-3 rounded bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
              <div className="text-[11px] font-mono text-[#16A34A] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span>SYSTEM STATUS: NORMAL</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">All core APIs operating within target latencies (&lt; 15ms).</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[var(--text-muted)]">
          <p>&copy; 2026 OptiVest AI Platform. Institutional Foundation. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[var(--text-main)] cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-[var(--text-main)] cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:text-[var(--text-main)] cursor-pointer">API Governance</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
