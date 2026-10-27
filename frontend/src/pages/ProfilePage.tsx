import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { CheckCircle2, AlertCircle, User, ShieldAlert } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [riskTolerance, setRiskTolerance] = useState(user?.preference?.risk_tolerance_level || 3);
  const [maxReallocationPct, setMaxReallocationPct] = useState(user?.preference?.max_reallocation_pct || 15);
  const [primaryObjective, setPrimaryObjective] = useState(user?.preference?.investment_goal || 'growth');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      if (user.preference) {
        setRiskTolerance(user.preference.risk_tolerance_level || 3);
        setMaxReallocationPct(user.preference.max_reallocation_pct || 15);
        setPrimaryObjective(user.preference.investment_goal || 'growth');
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await userService.updateProfile({
        full_name: fullName,
        risk_tolerance_level: Number(riskTolerance),
        max_reallocation_pct: Number(maxReallocationPct),
        investment_goal: primaryObjective,
      });

      await refreshProfile();
      setMessage({ type: 'success', text: 'Governance parameters updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'An error occurred while saving.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#a855f7] uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Account &bull; Settings</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            User Profile &amp; APDE Risk Governance
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Set algorithm parameters for the Adaptive Portfolio Decision Engine (C_realloc cap and risk penalty &lambda;).
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-[16px] rounded-[8px] text-[13px] font-mono font-bold tracking-wider flex items-center gap-3 border shadow-[0_0_15px_rgba(0,0,0,0.1)] ${
            message.type === 'success'
              ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30'
              : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-[24px]">
        <div className="inst-card p-[32px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
            <User className="w-5 h-5 text-[var(--primary)]" />
            Account Identity
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[24px]">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-[14px] py-[12px] bg-[var(--surface2)]/50 border border-[var(--border-color)] rounded-[8px] text-[14px] font-mono font-bold text-[var(--text-muted)] cursor-not-allowed opacity-70"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[14px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="inst-card p-[32px] border-l-4 border-l-[#a855f7] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
          
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4 relative z-10">
            <ShieldAlert className="w-5 h-5 text-[#a855f7]" />
            APDE Quantitative Governance Controls
          </h3>
          
          <div className="space-y-[32px] relative z-10">
            <div className="space-y-[16px] bg-background p-[20px] rounded-[8px] border border-[var(--border-color)]">
              <div className="flex justify-between items-center text-[13px]">
                <label className="font-bold font-heading text-[15px] text-[var(--text-main)]">Max Reallocation Cap (C_realloc)</label>
                <span className="font-mono font-bold text-[var(--secondary)] bg-[var(--secondary)]/10 px-[12px] py-[6px] rounded-[6px] border border-[var(--secondary)]/30 text-[16px] shadow-[0_0_10px_rgba(76,139,255,0.2)]">
                  {maxReallocationPct}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={maxReallocationPct}
                onChange={(e) => setMaxReallocationPct(Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer outline-none border border-[var(--border-color)]"
                style={{
                  background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${(maxReallocationPct - 5) / (45) * 100}%, #111318 ${(maxReallocationPct - 5) / (45) * 100}%, #111318 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Conservative (5%)</span>
                <span>Aggressive (50%)</span>
              </div>
            </div>

            <div className="space-y-[16px] bg-background p-[20px] rounded-[8px] border border-[var(--border-color)]">
              <div className="flex justify-between items-center text-[13px]">
                <label className="font-bold font-heading text-[15px] text-[var(--text-main)]">Risk Penalty Coefficient (&lambda;)</label>
                <span className="font-mono font-bold text-[#eab308] bg-[#eab308]/10 px-[12px] py-[6px] rounded-[6px] border border-[#eab308]/30 text-[16px] shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  {riskTolerance} / 5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer outline-none border border-[var(--border-color)]"
                style={{
                  background: `linear-gradient(to right, #eab308 0%, #eab308 ${(riskTolerance - 1) / (4) * 100}%, #111318 ${(riskTolerance - 1) / (4) * 100}%, #111318 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Low Risk (&lambda; = 1)</span>
                <span>High Risk (&lambda; = 5)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-[32px] py-[16px] bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] font-bold font-mono text-[14px] uppercase tracking-wider rounded-[8px] shadow-[0_0_20px_rgba(255,90,31,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Profile & Governance Controls'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
