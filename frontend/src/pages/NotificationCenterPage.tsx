import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
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
    case 'MARKET_REGIME_CHANGE':       return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    case 'RECOMMENDATION_GENERATED':   return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case 'PREDICTION_CONFIDENCE_DROP': return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case 'PAPER_TRADE_COMPLETED':      return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
    default:                           return <Info className="w-4 h-4 text-[var(--text-muted)]" />;
  }
};

const getAccentClass = (type: string, unread: boolean) => {
  if (!unread) return 'border-l-[var(--border-color)]';
  switch (type) {
    case 'MARKET_REGIME_CHANGE':       return 'border-l-orange-500';
    case 'PREDICTION_CONFIDENCE_DROP': return 'border-l-red-500';
    case 'RECOMMENDATION_GENERATED':   return 'border-l-emerald-500';
    case 'PAPER_TRADE_COMPLETED':      return 'border-l-blue-500';
    default:                           return 'border-l-[#2563EB]';
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
      <div className="p-8 text-center flex flex-col items-center gap-3 text-[var(--text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
        <span className="text-xs">Loading notification stream...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Infrastructure &bull; System Alerts</span>
          </div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)] flex items-center gap-3">
            Notification Center
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            AI-generated alerts, market events, and autonomous system notifications.
          </p>
        </div>
        <button
          onClick={fetchNotifications}
          className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              filter === f.value
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {f.label}
            {f.value === 'ALL' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification List ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center">
              <BellOff className="w-7 h-7 text-[var(--text-muted)] opacity-50" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {filter === 'ALL' ? "You're all caught up! No notifications." : `No ${filter.replace(/_/g, ' ')} notifications.`}
            </p>
          </div>
        ) : (
          filtered.map((notif: any) => (
            <Card
              key={notif.id}
              className={`p-4 border-l-4 transition-all ${getAccentClass(notif.type, !notif.is_read)} ${notif.is_read ? 'opacity-60' : ''}`}
            >
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-main)] leading-tight">{notif.title}</h3>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{notif.message}</p>
                  <div className="mt-2.5 flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded text-[10px] font-mono font-bold text-[var(--text-muted)]">
                      {notif.type.replace(/_/g, ' ')}
                    </span>
                    {notif.channel && (
                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-bold text-blue-400">
                        {notif.channel}
                      </span>
                    )}
                    {!notif.is_read && (
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] font-bold text-rose-400">
                        UNREAD
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
