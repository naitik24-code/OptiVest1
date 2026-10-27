import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Brain,
  BarChart3,
  Settings,
  ShieldCheck,
  Zap,
  Sliders,
  Cpu,
  Activity,
  Wallet,
  FileText,
  Clock,
  Server,
  Users,
  Layers,
  ArrowRightLeft,
  Bell,
  Database,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  section?: string; // section separator label
}

export const Sidebar: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Investor / Regular User Navigation Items
  const investorNav: NavItem[] = [
    { label: 'Dashboard',       path: '/dashboard',      icon: LayoutDashboard },
    { label: 'Portfolio',       path: '/portfolio',      icon: PieChart },
    { label: 'Recommendations', path: '/insights',       icon: Brain },
    { label: 'Markets',         path: '/markets',        icon: TrendingUp },
    { label: 'Paper Sandbox',   path: '/paper-trading',  icon: Wallet },
    { label: 'Analytics',       path: '/analytics',      icon: BarChart3 },
    { label: 'Settings',        path: '/settings',       icon: Settings },
  ];

  // Founder / Administrator Navigation Items — with section separators
  const adminNav: NavItem[] = [
    // ── Overview ──
    { label: 'Command Overview', path: '/admin/dashboard',        icon: LayoutDashboard, section: 'Overview' },
    { label: 'Users Control',    path: '/admin/users',            icon: Users },
    { label: 'Global Portfolios',path: '/admin/portfolios',       icon: Layers },
    // ── AI Engine ──
    { label: 'MLOps Hub',        path: '/admin/mlops',            icon: Activity,        section: 'AI Engine' },
    { label: 'AI Config',        path: '/admin/ai-config',        icon: Sliders },
    { label: 'Training Queue',   path: '/admin/training-queue',   icon: Cpu },
    { label: 'Model Health',     path: '/admin/model-health',     icon: ShieldCheck },
    { label: 'Model Compare',    path: '/admin/model-comparison', icon: ArrowRightLeft },
    // ── Analytics ──
    { label: 'Research Analytics',path: '/admin/research',        icon: FileText,        section: 'Analytics' },
    { label: 'Benchmark',        path: '/admin/benchmark',        icon: BarChart3 },
    { label: 'Strategy Compare', path: '/admin/strategy-comparison', icon: TrendingUp },
    // ── Infrastructure ──
    { label: 'Autonomous Center',path: '/admin/autonomous',       icon: Zap,             section: 'Infrastructure' },
    { label: 'Scheduler',        path: '/admin/scheduler',        icon: Clock },
    { label: 'System Health',    path: '/admin/system-health',    icon: Server },
    { label: 'Worker Nodes',     path: '/admin/workers',          icon: Database },
    { label: 'Notifications',    path: '/admin/notifications',    icon: Bell },
  ];

  const currentNav = (isAdminPath && isAdmin) ? adminNav : investorNav;

  return (
    <aside className="w-64 border-r border-[var(--border-color)] bg-surface flex flex-col p-4 shrink-0 hidden md:flex transition-colors duration-200 overflow-y-auto h-full max-h-full">
      {/* Brand Logo */}
      <div className="px-3 pt-1 pb-4 mb-2 border-b border-[var(--border-color)]">
        <NavLink to="/" className="flex items-center gap-2.5 group focus-ring" aria-label="OptiVest home">
          <img src="/optivest_emblem.png" alt="" aria-hidden="true" className="h-8 w-8 object-contain drop-shadow-[0_0_12px_rgba(76,139,255,0.35)] group-hover:scale-105 transition-transform duration-200" />
          <span className="text-xl font-bold tracking-[-0.06em] bg-gradient-to-r from-[#1677ff] via-[#2b9bff] to-[#ff5a1f] bg-clip-text text-transparent">OptiVest</span>
        </NavLink>
      </div>

      {/* Mode Header */}
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-3 flex items-center justify-between">
        <span>{(isAdminPath && isAdmin) ? 'Founder Admin Console' : 'Investor Workspace'}</span>
        <span className={`w-2 h-2 rounded-full ${(isAdminPath && isAdmin) ? 'bg-amber-500 animate-pulse' : 'bg-[#16A34A] animate-pulse'}`}></span>
      </div>

      <nav className="flex flex-col gap-1 mb-6" aria-label="Primary navigation">
        {currentNav.map((item) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.path}>
              {/* Section separator label */}
              {item.section && (
                <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] px-3 pt-3 pb-1 opacity-50">
                  {item.section}
                </div>
              )}
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? (isAdminPath && isAdmin)
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                        : 'bg-[#2563EB] text-white shadow-md shadow-blue-900/20'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </NavLink>
            </React.Fragment>
          );
        })}
      </nav>


      {/* Admin Switch Banner for Founders */}
      {isAdmin && (
        <div className="mt-auto pt-4 border-t border-[var(--border-color)] px-2">
          {isAdminPath ? (
            <NavLink
              to="/dashboard"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#2563EB] text-[11px] font-bold text-[#2563EB] flex items-center justify-center gap-2 transition-all"
            >
              <span>← Switch to Investor View</span>
            </NavLink>
          ) : (
            <NavLink
              to="/admin/dashboard"
              className="w-full px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-[11px] font-bold text-amber-500 flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Founder Console →</span>
            </NavLink>
          )}
        </div>
      )}

      {/* Footer Governance Badge */}
      <div className="mt-4 px-2">
        <div className="p-3 rounded-lg inst-card text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--text-main)] font-bold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>APDE Institutional Shield</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] leading-tight font-mono">
            RBAC Active &bull; Role: {user?.role || 'USER'}
          </p>
        </div>
      </div>
    </aside>
  );
};
