import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="w-full max-w-[440px] mx-auto mt-[60px] px-[20px]">
      <div className="text-center mb-[40px]">
        <h2 className="text-[28px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
          Reset Account Password
        </h2>
        <p className="text-[14px] text-[var(--text-muted)] m-0 mt-[12px] font-mono">
          Enter your institutional email address to receive password recovery instructions.
        </p>
      </div>

      {submitted ? (
        <div className="inst-card p-[32px] text-center border-[var(--success)]/40 shadow-[0_0_20px_rgba(23,217,140,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-[var(--success)]" />
          <CheckCircle2 className="w-[48px] h-[48px] text-[var(--success)] mx-auto mb-[20px] drop-shadow-[0_0_8px_rgba(23,217,140,0.4)]" />
          <h3 className="text-[18px] font-bold font-heading text-[var(--text-main)] mb-[8px]">Recovery Link Dispatched</h3>
          <p className="text-[13px] text-[var(--text-muted)] mb-[24px] font-mono leading-relaxed">
            We have sent password reset instructions to<br/><strong className="text-[var(--text-main)]">{email}</strong>
          </p>
          <Link to="/login" className="inline-block cursor-pointer px-[24px] py-[14px] rounded-[8px] font-bold text-[14px] transition-all bg-[var(--primary)] text-[#08090b] hover:bg-[#ff713b]">
            Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="inst-card p-[32px]">
          <div className="mb-[24px]">
            <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-[8px] uppercase tracking-wider">Institutional Email</label>
            <input
              type="email"
              placeholder="investor@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-[var(--border-color)] rounded-[8px] p-[14px_16px] text-[14px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--text-muted)]/50"
            />
          </div>

          <button
            type="submit"
            className="w-full cursor-pointer p-[14px] rounded-[8px] font-bold text-[14px] transition-all bg-[var(--primary)] text-[#08090b] hover:bg-[#ff713b]"
          >
            Send Reset Instructions
          </button>

          <div className="text-center mt-[24px]">
            <Link to="/login" className="text-[12px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors inline-flex items-center gap-[6px]">
              <ArrowLeft className="w-[14px] h-[14px]" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
