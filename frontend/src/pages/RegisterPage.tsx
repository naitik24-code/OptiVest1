import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

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
    <div className="w-full max-w-[480px] mx-auto mt-[60px] px-[22px]">
      <div className="text-center mb-[40px]">
        <h2 className="text-[32px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)] drop-shadow-sm">
          Create Investor Account
        </h2>
        <p className="text-[14px] font-mono text-[var(--text-muted)] m-0 mt-[12px]">
          Institutional wealth management onboarding in two steps.
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-[12px] mt-[24px]">
          <div className={`h-[4px] rounded-full transition-all duration-300 ${step === 1 ? 'w-[64px] bg-[var(--primary)] shadow-[0_0_10px_rgba(255,90,31,0.5)]' : 'w-[24px] bg-surface border border-[var(--border-color)]'}`}></div>
          <div className={`h-[4px] rounded-full transition-all duration-300 ${step === 2 ? 'w-[64px] bg-[var(--primary)] shadow-[0_0_10px_rgba(255,90,31,0.5)]' : 'w-[24px] bg-surface border border-[var(--border-color)]'}`}></div>
        </div>
      </div>

      <form 
        onSubmit={handleRegister} 
        className="inst-card p-[32px] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[radial-gradient(ellipse_at_top_right,rgba(255,90,31,0.05)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
        
        {error && (
          <div className="mb-[24px] p-[16px] rounded-[8px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-[12px] font-mono font-bold tracking-wider uppercase text-center shadow-[0_0_15px_rgba(255,74,99,0.1)] relative z-10">
            {error}
          </div>
        )}

        <div className="relative z-10">
          {step === 1 ? (
            <div className="space-y-[24px]">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-[8px] uppercase tracking-wider font-bold">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="Alexander Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-background border border-[var(--border-color)] rounded-[8px] p-[14px] text-[14px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-[8px] uppercase tracking-wider font-bold">Institutional Email</label>
                <input
                  type="email"
                  placeholder="investor@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-background border border-[var(--border-color)] rounded-[8px] p-[14px] text-[14px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-[8px] uppercase tracking-wider font-bold">Secure Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-background border border-[var(--border-color)] rounded-[8px] p-[14px] text-[14px] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors tracking-widest"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (email && password && fullName) { setError(null); setStep(2); }
                  else setError('Please complete all step 1 fields.');
                }}
                className="w-full cursor-pointer p-[16px] rounded-[8px] font-bold font-mono text-[13px] uppercase tracking-wider transition-all bg-[var(--primary)] text-[#050608] hover:bg-[#ff7a45] shadow-[0_0_15px_rgba(255,90,31,0.3)] mt-2"
              >
                Continue to Risk Governance &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-[32px]">
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[8px]">
                <ShieldAlert className="w-5 h-5 text-[#a855f7]" />
                <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] m-0">
                  APDE Quantitative Governance
                </h3>
              </div>

              <div className="space-y-[16px]">
                <div className="flex justify-between items-center text-[13px]">
                  <label className="font-bold font-heading text-[15px] text-[var(--text-main)]">Risk Penalty Coefficient (&lambda;)</label>
                  <span className="font-mono font-bold text-[#eab308] bg-[#eab308]/10 px-[12px] py-[6px] rounded-[6px] border border-[#eab308]/30 text-[14px]">
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

              <div className="space-y-[16px]">
                <div className="flex justify-between items-center text-[13px]">
                  <label className="font-bold font-heading text-[15px] text-[var(--text-main)]">Max Reallocation Cap (C_realloc)</label>
                  <span className="font-mono font-bold text-[var(--secondary)] bg-[var(--secondary)]/10 px-[12px] py-[6px] rounded-[6px] border border-[var(--secondary)]/30 text-[14px]">
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

              <div className="flex gap-[16px] pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 cursor-pointer p-[16px] rounded-[8px] font-bold font-mono text-[13px] uppercase tracking-wider transition-all bg-[var(--surface2)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 cursor-pointer p-[16px] rounded-[8px] font-bold font-mono text-[13px] uppercase tracking-wider transition-all bg-[var(--primary)] text-[#050608] hover:bg-[#ff7a45] disabled:opacity-50 shadow-[0_0_15px_rgba(255,90,31,0.3)] flex items-center justify-center"
                >
                  {isLoading ? 'Processing...' : 'Complete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      <div className="text-center mt-[32px] text-[13px] font-mono text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--primary)] font-bold hover:text-[#ff7a45] transition-colors ml-1 uppercase tracking-wider">
          Sign In
        </Link>
      </div>
    </div>
  );
};
