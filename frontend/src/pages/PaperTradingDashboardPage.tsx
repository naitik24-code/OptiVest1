import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-400" />
            Enterprise Paper Trading Dashboard
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Virtual portfolio execution • Zero real money • APDE recommendation integration
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-950/20 to-[var(--bg-card)] border-emerald-900/30">
          <div className="text-xs text-[var(--text-muted)]">Total Portfolio Value</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            ${data?.portfolio_value?.toLocaleString() || '100,000.00'}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +1.2% Today
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Virtual Cash Balance</div>
          <div className="text-2xl font-mono font-bold text-[var(--text-main)] mt-1">
            ${data?.cash_balance?.toLocaleString() || '100,000.00'}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Buying Power: ${data?.buying_power?.toLocaleString()}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Invested Capital</div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            ${data?.invested_capital?.toLocaleString() || '0.00'}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Active Positions: {data?.open_positions?.length || 0}</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Total Realized P/L</div>
          <div className={`text-2xl font-mono font-bold mt-1 ${(data?.total_realized_pl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${data?.total_realized_pl?.toLocaleString() || '0.00'}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">Unrealized: ${data?.total_unrealized_pl?.toLocaleString()}</div>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Positions & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              Open Virtual Positions
            </h2>
            {data?.open_positions?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Quantity</th>
                      <th className="pb-2">Avg Entry</th>
                      <th className="pb-2">Current Price</th>
                      <th className="pb-2">Market Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] font-mono">
                    {data.open_positions.map((p: any) => (
                      <tr key={p.symbol} className="hover:bg-[var(--bg-main)]">
                        <td className="py-2.5 font-bold text-emerald-400">{p.symbol}</td>
                        <td className="py-2.5">{p.quantity}</td>
                        <td className="py-2.5">${p.average_price}</td>
                        <td className="py-2.5">${p.current_price}</td>
                        <td className="py-2.5 font-bold">${p.market_value?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)] italic py-6 text-center">
                No active virtual positions. Place an order or accept an APDE recommendation to begin!
              </div>
            )}
          </Card>

          {/* Recent Orders Log */}
          <Card className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Recent Virtual Orders
            </h2>
            {data?.recent_orders?.length ? (
              <div className="space-y-2 font-mono text-xs">
                {data.recent_orders.map((o: any) => (
                  <div key={o.id} className="p-2.5 rounded-lg bg-[var(--bg-main)] flex items-center justify-between border border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${o.side === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                        {o.side}
                      </span>
                      <span className="font-bold text-[var(--text-main)]">{o.symbol}</span>
                      <span className="text-[var(--text-muted)]">x{o.quantity}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${o.total_cost?.toLocaleString()}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">@ ${o.executed_price}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)] italic py-4 text-center">No recent virtual orders recorded.</div>
            )}
          </Card>
        </div>

        {/* Trade Execution Sidebar */}
        <div className="space-y-6">
          <Card className="p-5 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-main)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Manual Virtual Order Entry
            </h2>
            <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[var(--text-muted)] mb-1">Asset Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] font-mono uppercase font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[var(--text-muted)] mb-1">Order Side</label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] font-bold"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[var(--text-muted)] mb-1">Quantity</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-[var(--text-muted)] mb-1">Execution Price ($)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-lg font-bold transition-all shadow-md mt-2 ${
                  side === 'BUY'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                }`}
              >
                Submit Virtual {side} Order
              </button>

              {orderMsg && (
                <div className="p-2 rounded bg-[var(--bg-main)] text-[11px] font-mono border border-[var(--border-color)] text-center">
                  {orderMsg}
                </div>
              )}
            </form>
          </Card>

          {/* Recent APDE Decisions Executed */}
          <Card className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              APDE AI Executions
            </h2>
            {data?.recent_decisions?.length ? (
              <div className="space-y-2">
                {data.recent_decisions.map((d: any) => (
                  <div key={d.id} className="p-2.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs">
                    <div className="font-bold text-[var(--text-main)]">{d.title}</div>
                    <div className="flex justify-between items-center mt-1 text-[10px] text-[var(--text-muted)]">
                      <span className="text-emerald-400 font-bold">Action: {d.action}</span>
                      <span>Return: +{(d.return_pct * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[var(--text-muted)] italic text-center py-3">No APDE decisions executed yet.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
