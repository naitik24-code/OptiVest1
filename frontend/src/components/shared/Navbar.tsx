import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Sun, Moon, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../context/CurrencyContext';


export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  return (
    <header className="h-16 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-md shadow-primary/30">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
              OptiVest <span className="text-primary">Intelligence</span>
            </span>
          </div>
        </Link>

        {/* Institutional Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--text-muted)]">
          <Link to="/markets" className="hover:text-[var(--text-main)] transition-colors">Markets</Link>
          <Link to="/insights" className="hover:text-[var(--text-main)] transition-colors">Intelligence</Link>
          <Link to="/analytics" className="hover:text-[var(--text-main)] transition-colors">Analytics</Link>
          <Link to="/paper-trading" className="hover:text-[var(--text-main)] transition-colors">Paper Sandbox</Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Currency Selector */}
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs font-mono text-[var(--text-main)]">
          <span className="text-[var(--text-muted)] text-[10px] uppercase font-bold">FX:</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent border-none outline-none font-bold cursor-pointer text-primary"
          >
            {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
              <option key={code} value={code} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                {code} ({SUPPORTED_CURRENCIES[code].symbol})
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-muted)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>INSTITUTIONAL GRADE</span>
        </div>

        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-500 font-mono text-[10px] font-bold transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>ADMIN CONSOLE</span>
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-all border border-transparent hover:border-[var(--border-color)]"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
        </button>

        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-[var(--border-color)]">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-primary text-xs font-semibold text-[var(--text-main)] transition-all"
            >
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-white font-bold text-[10px]">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-mono">{user.email.split('@')[0]}</span>
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[#DC2626] hover:bg-[var(--bg-card)] transition-all border border-transparent hover:border-[var(--border-color)]"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-md transition-all border border-primary/30 flex items-center gap-1.5"
            >
              <span>Open Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
