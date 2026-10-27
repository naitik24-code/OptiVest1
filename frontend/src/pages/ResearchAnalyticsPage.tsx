import React, { useState, useEffect } from 'react';
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#14b8a6] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Analytics &bull; Dissertation &amp; Research Validation</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Research Analytics Engine
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Empirical APDE performance reports &bull; Publication-grade AI alpha metrics
          </p>
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-[16px] py-[10px] bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[13px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] rounded-[6px] flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Generate Report
        </button>
      </div>

      {/* ── Error State ── */}
      {error ? (
        <div className="inst-card p-[40px] text-center flex flex-col items-center gap-[16px] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
          <AlertCircle className="w-12 h-12 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] z-10 relative" />
          <div className="z-10 relative">
            <div className="font-extrabold font-heading text-[18px] text-amber-500 mb-1">Insufficient Data</div>
            <div className="text-[13px] font-mono text-[var(--text-muted)]">{error}</div>
          </div>
        </div>
      ) : report ? (
        <>
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px]">
            <div className="inst-card p-[24px] bg-gradient-to-br from-[#14b8a6]/10 to-[#050608] border-[#14b8a6]/30 shadow-[0_0_15px_rgba(20,184,166,0.1)] relative overflow-hidden group">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 z-10 relative">
                <TrendingUp className="w-4 h-4 text-[#14b8a6]" /> AI Portfolio Sharpe
              </div>
              <div className="text-[32px] font-mono font-extrabold text-[#14b8a6] leading-none mb-2 drop-shadow-[0_0_5px_rgba(20,184,166,0.3)] z-10 relative">
                {report.ai_portfolio_sharpe?.toFixed(2) || '0.00'}
              </div>
              <div className="text-[11px] font-mono font-bold text-[var(--success)] z-10 relative">
                Benchmark: {report.benchmark_sharpe?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="inst-card p-[24px] relative overflow-hidden group">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 z-10 relative">
                <BarChart3 className="w-4 h-4 text-[var(--secondary)]" /> Sharpe Improvement
              </div>
              <div className="text-[32px] font-mono font-extrabold text-[var(--secondary)] leading-none mb-2 drop-shadow-[0_0_5px_rgba(76,139,255,0.3)] z-10 relative">
                +{((report.sharpe_improvement_pct || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] z-10 relative">
                Over Buy-and-Hold Benchmark
              </div>
            </div>

            <div className="inst-card p-[24px] relative overflow-hidden group">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 z-10 relative">
                <ShieldCheck className="w-4 h-4 text-[#a855f7]" /> Risk Reduction
              </div>
              <div className="text-[32px] font-mono font-extrabold text-[#a855f7] leading-none mb-2 drop-shadow-[0_0_5px_rgba(168,85,247,0.3)] z-10 relative">
                -{((report.risk_reduction_pct || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] z-10 relative">
                Drawdown Volatility Delta
              </div>
            </div>

            <div className="inst-card p-[24px] relative overflow-hidden group">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 z-10 relative">
                <Award className="w-4 h-4 text-[#eab308]" /> Decision Accuracy
              </div>
              <div className="text-[32px] font-mono font-extrabold text-[#eab308] leading-none mb-2 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)] z-10 relative">
                {((report.decision_accuracy || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] z-10 relative">
                Over {report.total_decisions || 0} decisions
              </div>
            </div>
          </div>

          {/* ── Executive Report Card ── */}
          <div className="inst-card p-[32px]">
            <div className="flex justify-between items-start gap-4 pb-[20px] mb-[20px] border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-[16px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] m-0">
                  {report.title || 'APDE Performance & Alpha Dissertation Report'}
                </h3>
                <div className="text-[12px] font-mono font-bold text-[var(--text-muted)] mt-1">
                  Empirical research export for academic &amp; quantitative publications
                </div>
              </div>
              <button
                onClick={handleExport}
                className="px-[16px] py-[10px] rounded-[6px] bg-[#14b8a6] hover:bg-[#0d9488] text-[#050608] font-bold font-mono text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Report
              </button>
            </div>

            <div className="p-[20px] rounded-[8px] bg-background border border-[var(--border-color)] text-[13px] leading-[1.6] space-y-3 font-mono">
              <div className="text-[#14b8a6] font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Executive Abstract
              </div>
              <p className="text-[var(--text-main)]">{report.summary || 'No summary text available.'}</p>
            </div>
          </div>
        </>
      ) : (
        !loading && (
          <div className="inst-card p-[60px] text-center flex flex-col items-center gap-[16px]">
            <FileText className="w-12 h-12 text-[var(--text-muted)] opacity-50" />
            <div className="text-[13px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">No research report available yet.</div>
          </div>
        )
      )}

      {/* ── Research Timeline — always shown ── */}
      <div className="inst-card p-[32px]">
        <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
          <FileText className="w-5 h-5 text-[#14b8a6]" />
          <span>Research &amp; Development Timeline</span>
        </h3>
        <div className="space-y-[16px]">
          {RESEARCH_MILESTONES.map((m, i) => (
            <div key={i} className="flex gap-[16px] items-start">
              <div className="shrink-0 mt-1">
                <div className="w-[100px] text-[10px] font-mono font-bold text-[#14b8a6] text-right uppercase tracking-wider">{m.phase}</div>
              </div>
              <div className="w-px bg-[var(--border-color)] self-stretch mx-[8px] shrink-0" />
              <div className="flex-1 pb-[16px] border-b border-[var(--border-color)]/50 last:border-0 last:pb-0">
                <div className="text-[14px] font-bold font-heading text-[var(--text-main)]">{m.title}</div>
                <div className="text-[12px] font-mono text-[var(--text-muted)] mt-1">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResearchAnalyticsPage;
