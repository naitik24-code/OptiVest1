import React from 'react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { Sun, Moon, Check } from 'lucide-react';


export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
          Platform Settings &amp; Preferences
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Customize global currencies, interface themes, security parameters, and engineering configurations.
        </p>
      </div>

      {/* Global Preferred Currency Card */}
      <Card title="Global Currency Engine" subtitle="Preferred Financial Display Currency">
        <div className="pt-2 space-y-4">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Select your preferred display currency for all portfolio valuations, holding metrics, profit/loss statements, charts, analytics, and watchlists. Values are automatically converted in real-time while preserving internal asset base currencies.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.keys(SUPPORTED_CURRENCIES).map((code) => {
              const info = SUPPORTED_CURRENCIES[code];
              const isSelected = currency === code;
              return (
                <div
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#2563EB]/10 shadow-md ring-1 ring-[#2563EB]'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[#2563EB]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[var(--text-main)]">{code}</span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">{info.symbol}</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block truncate">{info.name}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-75">1 USD = {info.rate_vs_usd} {code}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Theme Preference Card */}
      <Card title="Interface Theme System" subtitle="Appearance &amp; Accessibility">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              theme === 'dark'
                ? 'border-[#2563EB] bg-[#1A2332] shadow-md'
                : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[#2563EB]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                <Moon className="w-4 h-4 text-blue-400" />
                <span>Dark Theme</span>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-[#2563EB]" />}
            </div>
            <p className="text-[11px] text-[#94A3B8]">High contrast institutional dark aesthetic (#0A0E17).</p>
          </div>

          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              theme === 'light'
                ? 'border-[#2563EB] bg-white shadow-md'
                : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[#2563EB]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Theme</span>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-[#2563EB]" />}
            </div>
            <p className="text-[11px] text-slate-500">Clean financial workspace light mode (#F8FAFC).</p>
          </div>
        </div>
      </Card>

      {/* Security & Authentication */}
      <Card title="Security &amp; API Key Management" subtitle="Account Integrity">
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-main)]">Two-Factor Authentication (2FA)</h4>
              <p className="text-[11px] text-[var(--text-muted)]">Secure your portfolio management session using TOTP authenticator.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#16A34A]/15 text-[#16A34A] text-xs font-bold font-mono border border-[#16A34A]/30">ENABLED</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-main)]">Market Data &amp; Forex API Keys</h4>
              <p className="text-[11px] text-[var(--text-muted)]">ExchangeRate API / Yahoo Finance API Ingestion Token Status.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#2563EB]/15 text-[#2563EB] text-xs font-bold font-mono border border-[#2563EB]/30">CONNECTED</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
