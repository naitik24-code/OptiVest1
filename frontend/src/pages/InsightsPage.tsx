import React from 'react';
import { Card } from '../components/ui/Card';


export const InsightsPage: React.FC = () => {
  const recommendations = [
    {
      id: 1,
      ticker: 'NVDA',
      action: 'REBALANCE_INCREASE',
      deltaPct: '+3.50%',
      confidence: 94,
      impact: 'Sharpe ratio increases +0.14 under tech momentum factor persistence.',
      shapFactors: [
        { factor: 'Q3 Revenue Consensus Beat', weight: '+0.42' },
        { factor: 'Relative Strength Index (RSI)', weight: '+0.31' },
        { factor: 'Low Debt-to-Equity Ratio', weight: '+0.21' },
      ]
    },
    {
      id: 2,
      ticker: 'TSLA',
      action: 'REBALANCE_DECREASE',
      deltaPct: '-2.00%',
      confidence: 86,
      impact: 'Reduces portfolio downside tail variance (VaR) by 1.8%.',
      shapFactors: [
        { factor: 'Gross Margin Compression', weight: '-0.45' },
        { factor: 'High Short-Term Volatility', weight: '-0.32' },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
          Quantitative Investment Insights &amp; Explainability
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          SHAP Shapley feature attributions and APDE constrained reallocation card rationales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <Card key={rec.id} title={`${rec.ticker} — Recommendation Card`} subtitle={`Confidence Level: ${rec.confidence}%`}>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                <div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">Suggested Reallocation</div>
                  <div className="text-base font-bold font-heading text-[var(--text-main)] mt-0.5">{rec.action}</div>
                </div>
                <div className={`text-lg font-mono font-black ${rec.deltaPct.startsWith('+') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {rec.deltaPct}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase mb-2">Expected Portfolio Impact</h4>
                <p className="text-xs text-[var(--text-main)] leading-relaxed bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)]">
                  {rec.impact}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase mb-2">SHAP Feature Attributions</h4>
                <div className="space-y-2">
                  {rec.shapFactors.map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-mono p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)]">{f.factor}</span>
                      <span className={`font-bold ${f.weight.startsWith('+') ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{f.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
