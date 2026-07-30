import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold font-heading text-[var(--text-main)]">
          Investor Platform Sign In
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Access real-time portfolio analytics and continuous APDE risk governance.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#F87171] text-xs font-mono">
          {error}
        </div>
      )}

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

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          icon={<Lock className="w-4 h-4" />}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded accent-[#2563EB]"
            />
            <span>Remember device</span>
          </label>
          <Link to="/forgot-password" className="text-[#2563EB] font-bold hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full py-2.5 mt-2">
          Sign In to Platform
        </Button>

        <div className="text-center pt-2 text-xs text-[var(--text-muted)]">
          New institutional investor?{' '}
          <Link to="/register" className="text-[#2563EB] font-bold hover:underline">
            Open Account
          </Link>
        </div>
      </form>
    </div>
  );
};
