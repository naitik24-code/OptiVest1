import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
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

      <div className="mb-8 text-center relative z-10 flex flex-col items-center">
        <Link to="/" className="inline-flex flex-col items-center gap-2 group">
          <img 
            src="/optivest_logo_transparent.png" 
            alt="OptiVest Logo" 
            className="h-16 w-auto object-contain filter drop-shadow-[0_0_25px_rgba(255,90,31,0.35)] group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-[11px] text-[var(--text-muted)] font-mono tracking-wider uppercase mt-1">
            INSTITUTIONAL PORTFOLIO MANAGEMENT
          </span>
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
