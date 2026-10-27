import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'investor' | 'admin'>('investor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (tab: 'investor' | 'admin') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'admin') {
      setEmail('admin@optivest.ai');
      setPassword('Admin123!');
    } else {
      setEmail('investor_fat@optivest.ai');
      setPassword('Investor123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      if (activeTab === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto px-[20px]">
      <div className="text-center mb-[28px]">
        <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
          {activeTab === 'admin' ? 'System Authentication' : 'Platform Sign In'}
        </h2>
        <p className="text-[14px] text-[var(--text-muted)] m-0 mt-[12px] font-mono">
          {activeTab === 'admin'
            ? 'Access the MLOps and Founder Command Console'
            : 'Access real-time portfolio analytics and risk governance'}
        </p>
      </div>

      <div className="flex bg-[var(--surface2)] rounded-[10px] p-[6px] mb-[24px] border border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => handleTabChange('investor')}
          className={`flex-1 py-[12px] text-[13px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-[8px] cursor-pointer ${
            activeTab === 'investor'
              ? 'bg-[var(--primary)] text-[#08090b] shadow-[0_0_15px_rgba(255,90,31,0.2)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <UserCheck className="w-[16px] h-[16px]" />
          Investor
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('admin')}
          className={`flex-1 py-[12px] text-[13px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-[8px] cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-[var(--secondary)] text-[#08090b] shadow-[0_0_15px_rgba(76,139,255,0.2)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <ShieldCheck className="w-[16px] h-[16px]" />
          Admin
        </button>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className={`inst-card p-[32px] transition-colors ${activeTab === 'admin' ? 'hover:border-[var(--secondary)]/50' : ''}`}
      >
        {error && (
          <div className="mb-[24px] p-[16px] rounded-[8px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-[13px] font-mono">
            {error}
          </div>
        )}

        <div className="mb-[24px]">
          <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-[8px] uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full bg-background border border-[var(--border-color)] rounded-[8px] p-[14px_16px] text-[14px] font-mono text-[var(--text-main)] focus:outline-none transition-colors placeholder:text-[var(--text-muted)]/50 ${
              activeTab === 'admin' ? 'focus:border-[var(--secondary)]' : 'focus:border-[var(--primary)]'
            }`}
          />
        </div>

        <div className="mb-[32px]">
          <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-[8px] uppercase tracking-wider">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`w-full bg-background border border-[var(--border-color)] rounded-[8px] p-[14px_16px] text-[14px] font-mono text-[var(--text-main)] focus:outline-none transition-colors placeholder:text-[var(--text-muted)]/50 ${
              activeTab === 'admin' ? 'focus:border-[var(--secondary)]' : 'focus:border-[var(--primary)]'
            }`}
          />
          <div className="text-right mt-[12px]">
            <Link to="/forgot-password" className={`text-[12px] font-mono text-[var(--text-muted)] transition-colors ${
              activeTab === 'admin' ? 'hover:text-[var(--secondary)]' : 'hover:text-[var(--primary)]'
            }`}>
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full cursor-pointer p-[14px] rounded-[8px] font-bold text-[14px] transition-all disabled:opacity-50 text-[#08090b] ${
            activeTab === 'admin'
              ? 'bg-[var(--secondary)] hover:bg-[#3b78ff] shadow-[0_0_15px_rgba(76,139,255,0.2)]'
              : 'bg-[var(--primary)] hover:bg-[#ff713b] shadow-[0_0_15px_rgba(255,90,31,0.2)]'
          }`}
        >
          {isLoading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center mt-[32px] text-[13px] font-mono text-[var(--text-muted)]">
        New institutional investor?{' '}
        <Link to="/register" className={`font-bold hover:underline ${
          activeTab === 'admin' ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'
        }`}>
          Open Account
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
