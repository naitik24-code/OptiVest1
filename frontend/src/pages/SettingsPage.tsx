import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { Sun, Moon, Check, Settings, Globe, ShieldCheck } from 'lucide-react';


export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Account &bull; Configuration</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Platform Settings &amp; Preferences
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Customize global currencies, interface themes, security parameters, and engineering configurations.
          </p>
        </div>
      </div>

      {/* Global Preferred Currency Card */}
      <div className="inst-card p-[32px]">
        <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[var(--secondary)]" />
          Global Currency Engine
        </h3>
        <p className="text-[12px] font-mono text-[var(--text-muted)] mb-[24px] pb-[16px] border-b border-[var(--border-color)]">
          Preferred Financial Display Currency
        </p>

        <div className="space-y-[24px]">
          <p className="text-[13px] font-mono text-[var(--text-main)] leading-[1.6]">
            Select your preferred display currency for all portfolio valuations, holding metrics, profit/loss statements, charts, analytics, and watchlists. Values are automatically converted in real-time while preserving internal asset base currencies.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-[16px]">
            {Object.keys(SUPPORTED_CURRENCIES).map((code) => {
              const info = SUPPORTED_CURRENCIES[code];
              const isSelected = currency === code;
              return (
                <div
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`p-[16px] rounded-[8px] border cursor-pointer transition-all flex flex-col justify-between group ${
                    isSelected
                      ? 'border-[var(--secondary)] bg-[var(--secondary)]/10 shadow-[0_0_15px_rgba(76,139,255,0.15)] ring-1 ring-[var(--secondary)]'
                      : 'border-[var(--border-color)] bg-background hover:border-[var(--secondary)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-[12px]">
                    <span className={`text-[16px] font-bold font-heading transition-colors ${isSelected ? 'text-[var(--secondary)]' : 'text-[var(--text-main)] group-hover:text-[var(--secondary)]'}`}>{code}</span>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[var(--secondary)] drop-shadow-[0_0_5px_rgba(76,139,255,0.5)]" />
                    ) : (
                      <span className="text-[14px] font-mono font-bold text-[var(--text-muted)]">{info.symbol}</span>
                    )}
                  </div>
                  <div className="mt-auto">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] block truncate mb-1">{info.name}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-70">1 USD = {info.rate_vs_usd}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* Theme Preference Card */}
        <div className="inst-card p-[32px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-2 flex items-center gap-2">
            <Sun className="w-5 h-5 text-[var(--primary)]" />
            Interface Theme System
          </h3>
          <p className="text-[12px] font-mono text-[var(--text-muted)] mb-[24px] pb-[16px] border-b border-[var(--border-color)]">
            Appearance &amp; Accessibility
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
            <div
              onClick={() => setTheme('dark')}
              className={`p-[20px] rounded-[8px] border cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'border-[var(--primary)] bg-background shadow-[0_0_15px_rgba(255,90,31,0.15)] ring-1 ring-[var(--primary)]'
                  : 'border-[var(--border-color)] bg-background hover:border-[var(--primary)]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-[12px]">
                <div className="flex items-center gap-2 text-[14px] font-bold font-heading text-[var(--text-main)]">
                  <Moon className="w-4 h-4 text-[var(--secondary)]" />
                  <span>Dark Theme</span>
                </div>
                {theme === 'dark' && <Check className="w-4 h-4 text-[var(--primary)] drop-shadow-[0_0_5px_rgba(255,90,31,0.5)]" />}
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)] m-0">High contrast institutional dark aesthetic (#08090B).</p>
            </div>

            <div
              onClick={() => setTheme('light')}
              className={`p-[20px] rounded-[8px] border cursor-pointer transition-all ${
                theme === 'light'
                  ? 'border-[var(--primary)] bg-[var(--surface2)] shadow-[0_0_15px_rgba(255,90,31,0.15)] ring-1 ring-[var(--primary)]'
                  : 'border-[var(--border-color)] bg-background hover:border-[var(--primary)]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-[12px]">
                <div className="flex items-center gap-2 text-[14px] font-bold font-heading text-[var(--text-main)]">
                  <Sun className="w-4 h-4 text-[#eab308]" />
                  <span>Light Theme</span>
                </div>
                {theme === 'light' && <Check className="w-4 h-4 text-[var(--primary)] drop-shadow-[0_0_5px_rgba(255,90,31,0.5)]" />}
              </div>
              <p className="text-[11px] font-mono text-[var(--text-muted)] m-0">Clean financial workspace light mode (#F8FAFC).</p>
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="inst-card p-[32px] border-t-4 border-t-[var(--success)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[150px] h-[150px] bg-[radial-gradient(ellipse_at_top_left,rgba(23,217,140,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
          
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-2 flex items-center gap-2 relative z-10">
            <ShieldCheck className="w-5 h-5 text-[var(--success)]" />
            Security &amp; Auth
          </h3>
          <p className="text-[12px] font-mono text-[var(--text-muted)] mb-[24px] pb-[16px] border-b border-[var(--border-color)] relative z-10">
            Account Integrity
          </p>

          <div className="space-y-[16px] relative z-10">
            <div className="flex items-center justify-between p-[16px] rounded-[8px] bg-background border border-[var(--border-color)]">
              <div>
                <h4 className="text-[14px] font-bold font-heading text-[var(--text-main)] mb-1">Two-Factor Authentication (2FA)</h4>
                <p className="text-[11px] font-mono text-[var(--text-muted)] m-0">Secure your portfolio management session using TOTP authenticator.</p>
              </div>
              <span className="px-[10px] py-[4px] rounded-[4px] bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-bold font-mono uppercase tracking-widest border border-[var(--success)]/30 shadow-[0_0_10px_rgba(23,217,140,0.1)]">ENABLED</span>
            </div>

            <div className="flex items-center justify-between p-[16px] rounded-[8px] bg-background border border-[var(--border-color)]">
              <div>
                <h4 className="text-[14px] font-bold font-heading text-[var(--text-main)] mb-1">Market Data &amp; Forex API Keys</h4>
                <p className="text-[11px] font-mono text-[var(--text-muted)] m-0">ExchangeRate API / Yahoo Finance API Ingestion Token Status.</p>
              </div>
              <span className="px-[10px] py-[4px] rounded-[4px] bg-[var(--secondary)]/10 text-[var(--secondary)] text-[10px] font-bold font-mono uppercase tracking-widest border border-[var(--secondary)]/30 shadow-[0_0_10px_rgba(76,139,255,0.1)]">CONNECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
