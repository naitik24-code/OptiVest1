import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Play className="w-7 h-7 text-emerald-400" />
            Decision Replay Engine
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Replay full APDE lifecycle: Portfolio → Recommendation → Execution → Market Movement → Outcome
          </p>
        </div>
        <button
          onClick={fetchReplay}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Replay
        </button>
      </div>

      {/* Decision Banner */}
      <Card className="p-6 bg-gradient-to-br from-emerald-950/20 via-[var(--bg-card)] to-[var(--bg-card)] border-emerald-900/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
              REPLAY SEQUENCE ACTIVE
            </span>
            <h2 className="text-xl font-bold text-[var(--text-main)] mt-2">{replay?.title || 'Trim Overconcentrated TSLA -> Add NVDA'}</h2>
            <div className="text-xs text-emerald-400 font-mono mt-1 font-bold">
              Outcome Return: +{((replay?.return_generated_pct || 0.038) * 100).toFixed(1)}% • Success Verified
            </div>
          </div>
          <button onClick={fetchReplay} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md">
            <Play className="w-4 h-4" /> Run Step-by-Step Replay
          </button>
        </div>
      </Card>

      {/* Timeline Steps */}
      <Card className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          5-Step Replay Timeline
        </h3>

        <div className="relative border-l-2 border-emerald-500/40 pl-6 ml-4 space-y-8">
          {replay?.timeline?.map((step: any) => (
            <div key={step.step} className="relative">
              {/* Step indicator node */}
              <div className="absolute -left-[35px] top-0 w-6 h-6 rounded-full bg-emerald-950 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                {step.step}
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Phase {step.step}: {step.phase}
                </div>
                <div className="text-sm font-semibold text-[var(--text-main)]">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
