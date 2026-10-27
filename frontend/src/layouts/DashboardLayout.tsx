import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { Sidebar } from '../components/shared/Sidebar';
import { TickerTape } from '../components/shared/TickerTape';
import { Activity, ArrowUpRight, Bell, Command, Search } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'dashboard';
  return (
    <div className="h-screen w-screen market-glow text-[var(--text-main)] flex flex-col transition-colors duration-200 overflow-hidden">
      <Navbar />
      <TickerTape />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem-36px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 h-full">
          <div className="max-w-7xl mx-auto">
            <div className="terminal-toolbar mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="command-icon"><Command className="h-4 w-4" /></div>
                <div className="min-w-0"><div className="text-[10px] uppercase tracking-[.18em] text-[var(--text-muted)] font-mono">Workspace / live terminal</div><div className="truncate text-sm font-semibold capitalize text-[var(--text-main)]">{pageName}</div></div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <Link to="/markets" className="toolbar-action"><Search className="h-3.5 w-3.5" /> Search markets</Link>
                <Link to="/decision-center" className="toolbar-action hidden sm:flex"><ArrowUpRight className="h-3.5 w-3.5" /> Review signals</Link>
                <Link to="/settings" className="toolbar-action hidden md:flex"><Bell className="h-3.5 w-3.5" /></Link>
                <span className="session-pill"><Activity className="h-3 w-3" /> SESSION LIVE</span>
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
