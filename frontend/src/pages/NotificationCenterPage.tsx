import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, TrendingUp, CheckCircle2, Info,
  RefreshCw, BellOff,
} from 'lucide-react';
import { apiClient as api } from '../services/apiClient';

type NotifType = 'ALL' | 'MARKET_REGIME_CHANGE' | 'RECOMMENDATION_GENERATED' | 'PREDICTION_CONFIDENCE_DROP' | 'PAPER_TRADE_COMPLETED';

const FILTERS: { label: string; value: NotifType }[] = [
  { label: 'All',         value: 'ALL' },
  { label: 'Market',      value: 'MARKET_REGIME_CHANGE' },
  { label: 'Trade',       value: 'PAPER_TRADE_COMPLETED' },
  { label: 'AI Signal',   value: 'RECOMMENDATION_GENERATED' },
  { label: 'Alerts',      value: 'PREDICTION_CONFIDENCE_DROP' },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'MARKET_REGIME_CHANGE':       return <AlertTriangle className="w-5 h-5 text-[#eab308]" />;
    case 'RECOMMENDATION_GENERATED':   return <TrendingUp className="w-5 h-5 text-[var(--success)]" />;
    case 'PREDICTION_CONFIDENCE_DROP': return <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />;
    case 'PAPER_TRADE_COMPLETED':      return <CheckCircle2 className="w-5 h-5 text-[var(--secondary)]" />;
    default:                           return <Info className="w-5 h-5 text-[var(--text-muted)]" />;
  }
};

const getAccentClass = (type: string, unread: boolean) => {
  if (!unread) return 'border-l-[var(--border-color)] bg-background opacity-60';
  switch (type) {
    case 'MARKET_REGIME_CHANGE':       return 'border-l-[#eab308] bg-[#eab308]/5 shadow-[0_0_15px_rgba(234,179,8,0.1)]';
    case 'PREDICTION_CONFIDENCE_DROP': return 'border-l-[var(--danger)] bg-[var(--danger)]/5 shadow-[0_0_15px_rgba(255,74,99,0.1)]';
    case 'RECOMMENDATION_GENERATED':   return 'border-l-[var(--success)] bg-[var(--success)]/5 shadow-[0_0_15px_rgba(23,217,140,0.1)]';
    case 'PAPER_TRADE_COMPLETED':      return 'border-l-[var(--secondary)] bg-[var(--secondary)]/5 shadow-[0_0_15px_rgba(76,139,255,0.1)]';
    default:                           return 'border-l-[var(--primary)] bg-[var(--primary)]/5 shadow-[0_0_15px_rgba(255,90,31,0.1)]';
  }
};

export const NotificationCenterPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotifType>('ALL');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/autonomous/notifications');
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = notifications.filter(
    (n) => filter === 'ALL' || n.type === filter,
  );

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-3 text-[var(--text-muted)] font-mono text-[13px]">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
        <span>Loading notification stream...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--danger)] uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Infrastructure &bull; System Alerts</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)] flex items-center gap-3">
            Notification Center
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-[6px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-[12px] font-mono font-bold tracking-wider uppercase">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            AI-generated alerts, market events, and autonomous system notifications.
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="inst-card p-[8px] flex items-center gap-1 w-fit overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-[16px] py-[10px] text-[11px] font-mono font-bold tracking-wider uppercase rounded-[6px] transition-all cursor-pointer flex items-center gap-2 ${
              filter === f.value
                ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30 shadow-[0_0_10px_rgba(255,74,99,0.1)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'
            }`}
          >
            <span>{f.label}</span>
            {f.value === 'ALL' && unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] ${filter === f.value ? 'bg-[var(--danger)] text-white' : 'bg-[var(--surface2)] text-[var(--text-main)]'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification List ── */}
      <div className="space-y-[16px]">
        {filtered.length === 0 ? (
          <div className="inst-card p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-[12px] bg-background border border-[var(--border-color)] flex items-center justify-center">
              <BellOff className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
            </div>
            <p className="text-[14px] font-mono text-[var(--text-muted)]">
              {filter === 'ALL' ? "You're all caught up! No notifications." : `No ${filter.replace(/_/g, ' ')} notifications.`}
            </p>
          </div>
        ) : (
          filtered.map((notif: any) => (
            <div
              key={notif.id}
              className={`inst-card p-[20px] border-l-4 transition-all ${getAccentClass(notif.type, !notif.is_read)}`}
            >
              <div className="flex gap-[16px] items-start">
                <div className="w-[48px] h-[48px] rounded-[10px] bg-background border border-[var(--border-color)] flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-[16px] font-bold font-heading text-[var(--text-main)] leading-tight drop-shadow-sm">{notif.title}</h3>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono shrink-0 uppercase tracking-wider">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[13px] font-mono text-[var(--text-muted)] mb-[16px] leading-relaxed">{notif.message}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-[8px] py-[4px] bg-background border border-[var(--border-color)] rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {notif.type.replace(/_/g, ' ')}
                    </span>
                    {notif.channel && (
                      <span className="px-[8px] py-[4px] bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--primary)]">
                        {notif.channel}
                      </span>
                    )}
                    {!notif.is_read && (
                      <span className="px-[8px] py-[4px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--danger)] animate-pulse">
                        UNREAD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
