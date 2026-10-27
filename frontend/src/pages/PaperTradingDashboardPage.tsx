import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, TrendingUp, ShoppingBag, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';

const getH = (): HeadersInit => { const t = localStorage.getItem('access_token'); return t ? { Authorization: `Bearer ${t}` } : {}; };

export const PaperTradingDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('NVDA');
  const [side, setSide] = useState('BUY');
  const [qty, setQty] = useState('10');
  const [price, setPrice] = useState('');
  const [orderMsg, setOrderMsg] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/paper-trading/dashboard', { headers: getH() });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.wallet_id) return;
    setOrderMsg('Submitting virtual order...');
    try {
      const res = await fetch(
        `/api/v1/paper-trading/orders?wallet_id=${data.wallet_id}&symbol=${symbol}&side=${side}&quantity=${qty}&price=${price}`,
        { method: 'POST', headers: getH() }
      );
      const resData = await res.json();
      if (res.ok) {
        setOrderMsg(`✓ Order Filled! ${side} ${qty} shares of ${symbol} at $${price}`);
        fetchDashboard();
      } else {
        setOrderMsg(`❌ ${resData.detail || 'Order Execution Failed'}`);
      }
    } catch (err) {
      setOrderMsg('❌ Order execution error');
    }
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--success)] uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Virtual Execution &bull; Trading Floor</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Enterprise Paper Trading Dashboard
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Virtual portfolio execution &bull; Zero real money &bull; APDE recommendation integration
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="inst-card p-[24px] bg-gradient-to-br from-[var(--success)]/10 to-transparent border-l-4 border-l-[var(--success)] shadow-[0_0_15px_rgba(23,217,140,0.05)] relative overflow-hidden group">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Total Portfolio Value</div>
          <div className="text-[32px] font-extrabold font-mono text-[var(--success)] leading-none mb-[8px] drop-shadow-[0_0_5px_rgba(23,217,140,0.4)]">
            ${data?.portfolio_value?.toLocaleString() || '100,000.00'}
          </div>
          <div className="text-[11px] font-mono font-bold text-[var(--success)] flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +1.2% Today
          </div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group hover:border-[var(--primary)]/40 transition-colors">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Virtual Cash Balance</div>
          <div className="text-[32px] font-extrabold font-mono text-[var(--text-main)] leading-none mb-[8px] drop-shadow-sm">
            ${data?.cash_balance?.toLocaleString() || '100,000.00'}
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Buying Power: ${data?.buying_power?.toLocaleString()}</div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group hover:border-[#eab308]/40 transition-colors">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Invested Capital</div>
          <div className="text-[32px] font-extrabold font-mono text-[#eab308] leading-none mb-[8px] drop-shadow-[0_0_5px_rgba(234,179,8,0.2)]">
            ${data?.invested_capital?.toLocaleString() || '0.00'}
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Positions: {data?.open_positions?.length || 0}</div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group hover:border-[var(--secondary)]/40 transition-colors">
          <div className="text-[10px] uppercase font-bold tracking-wider font-mono text-[var(--text-muted)] mb-1">Total Realized P/L</div>
          <div className={`text-[32px] font-extrabold font-mono leading-none mb-[8px] ${(data?.total_realized_pl || 0) >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.2)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.2)]'}`}>
            ${data?.total_realized_pl?.toLocaleString() || '0.00'}
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Unrealized: ${data?.total_unrealized_pl?.toLocaleString()}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Positions & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
              <ShoppingBag className="w-5 h-5 text-[var(--success)]" />
              Open Virtual Positions
            </h3>
            {data?.open_positions?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="pb-3 px-2">Symbol</th>
                      <th className="pb-3 px-2">Quantity</th>
                      <th className="pb-3 px-2">Avg Entry</th>
                      <th className="pb-3 px-2">Current Price</th>
                      <th className="pb-3 px-2">Market Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] font-mono text-[13px]">
                    {data.open_positions.map((p: any) => (
                      <tr key={p.symbol} className="hover:bg-background transition-colors">
                        <td className="py-4 px-2 font-bold text-[var(--success)] font-heading text-[15px]">{p.symbol}</td>
                        <td className="py-4 px-2">{p.quantity}</td>
                        <td className="py-4 px-2">${p.average_price}</td>
                        <td className="py-4 px-2">${p.current_price}</td>
                        <td className="py-4 px-2 font-bold text-[var(--text-main)]">${p.market_value?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-[13px] font-mono text-[var(--text-muted)] py-8 text-center bg-background rounded-[8px] border border-[var(--border-color)]">
                No active virtual positions. Place an order or accept an APDE recommendation to begin!
              </div>
            )}
          </div>

          {/* Recent Orders Log */}
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
              <TrendingUp className="w-5 h-5 text-[var(--secondary)]" />
              Paper Sandbox History
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] font-mono -mt-3 mb-4">A separate, audit-friendly ledger for virtual execution. These orders never affect the real portfolio or a brokerage account.</p>
            {data?.recent_orders?.length ? (
              <div className="space-y-[12px] font-mono text-[13px]">
                {data.recent_orders.map((o: any) => (
                  <div key={o.id} className="p-[14px] rounded-[6px] bg-background flex items-center justify-between border border-[var(--border-color)] hover:border-[var(--secondary)]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`px-[8px] py-[4px] rounded-[4px] text-[10px] font-bold tracking-wider ${o.side === 'BUY' ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30' : 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30'}`}>
                        {o.side}
                      </span>
                      <span className="font-extrabold text-[var(--text-main)] text-[14px]">{o.symbol}</span>
                      <span className="text-[var(--text-muted)] font-bold">x{o.quantity}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[14px] text-[var(--text-main)]">${o.total_cost?.toLocaleString()}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">@ ${o.executed_price}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] font-mono text-[var(--text-muted)] py-6 text-center bg-background rounded-[8px] border border-[var(--border-color)]">No recent virtual orders recorded.</div>
            )}
          </div>
        </div>

        {/* Trade Execution Sidebar */}
        <div className="space-y-6">
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
              <DollarSign className="w-5 h-5 text-[var(--primary)]" />
              Manual Virtual Order Entry
            </h3>
            <form onSubmit={handlePlaceOrder} className="space-y-[16px] text-[13px]">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Asset Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full p-[12px] rounded-[8px] bg-background border border-[var(--border-color)] font-mono text-[var(--text-main)] uppercase font-bold focus:outline-none focus:border-[var(--primary)] transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Order Side</label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    className="w-full p-[12px] rounded-[8px] bg-background border border-[var(--border-color)] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer appearance-none"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Quantity</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full p-[12px] rounded-[8px] bg-background border border-[var(--border-color)] font-mono text-[var(--text-main)] font-bold focus:outline-none focus:border-[var(--primary)] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Execution Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-[12px] rounded-[8px] bg-background border border-[var(--border-color)] font-mono text-[var(--text-main)] font-bold focus:outline-none focus:border-[var(--primary)] transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-[14px] rounded-[8px] font-bold font-mono text-[13px] transition-all cursor-pointer mt-4 flex items-center justify-center gap-2 ${
                  side === 'BUY'
                    ? 'bg-[var(--success)] hover:bg-[#34d399] text-[#050608] shadow-[0_0_15px_rgba(23,217,140,0.3)]'
                    : 'bg-[var(--danger)] hover:bg-[#fb7185] text-[#050608] shadow-[0_0_15px_rgba(255,74,99,0.3)]'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Submit Virtual {side} Order
              </button>

              {orderMsg && (
                <div className={`p-[12px] rounded-[6px] text-[11px] font-mono font-bold tracking-wider text-center border ${orderMsg.includes('✓') ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30' : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'}`}>
                  {orderMsg}
                </div>
              )}
            </form>
          </div>

          {/* Recent APDE Decisions Executed */}
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-5 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
              <Zap className="w-5 h-5 text-[#eab308]" />
              APDE AI Executions
            </h3>
            {data?.recent_decisions?.length ? (
              <div className="space-y-[12px]">
                {data.recent_decisions.map((d: any) => (
                  <div key={d.id} className="p-[14px] rounded-[6px] bg-background border border-[var(--border-color)] text-[13px]">
                    <div className="font-bold text-[var(--text-main)] font-heading">{d.title}</div>
                    <div className="flex justify-between items-center mt-2 text-[10px] font-mono font-bold tracking-wider uppercase">
                      <span className="text-[var(--secondary)]">Action: {d.action}</span>
                      <span className="text-[var(--success)]">Return: +{(d.return_pct * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] font-mono text-[var(--text-muted)] text-center py-4 bg-background rounded-[8px] border border-[var(--border-color)]">No APDE decisions executed yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTradingDashboardPage;
