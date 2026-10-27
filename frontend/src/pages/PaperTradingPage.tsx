import React, { useState } from 'react';
import { Play, DollarSign, ListOrdered } from 'lucide-react';

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
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Virtual Execution &bull; Sandbox</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Paper Trading Execution Sandbox
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Simulated order execution environment to test APDE reallocation models risk-free.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trade Execution Panel */}
        <div className="lg:col-span-5">
          <div className="inst-card p-[24px]">
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
              <Play className="w-5 h-5 text-[var(--primary)]" />
              Execute Virtual Order
            </h3>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-[20px]">
              <div className="grid grid-cols-2 gap-[12px]">
                <button
                  type="button"
                  onClick={() => setTradeType('BUY')}
                  className={`py-[12px] rounded-[8px] font-bold font-mono text-[13px] tracking-wider transition-all cursor-pointer ${
                    tradeType === 'BUY' ? 'bg-[var(--success)] text-[#050608] shadow-[0_0_15px_rgba(23,217,140,0.3)]' : 'bg-background text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--success)]/40'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType('SELL')}
                  className={`py-[12px] rounded-[8px] font-bold font-mono text-[13px] tracking-wider transition-all cursor-pointer ${
                    tradeType === 'SELL' ? 'bg-[var(--danger)] text-[#050608] shadow-[0_0_15px_rgba(255,74,99,0.3)]' : 'bg-background text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--danger)]/40'
                  }`}
                >
                  SELL
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Ticker Symbol</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[14px] font-mono font-extrabold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Quantity (Shares)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[14px] font-mono font-extrabold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="p-[16px] rounded-[8px] bg-background border border-[var(--border-color)] space-y-[12px] text-[13px] font-mono">
                <div className="flex justify-between items-center text-[var(--text-muted)] uppercase tracking-wider text-[11px] font-bold">
                  <span>Estimated Total</span>
                  <span className="font-extrabold text-[var(--text-main)] text-[16px]">$7,881.70</span>
                </div>
                <div className="flex justify-between items-center text-[var(--text-muted)] uppercase tracking-wider text-[11px] font-bold pt-[12px] border-t border-[var(--border-color)]">
                  <span>Simulated Commission</span>
                  <span className="text-[var(--success)]">$0.00</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-[14px] bg-[var(--primary)] text-[#050608] font-bold font-mono text-[13px] tracking-wider rounded-[8px] shadow-[0_0_15px_rgba(255,90,31,0.3)] hover:bg-[#ff7a45] transition-all flex items-center justify-center gap-2 cursor-pointer mt-[24px]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Submit Virtual Order</span>
              </button>
            </form>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-7">
          <div className="inst-card p-[24px] h-full flex flex-col">
            <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
              <ListOrdered className="w-5 h-5 text-[var(--secondary)]" />
              Executed Paper Trades
            </h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-[13px] font-mono">
                <thead className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="pb-3 px-2">ORDER ID</th>
                    <th className="pb-3 px-2">SYMBOL</th>
                    <th className="pb-3 px-2">TYPE</th>
                    <th className="pb-3 px-2 text-right">QTY</th>
                    <th className="pb-3 px-2 text-right">PRICE</th>
                    <th className="pb-3 px-2 text-right">TOTAL</th>
                    <th className="pb-3 px-2 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-background transition-colors">
                      <td className="py-4 px-2 text-[var(--text-muted)] text-[12px]">{h.id}</td>
                      <td className="py-4 px-2 font-bold font-heading text-[15px] text-[var(--text-main)]">{h.ticker}</td>
                      <td className={`py-4 px-2 font-bold tracking-wider ${h.type === 'BUY' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>{h.type}</td>
                      <td className="py-4 px-2 text-right text-[var(--text-main)]">{h.qty}</td>
                      <td className="py-4 px-2 text-right text-[var(--text-muted)]">{h.price}</td>
                      <td className="py-4 px-2 text-right font-bold text-[var(--text-main)]">{h.total}</td>
                      <td className="py-4 px-2 text-center">
                        <span className="px-[8px] py-[4px] rounded-[4px] bg-[var(--success)]/10 text-[var(--success)] font-bold text-[10px] border border-[var(--success)]/30 tracking-wider">
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTradingPage;
