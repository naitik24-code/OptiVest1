import React from 'react';
import { Card } from '../components/ui/Card';


export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
          Quantitative Portfolio Performance &amp; Risk Analytics
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Historical drawdown statistics, benchmark alpha, and risk-adjusted ratio decomposition.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Annualized Return" subtitle="CAGR Metric">
          <div className="text-2xl font-mono font-bold text-[#16A34A]">+18.4%</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Outperforming S&amp;P 500 (+12.1%)</div>
        </Card>

        <Card title="Sharpe Ratio" subtitle="Risk-Adjusted Return">
          <div className="text-2xl font-mono font-bold text-[var(--text-main)]">2.48</div>
          <div className="text-[11px] text-[#0EA5E9] mt-1">Top 5% Institutional Tier</div>
        </Card>

        <Card title="Maximum Drawdown" subtitle="Peak-to-Trough Loss">
          <div className="text-2xl font-mono font-bold text-[#DC2626]">-4.2%</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Bounded by APDE C_realloc = 15%</div>
        </Card>

        <Card title="Beta vs S&amp;P 500" subtitle="Market Sensitivity">
          <div className="text-2xl font-mono font-bold text-[var(--text-main)]">0.82</div>
          <div className="text-[11px] text-[#16A34A] mt-1">Lower Volatility Than Benchmark</div>
        </Card>
      </div>

      {/* Performance Curve Visualization Card */}
      <Card title="Portfolio vs Benchmark Growth Curve" subtitle="USD Normalized ($100k Base)">
        <div className="h-64 w-full relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Grid */}
            <line x1="0" y1="40" x2="600" y2="40" stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1="90" x2="600" y2="90" stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1="140" x2="600" y2="140" stroke="var(--border-color)" strokeDasharray="3 3" strokeWidth="0.8" />

            {/* Benchmark line */}
            <path
              d="M0,140 Q150,130 300,100 T600,60"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Portfolio line */}
            <path
              d="M0,140 Q150,110 300,70 T600,20 L600,180 L0,180 Z"
              fill="url(#analyticsGrad)"
            />
            <path
              d="M0,140 Q150,110 300,70 T600,20"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
            />
          </svg>
        </div>
        <div className="flex justify-between items-center text-xs font-mono text-[var(--text-muted)] pt-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#2563EB]"></div>
            <span className="font-bold text-[var(--text-main)]">OptiVest Managed Portfolio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[var(--text-muted)] border-dashed"></div>
            <span>S&amp;P 500 Index Benchmark</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
