import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { FileText, Download, RefreshCw, AlertCircle, TrendingUp, BarChart3, ShieldCheck, Award } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

const downloadBlob = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const RESEARCH_MILESTONES = [
  { phase: 'Phase 1–4',  title: 'Core Infrastructure',          desc: 'RBAC auth, portfolio engine, watchlist, paper trading' },
  { phase: 'Phase 5',    title: 'ML Engine Initiation',          desc: 'LSTM + XGBoost + Transformer training pipeline' },
  { phase: 'Phase 6',    title: 'Feature Engineering',           desc: '200+ features: RAW, TECHNICAL, FUNDAMENTAL, MACRO, SENTIMENT' },
  { phase: 'Phase 7',    title: 'Prediction Engine',             desc: 'Multi-horizon forecasting with confidence scoring' },
  { phase: 'Phase 8',    title: 'Model Registry & Versioning',   desc: 'MLflow-style lifecycle management with A/B compare' },
  { phase: 'Phase 9',    title: 'Autonomous Orchestration',      desc: 'Event-driven APScheduler + WebSocket real-time feed' },
  { phase: 'Phase 10–19',title: 'APDE & Research Validation',   desc: 'Adaptive Portfolio Decision Engine, benchmark validation, dissertation export' },
];

export const ResearchAnalyticsPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/v1/paper-trading/research-analytics', { headers: getH() });
      if (res.ok) {
        const d = await res.json();
        if (d.error || d.status === 'INSUFFICIENT_DATA') {
          setError(d.error || d.message);
        } else {
          setReport(d);
        }
      } else {
        setError('Failed to fetch research report.');
      }
    } catch (_) {
      setError('Network error fetching research report.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, []);

  const handleExport = () => {
    if (!report) return;
    const content = `OPTIVEST AI — RESEARCH ANALYTICS REPORT
Generated: ${new Date().toISOString()}
${'='.repeat(60)}

${report.title || 'APDE Performance & Alpha Dissertation Report'}

EXECUTIVE ABSTRACT
${'-'.repeat(40)}
${report.summary || 'No summary available.'}

KEY METRICS
${'-'.repeat(40)}
AI Portfolio Sharpe:     ${report.ai_portfolio_sharpe?.toFixed(4) ?? 'N/A'}
Benchmark Sharpe:        ${report.benchmark_sharpe?.toFixed(4) ?? 'N/A'}
Sharpe Improvement:      +${((report.sharpe_improvement_pct || 0) * 100).toFixed(2)}%
Risk Reduction:          -${((report.risk_reduction_pct || 0) * 100).toFixed(2)}%
Decision Accuracy:       ${((report.decision_accuracy || 0) * 100).toFixed(2)}%
Total Decisions:         ${report.total_decisions || 0}
`;
    downloadBlob(content, `optivest_research_report_${Date.now()}.txt`, 'text/plain');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Analytics &bull; Dissertation &amp; Research Validation</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Research Analytics Engine
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Empirical APDE performance reports • Publication-grade AI alpha metrics
          </p>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Generate Report
        </button>
      </div>

      {/* ── Error State ── */}
      {error ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3 bg-amber-500/5 border-amber-500/20">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <div className="font-bold text-amber-500">Insufficient Data</div>
          <div className="text-sm text-[var(--text-muted)]">{error}</div>
        </Card>
      ) : report ? (
        <>
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-emerald-950/20 to-[var(--bg-card)] border-emerald-900/30">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                <TrendingUp className="w-3.5 h-3.5" /> AI Portfolio Sharpe
              </div>
              <div className="text-2xl font-mono font-bold text-emerald-400">{report.ai_portfolio_sharpe?.toFixed(2) || '0.00'}</div>
              <div className="text-[10px] text-emerald-500 mt-1">Benchmark: {report.benchmark_sharpe?.toFixed(2) || '0.00'}</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                <BarChart3 className="w-3.5 h-3.5" /> Sharpe Improvement
              </div>
              <div className="text-2xl font-mono font-bold text-sky-400">
                +{((report.sharpe_improvement_pct || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Over Buy-and-Hold Benchmark</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Risk Reduction
              </div>
              <div className="text-2xl font-mono font-bold text-purple-400">
                -{((report.risk_reduction_pct || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Drawdown Volatility Delta</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1">
                <Award className="w-3.5 h-3.5" /> Decision Accuracy
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400">
                {((report.decision_accuracy || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">Over {report.total_decisions || 0} decisions</div>
            </Card>
          </div>

          {/* ── Executive Report Card ── */}
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  {report.title || 'APDE Performance & Alpha Dissertation Report'}
                </h2>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Empirical research export for academic &amp; quantitative publications
                </div>
              </div>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Export Report
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs leading-relaxed space-y-3 font-mono">
              <div className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Executive Abstract</div>
              <p className="text-[var(--text-main)]">{report.summary || 'No summary text available.'}</p>
            </div>
          </Card>
        </>
      ) : (
        !loading && (
          <Card className="p-12 text-center flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-[var(--text-muted)] opacity-40" />
            <div className="text-sm text-[var(--text-muted)]">No research report available yet.</div>
          </Card>
        )
      )}

      {/* ── Research Timeline — always shown ── */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Research &amp; Development Timeline</span>
        </h3>
        <div className="space-y-3">
          {RESEARCH_MILESTONES.map((m, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="shrink-0 mt-0.5">
                <div className="w-16 text-[10px] font-mono font-bold text-emerald-400 text-right">{m.phase}</div>
              </div>
              <div className="w-px bg-[var(--border-color)] self-stretch mx-2 shrink-0" />
              <div className="flex-1 pb-3 border-b border-[var(--border-color)] last:border-0">
                <div className="text-xs font-bold text-[var(--text-main)]">{m.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ResearchAnalyticsPage;
