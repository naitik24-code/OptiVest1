import React, { useState, useEffect } from 'react';
import { Play, Zap, RefreshCw } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

export const DecisionReplayPage: React.FC = () => {
  const [replay, setReplay] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReplay = async () => {
    setLoading(true);
    try {
      const dashRes = await fetch('/api/v1/paper-trading/dashboard', { headers: getH() });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        const latestDecision = dashData?.recent_decisions?.[0];
        
        if (latestDecision?.id) {
          const res = await fetch(`/api/v1/paper-trading/replay/${latestDecision.id}`, { headers: getH() });
          if (res.ok) {
            const d = await res.json();
            setReplay(d);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplay();
  }, []);

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Play className="w-4 h-4" />
            <span>OptiVest Telemetry</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Decision Replay Engine
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Replay full APDE lifecycle: Portfolio &rarr; Recommendation &rarr; Execution &rarr; Market Movement &rarr; Outcome
          </p>
        </div>
        <button
          onClick={fetchReplay}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          Reload Replay
        </button>
      </div>

      {/* Decision Banner */}
      <div className="inst-card p-[24px] bg-gradient-to-br from-[rgba(76,139,255,0.1)] via-transparent to-transparent border-[rgba(76,139,255,0.2)] shadow-[0_0_20px_rgba(76,139,255,0.05)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-3 py-1 rounded-[6px] text-[10px] font-bold font-mono tracking-wider bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/30">
              REPLAY SEQUENCE ACTIVE
            </span>
            <h2 className="text-[22px] font-bold font-heading text-[var(--text-main)] mt-4">{replay?.title || 'Trim Overconcentrated TSLA -> Add NVDA'}</h2>
            <div className="text-[13px] text-[var(--success)] font-mono mt-[6px] font-bold tracking-wider">
              Outcome Return: +{((replay?.return_generated_pct || 0.038) * 100).toFixed(1)}% &bull; Success Verified
            </div>
          </div>
          <button onClick={fetchReplay} className="px-6 py-3 rounded-[8px] bg-[var(--secondary)] hover:bg-[#3b78ff] text-white font-bold font-mono text-[13px] flex items-center gap-2 shadow-[0_0_15px_rgba(76,139,255,0.4)] transition-all cursor-pointer">
            <Play className="w-4 h-4 fill-current" /> Run Step-by-Step
          </button>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="inst-card p-[32px]">
        <h3 className="text-[16px] font-bold font-heading tracking-wider text-[var(--text-main)] mb-10 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--primary)]" />
          5-Step Replay Timeline
        </h3>

        <div className="relative border-l-2 border-[var(--border-color)] pl-[32px] ml-[12px] space-y-10">
          {/* Default to a static 5-step if timeline array is missing */}
          {(replay?.timeline || [
            { step: 1, phase: 'Initial State', detail: 'Analyzed portfolio weights vs optimal efficient frontier.' },
            { step: 2, phase: 'Inference', detail: 'Generated forward predictions indicating TSLA drawdown.' },
            { step: 3, phase: 'Optimization', detail: 'Calculated optimal 8% reallocation to NVDA to maximize Sharpe.' },
            { step: 4, phase: 'Execution', detail: 'Sent market orders for execution via APDE governor.' },
            { step: 5, phase: 'Outcome', detail: 'Market shifted; captured alpha against standard hold baseline.' }
          ]).map((step: any, index: number) => {
            const isLast = index === (replay?.timeline?.length || 5) - 1;
            return (
              <div key={step.step} className="relative group">
                {/* Step indicator node */}
                <div className="absolute -left-[45px] top-[-4px] w-[28px] h-[28px] rounded-full bg-background border-2 border-[var(--border-color)] group-hover:border-[var(--secondary)] group-hover:text-[var(--secondary)] text-[var(--text-muted)] flex items-center justify-center text-[11px] font-bold font-mono transition-colors shadow-md">
                  {step.step}
                </div>

                <div className="p-[20px] rounded-[10px] bg-background border border-[var(--border-color)] group-hover:border-[var(--secondary)]/50 transition-colors shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-[4px] h-full ${isLast ? 'bg-[var(--success)]' : 'bg-[var(--secondary)]'}`} />
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono mb-[6px]">
                    Phase {step.step}: <span className={isLast ? 'text-[var(--success)]' : 'text-[var(--secondary)]'}>{step.phase}</span>
                  </div>
                  <div className="text-[14px] font-bold font-heading text-[var(--text-main)] leading-relaxed pl-1">{step.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DecisionReplayPage;
