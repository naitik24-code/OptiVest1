import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [riskTolerance, setRiskTolerance] = useState(3);
  const [maxReallocationPct, setMaxReallocationPct] = useState(15);
  const [error, setError] = useState<string | null>(null);

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your credentials.');
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Onboarding Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold font-heading text-[var(--text-main)]">
          Create Investor Account
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Institutional wealth management onboarding in two simple steps.
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-12 bg-[#2563EB]' : 'w-4 bg-[var(--border-color)]'}`}></div>
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-12 bg-[#2563EB]' : 'w-4 bg-[var(--border-color)]'}`}></div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#F87171] text-xs font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="inst-card p-6 rounded-xl space-y-4 border border-[var(--border-color)]">
        {step === 1 ? (
          <>
            <Input
              label="Full Legal Name"
              type="text"
              placeholder="Alexander Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              icon={<UserIcon className="w-4 h-4" />}
            />
            <Input
              label="Institutional Email"
              type="email"
              placeholder="investor@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Secure Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="button"
              onClick={() => {
                if (email && password && fullName) setError(null), setStep(2);
                else setError('Please complete all step 1 fields.');
              }}
              className="w-full py-2.5 mt-2"
            >
              <span>Continue to Risk Governance</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-[var(--text-main)]">Risk Tolerance Level (&lambda;)</label>
                <span className="font-mono font-bold text-[#2563EB] bg-[#2563EB]/15 px-2 py-0.5 rounded border border-[#2563EB]/30">
                  {riskTolerance} / 5
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                className="w-full accent-[#2563EB]"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-[var(--text-main)]">Max Reallocation Cap (C_realloc)</label>
                <span className="font-mono font-bold text-[#0EA5E9] bg-[#0EA5E9]/15 px-2 py-0.5 rounded border border-[#0EA5E9]/30">
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
                className="w-full accent-[#0EA5E9]"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-1/3">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>Back</span>
              </Button>
              <Button type="submit" isLoading={isLoading} className="w-2/3">
                <span>Complete Registration</span>
              </Button>
            </div>
          </>
        )}

        <div className="text-center pt-2 text-xs text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2563EB] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};
