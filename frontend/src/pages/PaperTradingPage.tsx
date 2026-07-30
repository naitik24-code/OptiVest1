import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Play } from 'lucide-react';

export const PaperTradingPage: React.FC = () => {
  const [ticker, setTicker] = useState('NVDA');
  const [quantity, setQuantity] = useState('10');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  const history = [
    { id: 'ORD-9821', ticker: 'NVDA', type: 'BUY', qty: 10, price: '$785.40', total: '$7,854.00', status: 'EXECUTED', time: '10:42 AM' },
    { id: 'ORD-9820', ticker: 'TSLA', type: 'SELL', qty: 5, price: '$198.10', total: '$990.50', status: 'EXECUTED', time: '09:15 AM' },
    { id: 'ORD-9819', ticker: 'MSFT', type: 'BUY', qty: 20, price: '$408.90', total: '$8,178.00', status: 'EXECUTED', time: 'Yesterday' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
          Paper Trading Execution Sandbox
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Simulated order execution environment to test APDE reallocation models risk-free.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trade Execution Panel */}
        <div className="lg:col-span-5">
          <Card title="Execute Virtual Order" subtitle="Paper Execution Console">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTradeType('BUY')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    tradeType === 'BUY' ? 'bg-[#16A34A] text-white shadow-md' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType('SELL')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    tradeType === 'SELL' ? 'bg-[#DC2626] text-white shadow-md' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
                  }`}
                >
                  SELL
                </button>
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Ticker Symbol</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Quantity (Shares)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1 text-xs font-mono">
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Estimated Total</span>
                  <span className="font-bold text-[var(--text-main)]">$7,881.70</span>
                </div>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Simulated Commission</span>
                  <span className="text-[#16A34A]">$0.00</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#2563EB] text-white font-bold text-xs rounded-lg shadow-md hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Submit Virtual Order</span>
              </button>
            </form>
          </Card>
        </div>

        {/* Order History */}
        <div className="lg:col-span-7">
          <Card title="Executed Paper Trades" subtitle="Audit Log">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="p-3">ORDER ID</th>
                    <th className="p-3">SYMBOL</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3 text-right">QTY</th>
                    <th className="p-3 text-right">PRICE</th>
                    <th className="p-3 text-right">TOTAL</th>
                    <th className="p-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                      <td className="p-3 text-[var(--text-muted)]">{h.id}</td>
                      <td className="p-3 font-bold text-[var(--text-main)]">{h.ticker}</td>
                      <td className={`p-3 font-bold ${h.type === 'BUY' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{h.type}</td>
                      <td className="p-3 text-right text-[var(--text-main)]">{h.qty}</td>
                      <td className="p-3 text-right text-[var(--text-muted)]">{h.price}</td>
                      <td className="p-3 text-right font-bold text-[var(--text-main)]">{h.total}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#16A34A]/15 text-[#16A34A] font-bold text-[10px] border border-[#16A34A]/30">
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
