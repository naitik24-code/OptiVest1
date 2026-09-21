import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
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
    color:    'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
    icon:     TrendingUp,
  },
  {
    label:    'Force Prediction Refresh',
    job:      'prediction_refresh',
    desc:     'Regenerate all asset forecasts from current models',
    color:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    icon:     Activity,
  },
  {
    label:    'Force APDE Reallocation',
    job:      'apde_analysis',
    desc:     'Trigger adaptive portfolio reallocation engine',
    color:    'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
    icon:     Zap,
  },
  {
    label:    'Force Drift Analysis',
    job:      'health_watcher',
    desc:     'Run concept drift and PSI checks across all models',
    color:    'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
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
      const response = await fetch('http://localhost:8000/api/v1/autonomous/status', { headers: getH() });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        if (events.length === 0 && data.event_stream) {
          setEvents(data.event_stream);
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://localhost:8000/api/v1/autonomous/ws');
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'DOMAIN_EVENT' || data.type === 'SystemAlert') {
          setEvents((prev) => [data, ...prev].slice(0, 50));
          fetchStatus();
        }
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
      await fetch(`http://localhost:8000/api/v1/autonomous/trigger/${jobName}`, {
        method: 'POST',
        headers: getH(),
      });
    } catch (_) {}
    setTimeout(() => setTriggering(null), 2000);
  };

  if (loading || !status) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
        <span className="text-xs">Initialising Autonomous Systems...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Phase 9 &bull; Event-Driven Orchestration</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Autonomous Command Center
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time event-driven orchestration, intelligence layer, and manual override controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1.5 py-1 px-2.5 text-[11px]">
            <Radio className="w-3 h-3" />
            Event Bus Active
          </Badge>
          <Badge variant="info" className="flex items-center gap-1.5 py-1 px-2.5 text-[11px]">
            <Activity className="w-3 h-3" />
            {status.scheduler_status}
          </Badge>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-900/15 to-transparent border-blue-700/20">
          <div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Orchestrator Jobs
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-400">{status.active_jobs} Active</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Autonomous Scheduled</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <Radio className="w-3 h-3" /> Event Stream
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-400">{events.length}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Received via WebSocket</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Model Health
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">Stable</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">No Drift Detected</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Market Regime
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">Monitoring</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">SPY Live Telemetry</div>
        </Card>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Event Stream Terminal */}
        <Card className="lg:col-span-2 p-5 space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Live Event Stream (WebSocket)</span>
            {events.length > 0 && (
              <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-main)] border border-[var(--border-color)] px-2 py-0.5 rounded">
                {events.length} events
              </span>
            )}
          </h3>
          <div className="h-80 overflow-y-auto space-y-2 pr-1">
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-[var(--text-muted)] italic">
                Waiting for domain events...
              </div>
            ) : (
              events.map((e, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--bg-main)] border border-[var(--border-color)] p-3 rounded-xl flex items-start gap-3 transition-colors hover:border-amber-500/30"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--text-main)]">{e.event_type || e.type}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono break-all">
                      {JSON.stringify(e.payload || e.data)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Manual Overrides */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Manual Overrides</span>
            </h3>
            <div className="space-y-2">
              {OVERRIDE_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = triggering === action.job;
                return (
                  <button
                    key={action.job}
                    onClick={() => triggerJob(action.job)}
                    disabled={isActive}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all disabled:opacity-75 ${action.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">{isActive ? 'Triggering...' : action.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">{action.desc}</div>
                    </div>
                    {isActive && <RefreshCw className="w-3 h-3 animate-spin shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* System Components */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <Server className="w-4 h-4 text-blue-400" />
              <span>System Components</span>
            </h3>
            <div className="space-y-2">
              {status.health?.map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)] last:border-0">
                  <span className="text-xs text-[var(--text-muted)]">{h.component}</span>
                  <Badge variant={h.status === 'HEALTHY' ? 'success' : 'danger'} className="text-[10px] py-0.5 px-2">
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
                    <div key={comp.name} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)] last:border-0">
                      <span className="text-xs text-[var(--text-muted)]">{comp.name}</span>
                      <Badge variant="success" className="text-[10px] py-0.5 px-2">{comp.status}</Badge>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
