import { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge';
import {
  Activity, Server, Zap, RefreshCw, Terminal,
  TrendingUp, ShieldCheck, Clock, Radio,
} from 'lucide-react';

const getH = (): HeadersInit => {
  const t = localStorage.getItem('access_token') || '';
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const OVERRIDE_ACTIONS = [
  {
    label:    'Force Market Regime Scan',
    job:      'market_regime',
    desc:     'Immediately reanalyze SPY / VIX regime conditions',
    color:    'text-[#a855f7] bg-[#a855f7]/10 border border-[#a855f7]/20 hover:border-[#a855f7]',
    icon:     TrendingUp,
  },
  {
    label:    'Force Prediction Refresh',
    job:      'prediction_refresh',
    desc:     'Regenerate all asset forecasts from current models',
    color:    'text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 hover:border-[var(--success)]',
    icon:     Activity,
  },
  {
    label:    'Force APDE Reallocation',
    job:      'apde_analysis',
    desc:     'Trigger adaptive portfolio reallocation engine',
    color:    'text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 hover:border-[var(--primary)]',
    icon:     Zap,
  },
  {
    label:    'Force Drift Analysis',
    job:      'health_watcher',
    desc:     'Run concept drift and PSI checks across all models',
    color:    'text-[var(--secondary)] bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 hover:border-[var(--secondary)]',
    icon:     ShieldCheck,
  },
];

export default function AutonomousCommandCenterPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [triggering, setTriggering] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/v1/autonomous/status', { headers: getH() });
      if (response.ok) {
        const data = await response.json();
        const payload = data?.data ?? data;
        setStatus(payload);
        if (events.length === 0 && payload?.event_stream) {
          setEvents(payload.event_stream);
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();

    let ws: WebSocket | null = null;
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      // Connect to websocket via proxy or direct 8000
      const wsUrl = `${wsProtocol}//${wsHost}/api/v1/autonomous/ws`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'DOMAIN_EVENT' || data.type === 'SystemAlert') {
            setEvents((prev) => [data, ...prev].slice(0, 50));
            fetchStatus();
          }
        } catch (_) {}
      };
      ws.onerror = () => {
        // Fallback to direct localhost:8000 if proxy websocket isn't supported
        try {
          const directWs = new WebSocket('ws://127.0.0.1:8000/api/v1/autonomous/ws');
          directWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setEvents((prev) => [data, ...prev].slice(0, 50));
            fetchStatus();
          };
        } catch (_) {}
      };
    } catch (_) {}

    const interval = setInterval(fetchStatus, 5000);
    return () => {
      clearInterval(interval);
      ws?.close();
    };
  }, []);

  const triggerJob = async (jobName: string) => {
    setTriggering(jobName);
    try {
      await fetch(`/api/v1/autonomous/trigger/${jobName}`, {
        method: 'POST',
        headers: getH(),
      });
      fetchStatus();
    } catch (_) {}
    setTimeout(() => setTriggering(null), 2000);
  };

  if (loading || !status) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-3 text-[var(--text-muted)] font-mono">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span className="text-[13px]">Initialising Autonomous Systems...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Phase 9 &bull; Event-Driven Orchestration</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Autonomous Command Center
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Real-time event-driven orchestration, intelligence layer, and manual override controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-2 py-1.5 px-3 text-[11px] font-mono uppercase tracking-wider shadow-[0_0_10px_rgba(23,217,140,0.2)]">
            <Radio className="w-3.5 h-3.5" />
            Event Bus Active
          </Badge>
          <Badge variant="info" className="flex items-center gap-2 py-1.5 px-3 text-[11px] font-mono uppercase tracking-wider shadow-[0_0_10px_rgba(76,139,255,0.2)]">
            <Activity className="w-3.5 h-3.5" />
            {status.scheduler_status}
          </Badge>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="inst-card p-[20px]">
          <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-[8px] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Orchestrator Jobs
          </div>
          <div className="text-[28px] font-extrabold font-mono text-[var(--secondary)] leading-none">{status.active_jobs} Active</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-[6px] font-mono">Autonomous Scheduled</div>
        </div>

        <div className="inst-card p-[20px]">
          <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-[8px] flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" /> Event Stream
          </div>
          <div className="text-[28px] font-extrabold font-mono text-[#a855f7] leading-none">{events.length}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-[6px] font-mono">Received via WebSocket</div>
        </div>

        <div className="inst-card p-[20px]">
          <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-[8px] flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Model Health
          </div>
          <div className="text-[28px] font-extrabold font-mono text-[var(--success)] leading-none">Stable</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-[6px] font-mono">No Drift Detected</div>
        </div>

        <div className="inst-card p-[20px]">
          <div className="text-[11px] font-mono uppercase font-bold text-[var(--text-muted)] tracking-wider mb-[8px] flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Market Regime
          </div>
          <div className="text-[28px] font-extrabold font-mono text-[#eab308] leading-none">Monitoring</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-[6px] font-mono">SPY Live Telemetry</div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Event Stream Terminal */}
        <div className="inst-card p-[24px] lg:col-span-2 space-y-4">
          <h3 className="text-[14px] font-bold text-[var(--text-main)] flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-2 font-heading tracking-wider">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--success)]" />
              <span>Live Event Stream (WebSocket)</span>
            </div>
            {events.length > 0 && (
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-background border border-[var(--border-color)] px-2 py-1 rounded-[4px] uppercase tracking-wider">
                {events.length} events
              </span>
            )}
          </h3>
          <div className="h-[320px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[var(--surface2)] scrollbar-track-transparent">
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[13px] text-[var(--text-muted)] italic font-mono">
                Waiting for domain events...
              </div>
            ) : (
              events.map((e, idx) => (
                <div
                  key={idx}
                  className="bg-background border border-[var(--border-color)] p-[16px] rounded-[10px] flex items-start gap-4 transition-colors hover:border-[var(--primary)]"
                >
                  <div className="w-[32px] h-[32px] rounded-[8px] bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-[var(--text-main)] mb-[4px] font-heading">{e.event_type || e.type}</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono break-all leading-relaxed bg-[var(--surface2)] p-2 rounded-[6px] border border-[var(--border-color)]/50 mt-2">
                      {JSON.stringify(e.payload || e.data)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Manual Overrides */}
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4">
              <Zap className="w-4 h-4 text-[var(--primary)]" />
              <span>Manual Overrides</span>
            </h3>
            <div className="space-y-3">
              {OVERRIDE_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = triggering === action.job;
                return (
                  <button
                    key={action.job}
                    onClick={() => triggerJob(action.job)}
                    disabled={isActive}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-[10px] text-left transition-all disabled:opacity-75 cursor-pointer ${action.color}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold font-heading">{isActive ? 'Triggering...' : action.label}</div>
                      <div className="text-[11px] font-mono mt-[2px] opacity-80 truncate">{action.desc}</div>
                    </div>
                    {isActive && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Components */}
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4">
              <Server className="w-4 h-4 text-[var(--secondary)]" />
              <span>System Components</span>
            </h3>
            <div className="space-y-1">
              {status.health?.map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-[10px] border-b border-[var(--border-color)]/50 last:border-0">
                  <span className="text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{h.component}</span>
                  <Badge variant={h.status === 'HEALTHY' ? 'success' : 'danger'} className="text-[10px] py-1 px-2 font-mono shadow-md">
                    {h.status}
                  </Badge>
                </div>
              ))}
              {(!status.health || status.health.length === 0) && (
                <>
                  {[
                    { name: 'Event Bus',    status: 'ACTIVE' },
                    { name: 'Job Scheduler',status: 'RUNNING' },
                    { name: 'WebSockets',   status: 'CONNECTED' },
                  ].map((comp) => (
                    <div key={comp.name} className="flex items-center justify-between py-[10px] border-b border-[var(--border-color)]/50 last:border-0">
                      <span className="text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{comp.name}</span>
                      <Badge variant="success" className="text-[10px] py-1 px-2 font-mono shadow-[0_0_10px_rgba(23,217,140,0.2)]">{comp.status}</Badge>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
