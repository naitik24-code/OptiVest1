import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, Plus, RefreshCw, CheckCircle2, History, ArrowRight, ShieldCheck } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

export const PaperWalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [paperHistory, setPaperHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/paper-trading/wallet', { headers: getH() });
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
      const dashboardRes = await fetch('/api/v1/paper-trading/dashboard', { headers: getH() });
      if (dashboardRes.ok) {
        const dashboard = await dashboardRes.json();
        setPaperHistory(dashboard.orders || dashboard.recent_orders || dashboard.order_history || []);
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
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--success)] uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Virtual Execution &bull; Portfolios</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Paper Wallet Manager
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Virtual capital management &bull; Multi-wallet support &bull; Buying power allocation
          </p>
        </div>
        <button
          onClick={fetchWallet}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>Refresh Wallet</span>
        </button>
      </div>

      {/* Separate paper-sandbox audit history; intentionally isolated from real portfolio transactions. */}
      <section className="inst-card p-[24px] border-[var(--success)]/30">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--success)] font-mono text-[10px] font-bold uppercase tracking-widest"><History className="w-4 h-4" /> Paper Sandbox History</div>
            <h3 className="text-[18px] font-bold font-heading text-[var(--text-main)] mt-1">Virtual execution ledger</h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">Paper BUY/SELL activity is kept separate from portfolio holdings and never represents a brokerage trade.</p>
          </div>
          <span className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-mono font-bold uppercase"><ShieldCheck className="w-3 h-3" /> Simulation only</span>
        </div>
        {paperHistory.length ? <div className="space-y-2">{paperHistory.map((order: any, index: number) => <div key={order.id || index} className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface2)] p-3 text-[12px] font-mono"><span className={order.side === 'SELL' ? 'text-[var(--danger)] font-bold' : 'text-[var(--success)] font-bold'}>{order.side || order.order_side || 'ORDER'}</span><span className="text-[var(--text-main)] font-bold">{order.symbol || order.ticker}</span><ArrowRight className="w-3 h-3 text-[var(--text-muted)]" /><span className="text-[var(--text-muted)]">{order.quantity} @ ${Number(order.executed_price || order.price || 0).toFixed(2)}</span><span className="ml-auto text-[var(--text-muted)]">{order.executed_at ? new Date(order.executed_at).toLocaleString() : 'Recorded'}</span></div>)}</div> : <div className="rounded-lg border border-dashed border-[var(--border-color)] p-5 text-center text-[12px] text-[var(--text-muted)] font-mono">No paper orders yet. Orders placed in Paper Trading will appear here.</div>}
      </section>

      {/* Main Wallet Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="inst-card p-[32px] lg:col-span-2 bg-gradient-to-br from-[var(--success)]/10 via-[#050608] to-[#050608] border-l-4 border-l-[var(--success)] shadow-[0_0_20px_rgba(23,217,140,0.05)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(ellipse_at_top_right,rgba(23,217,140,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
          
          <div className="flex justify-between items-start mb-8 z-10 relative">
            <div>
              <span className="px-[8px] py-[4px] rounded-[4px] text-[10px] font-bold font-mono tracking-wider bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30 uppercase mb-3 inline-block">
                ACTIVE VIRTUAL WALLET
              </span>
              <h2 className="text-[24px] font-extrabold font-heading text-[var(--text-main)] mt-1">{wallet?.wallet_name || 'Primary AI Paper Wallet'}</h2>
              <div className="text-[12px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-1">Wallet ID: {wallet?.id || '---'}</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Currency</div>
              <div className="text-[16px] font-bold text-[var(--success)] bg-[var(--success)]/10 px-3 py-1 rounded-[6px] border border-[var(--success)]/30">{wallet?.currency || 'USD'} ($)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[24px] pt-[24px] border-t border-[var(--border-color)] z-10 relative">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider font-mono text-[var(--text-muted)] mb-2">Total Wallet Value</div>
              <div className="text-[28px] font-extrabold font-mono text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)] leading-none">
                ${wallet?.total_portfolio_value?.toLocaleString() || '100,000.00'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider font-mono text-[var(--text-muted)] mb-2">Cash Balance</div>
              <div className="text-[28px] font-extrabold font-mono text-[var(--text-main)] leading-none">
                ${wallet?.cash_balance?.toLocaleString() || '100,000.00'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider font-mono text-[var(--text-muted)] mb-2">Buying Power</div>
              <div className="text-[28px] font-extrabold font-mono text-[#eab308] drop-shadow-[0_0_5px_rgba(234,179,8,0.3)] leading-none">
                ${wallet?.buying_power?.toLocaleString() || '100,000.00'}
              </div>
            </div>
          </div>

          <div className="p-[16px] rounded-[8px] bg-background border border-[var(--border-color)] text-[13px] space-y-[12px] mt-8 z-10 relative">
            <div className="flex justify-between items-center text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px] font-bold">
              <span>Initial Starting Capital:</span>
              <span className="font-extrabold text-[var(--text-main)] text-[14px]">${wallet?.initial_balance?.toLocaleString() || '100,000.00'}</span>
            </div>
            <div className="flex justify-between items-center text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px] font-bold">
              <span>Invested Capital:</span>
              <span className="font-extrabold text-[var(--text-main)] text-[14px]">${wallet?.invested_capital?.toLocaleString() || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center text-[var(--text-muted)] font-mono uppercase tracking-wider text-[11px] font-bold pt-[12px] border-t border-[var(--border-color)]">
              <span>Realized Profit / Loss:</span>
              <span className={`font-extrabold text-[15px] ${(wallet?.total_realized_pl || 0) >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'}`}>
                ${wallet?.total_realized_pl?.toLocaleString() || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Wallet Specs */}
        <div className="inst-card p-[24px] flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-4 mb-4">
              <DollarSign className="w-5 h-5 text-[var(--success)]" />
              Wallet Configuration
            </h3>
            <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-mono">
              OptiVest Paper Wallets allow risk-free evaluation of APDE AI recommendations. Additional virtual wallets can be configured with custom capital reserves.
            </p>

            <div className="space-y-[12px] mt-6">
              <div className="p-[16px] rounded-[8px] bg-background border border-[var(--border-color)] text-[13px] flex items-center gap-4 transition-colors hover:border-[var(--success)]/40">
                <CheckCircle2 className="w-6 h-6 text-[var(--success)] shrink-0" />
                <div>
                  <div className="font-bold font-heading text-[14px] text-[var(--text-main)]">100,000 USD Default Reserve</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">Auto-funded paper balance</div>
                </div>
              </div>
              <div className="p-[16px] rounded-[8px] bg-background border border-[var(--border-color)] text-[13px] flex items-center gap-4 transition-colors hover:border-[var(--success)]/40">
                <CheckCircle2 className="w-6 h-6 text-[var(--success)] shrink-0" />
                <div>
                  <div className="font-bold font-heading text-[14px] text-[var(--text-main)]">Zero Real Brokerage</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">Isolated simulation environment</div>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-[14px] mt-[24px] rounded-[8px] bg-[var(--success)] hover:bg-[#34d399] text-[#050608] font-bold font-mono text-[13px] tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(23,217,140,0.3)]">
            <Plus className="w-4 h-4" /> Create Additional Paper Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaperWalletPage;
