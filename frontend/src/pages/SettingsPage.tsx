import React from 'react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
          Platform Settings &amp; Preferences
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Customize interface themes, security parameters, and notification alerts.
        </p>
      </div>

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
              <h4 className="text-xs font-bold text-[var(--text-main)]">Market Data API Keys</h4>
              <p className="text-[11px] text-[var(--text-muted)]">AlphaVantage / Yahoo Finance API Ingestion Token Status.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#2563EB]/15 text-[#2563EB] text-xs font-bold font-mono border border-[#2563EB]/30">CONNECTED</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
