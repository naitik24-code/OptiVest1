import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold font-heading text-[var(--text-main)]">Reset Account Password</h2>
        <p className="text-xs text-[var(--text-muted)]">
          Enter your institutional email address to receive password recovery instructions.
        </p>
      </div>

      {submitted ? (
        <div className="inst-card p-6 rounded-xl text-center space-y-4 border border-[#16A34A]/40 bg-[#16A34A]/5">
          <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Recovery Link Dispatched</h3>
          <p className="text-xs text-[var(--text-muted)]">
            We have sent password reset instructions to <strong className="text-[var(--text-main)] font-mono">{email}</strong>.
          </p>
          <Link to="/login" className="inline-block pt-2 text-xs font-bold text-[#2563EB] hover:underline">
            Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="inst-card p-6 rounded-xl space-y-4 border border-[var(--border-color)]">
          <Input
            label="Institutional Email"
            type="email"
            placeholder="investor@firm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="w-4 h-4" />}
          />
          <Button type="submit" className="w-full py-2.5">
            Send Reset Instructions
          </Button>
          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
