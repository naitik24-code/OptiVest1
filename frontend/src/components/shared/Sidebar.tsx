import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  Bookmark,
  Brain,
  History,
  BarChart3,
  User,
  Settings,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mainNav = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Portfolio', path: '/portfolio', icon: PieChart },
    { label: 'Markets', path: '/markets', icon: TrendingUp },
    { label: 'Watchlist', path: '/watchlist', icon: Bookmark },
  ];

  const intelligenceNav = [
    { label: 'AI Insights', path: '/insights', icon: Brain },
    { label: 'Paper Trading', path: '/paper-trading', icon: History },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const systemNav = [
    { label: 'User Governance', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col p-4 shrink-0 hidden md:flex transition-colors duration-200">
      {/* Portfolio Operations */}
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-3 flex items-center justify-between">
        <span>Portfolio Operations</span>
        <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
      </div>
      <nav className="flex flex-col gap-1 mb-6">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Quantitative Intelligence */}
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-3 flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-[#0EA5E9]" />
        <span>Quantitative Intel</span>
      </div>
      <nav className="flex flex-col gap-1 mb-6">
        {intelligenceNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Governance & Preferences */}
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-3">
        System &amp; Preferences
      </div>
      <nav className="flex flex-col gap-1">
        {systemNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-blue-900/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer Badge */}
      <div className="mt-auto pt-4 border-t border-[var(--border-color)] px-3">
        <div className="p-3 rounded-lg inst-card text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--text-main)] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>APDE Governance</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] leading-tight">
            Institutional Risk Limits Active &bull; C_realloc = 15.0%
          </p>
        </div>
      </div>
    </aside>
  );
};
