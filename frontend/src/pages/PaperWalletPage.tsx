import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Wallet, DollarSign, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

export const PaperWalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/paper-trading/wallet', { headers: getH() });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-400" />
            Paper Wallet Manager
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Virtual capital management • Multi-wallet support • Buying power allocation
          </p>
        </div>
        <button
          onClick={fetchWallet}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Wallet
        </button>
      </div>

      {/* Main Wallet Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 bg-gradient-to-br from-emerald-950/20 via-[var(--bg-card)] to-[var(--bg-card)] border-emerald-900/40 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                ACTIVE VIRTUAL WALLET
              </span>
              <h2 className="text-xl font-bold text-[var(--text-main)] mt-2">{wallet?.wallet_name || 'Primary AI Paper Wallet'}</h2>
              <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Wallet ID: {wallet?.id || '---'}</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs text-[var(--text-muted)]">Currency</div>
              <div className="text-sm font-bold text-emerald-400">{wallet?.currency || 'USD'} ($)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
            <div>
              <div className="text-xs text-[var(--text-muted)]">Total Wallet Value</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                ${wallet?.total_portfolio_value?.toLocaleString() || '100,000.00'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)]">Cash Balance</div>
              <div className="text-2xl font-mono font-bold text-[var(--text-main)] mt-1">
                ${wallet?.cash_balance?.toLocaleString() || '100,000.00'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)]">Buying Power</div>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                ${wallet?.buying_power?.toLocaleString() || '100,000.00'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Initial Starting Capital:</span>
              <span className="font-mono font-bold">${wallet?.initial_balance?.toLocaleString() || '100,000.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Invested Capital:</span>
              <span className="font-mono font-bold">${wallet?.invested_capital?.toLocaleString() || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Realized Profit / Loss:</span>
              <span className={`font-mono font-bold ${(wallet?.total_realized_pl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${wallet?.total_realized_pl?.toLocaleString() || '0.00'}
              </span>
            </div>
          </div>
        </Card>

        {/* Multi-Wallet Specs */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Wallet Configuration
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            OptiVest Paper Wallets allow risk-free evaluation of APDE AI recommendations. Additional virtual wallets can be configured with custom capital reserves.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-[var(--text-main)]">100,000 USD Default Reserve</div>
                <div className="text-[10px] text-[var(--text-muted)]">Auto-funded paper balance</div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-[var(--text-main)]">Zero Real Brokerage</div>
                <div className="text-[10px] text-[var(--text-muted)]">Isolated simulation environment</div>
              </div>
            </div>
          </div>

          <button className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Create Additional Paper Wallet
          </button>
        </Card>
      </div>
    </div>
  );
};
