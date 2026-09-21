import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ShieldCheck, UserCheck, KeyRound, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'investor' | 'admin'>('investor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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

  const fillDemo = (tab: 'investor' | 'admin') => {
    handleTabChange(tab);
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
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
      className="w-full max-w-md space-y-6"
    >
      {/* Role Switcher Tabs */}
      <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-color)] shadow-inner">
        <button
          type="button"
          onClick={() => handleTabChange('investor')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'investor'
              ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Investor Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('admin')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'admin'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin Console</span>
        </button>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold font-heading text-[var(--text-main)] flex items-center justify-center gap-2">
          {activeTab === 'admin' ? (
            <>
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <span>Admin Console Sign In</span>
            </>
          ) : (
            <span>Investor Platform Sign In</span>
          )}
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {activeTab === 'admin'
            ? 'Authenticate with system privileges to access MLOps, APDE models, and infra controls.'
            : 'Access real-time portfolio analytics and continuous APDE risk governance.'}
        </p>
      </div>

      {/* Demo Credentials Quick Fill Banner */}
      <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono text-[11px]">
          <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Demo Account:</span>
        </div>
        <button
          type="button"
          onClick={() => fillDemo(activeTab)}
          className="px-2.5 py-1 rounded bg-[#2563EB]/10 border border-[#2563EB]/30 hover:bg-[#2563EB]/20 text-[#2563EB] font-mono text-[10px] font-bold transition-all flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>Auto-Fill {activeTab === 'admin' ? 'Admin' : 'Investor'} Credentials</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-[#F87171] text-xs font-mono">
          {error}
        </div>
      )}

      <motion.form 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.6, delay: 0.15 }}
        onSubmit={handleSubmit} 
        className="inst-card p-6 rounded-xl space-y-4 border border-[var(--border-color)]"
      >
        <Input
          label={activeTab === 'admin' ? "System Admin Email" : "Institutional Email"}
          type="email"
          placeholder={activeTab === 'admin' ? "admin@optivest.ai" : "investor@firm.com"}
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

        <Button
          type="submit"
          isLoading={isLoading}
          className={`w-full py-2.5 mt-2 ${
            activeTab === 'admin' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
          }`}
        >
          {activeTab === 'admin' ? 'Sign In as System Admin' : 'Sign In to Platform'}
        </Button>

        <div className="text-center pt-2 text-xs text-[var(--text-muted)]">
          New institutional investor?{' '}
          <Link to="/register" className="text-[#2563EB] font-bold hover:underline">
            Open Account
          </Link>
        </div>
      </motion.form>
    </motion.div>
  );
};
