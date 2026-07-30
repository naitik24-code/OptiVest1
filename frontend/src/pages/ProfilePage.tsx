import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
          User Profile &amp; APDE Risk Governance
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Set algorithm parameters for the Adaptive Portfolio Decision Engine (C_realloc cap and risk penalty &lambda;).
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-mono flex items-center gap-3 border ${
            message.type === 'success'
              ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30'
              : 'bg-[#DC2626]/10 text-[#F87171] border-[#DC2626]/30'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Account Identity" subtitle="User Metadata">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-mono text-[var(--text-muted)]">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-[var(--text-muted)]">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
        </Card>

        <Card title="APDE Quantitative Governance Controls" subtitle="Constrained Rebalancer Settings">
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-[var(--text-main)]">Max Reallocation Cap (C_realloc)</label>
                <span className="font-mono font-bold text-[#2563EB] bg-[#2563EB]/15 px-2 py-0.5 rounded border border-[#2563EB]/30">
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
                className="w-full accent-[#2563EB]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-[var(--text-main)]">Risk Penalty Coefficient (&lambda;)</label>
                <span className="font-mono font-bold text-[#0EA5E9] bg-[#0EA5E9]/15 px-2 py-0.5 rounded border border-[#0EA5E9]/30">
                  {riskTolerance} / 5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                className="w-full accent-[#0EA5E9]"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting} className="px-8 py-3">
            Save Profile &amp; Governance Controls
          </Button>
        </div>
      </form>
    </div>
  );
};
