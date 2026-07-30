import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TrendingUp, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const AuthLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-200">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-4 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-all border border-[var(--border-color)] flex items-center gap-2 text-xs font-mono"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white text-xl shadow-lg shadow-blue-900/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-extrabold text-2xl text-[var(--text-main)] tracking-tight">
              OptiVest <span className="text-[#0EA5E9]">Intelligence</span>
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-mono tracking-wider uppercase">
              INSTITUTIONAL PORTFOLIO MANAGEMENT
            </span>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Outlet />
      </div>

      <div className="mt-8 text-center text-xs text-[var(--text-muted)] flex items-center gap-2 relative z-10 font-mono">
        <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
        <span>OptiVest AI Platform &bull; Enterprise 256-bit Encryption</span>
      </div>
    </div>
  );
};
