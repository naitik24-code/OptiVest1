import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { useCurrency } from '../context/CurrencyContext';
import { Portfolio, Asset, Transaction } from '../types/portfolio';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Search, Plus, Trash2, ArrowUpRight, FolderPlus, X, Edit3, Receipt } from 'lucide-react';


export const PortfolioPage: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'holdings' | 'transactions'>('holdings');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = useState(false);
  const [isEditPortfolioOpen, setIsEditPortfolioOpen] = useState(false);
  const [isRecordTxOpen, setIsRecordTxOpen] = useState(false);

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  // Portfolio form states
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDesc, setPortfolioDesc] = useState('');

  // Transaction form states
  const [txType, setTxType] = useState<'BUY' | 'SELL' | 'DIVIDEND' | 'FEE'>('BUY');
  const [txAssetId, setTxAssetId] = useState('');
  const [txQty, setTxQty] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txFees, setTxFees] = useState('0.00');
  const [txNotes, setTxNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async (preferredPortfolioId?: string) => {
    setIsLoading(true);
    try {
      const [ports, assetList] = await Promise.all([
        portfolioService.getPortfolios(),
        portfolioService.getAssets()
      ]);
      setPortfolios(ports);
      setAssets(assetList);
      if (assetList.length > 0 && !selectedAssetId) {
        setSelectedAssetId(assetList[0].id);
        setTxAssetId(assetList[0].id);
      }

      if (ports.length > 0) {
        const isValidActive = activePortfolio?.id && ports.some(p => p.id === activePortfolio.id);
        const targetId = preferredPortfolioId || (isValidActive ? activePortfolio!.id : (ports.find(p => p.is_default) || ports[0]).id);
        const fullP = await portfolioService.getPortfolioById(targetId);
        setActivePortfolio(fullP);
        setPortfolioName(fullP.name);
        setPortfolioDesc(fullP.description || '');

        const txs = await portfolioService.getPortfolioTransactions(fullP.id);
        setTransactions(txs);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPortfolio = async (id: string) => {
    try {
      const fullP = await portfolioService.getPortfolioById(id);
      setActivePortfolio(fullP);
      setPortfolioName(fullP.name);
      setPortfolioDesc(fullP.description || '');
      const txs = await portfolioService.getPortfolioTransactions(fullP.id);
      setTransactions(txs);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioName) return;
    try {
      const created = await portfolioService.createPortfolio({
        name: portfolioName,
        description: portfolioDesc
      });
      setIsCreatePortfolioOpen(false);
      setPortfolioName('');
      setPortfolioDesc('');
      await loadData(created.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleEditPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortfolio || !portfolioName) return;
    try {
      const updated = await portfolioService.updatePortfolio(activePortfolio.id, {
        name: portfolioName,
        description: portfolioDesc
      });
      setIsEditPortfolioOpen(false);
      await loadData(updated.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortfolio || !selectedAssetId || !shares || !buyPrice) return;
    try {
      const updatedP = await portfolioService.addHolding({
        portfolio_id: activePortfolio.id,
        asset_id: selectedAssetId,
        quantity: Number(shares),
        average_buy_price: Number(buyPrice)
      });
      setIsAddHoldingOpen(false);
      setShares('');
      setBuyPrice('');
      await loadData(updatedP.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortfolio || !txAssetId || !txQty || !txPrice) return;
    try {
      await portfolioService.recordTransaction({
        portfolio_id: activePortfolio.id,
        asset_id: txAssetId,
        transaction_type: txType,
        quantity: Number(txQty),
        price: Number(txPrice),
        fees: Number(txFees) || 0,
        notes: txNotes
      });
      setIsRecordTxOpen(false);
      setTxQty('');
      setTxPrice('');
      setTxNotes('');
      await loadData(activePortfolio.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (!activePortfolio) return;
    try {
      await portfolioService.deleteHolding(holdingId);
      await loadData(activePortfolio.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const metrics = activePortfolio?.metrics;
  const holdings = activePortfolio?.holdings || [];

  const filteredHoldings = holdings.filter((h) => {
    const sym = h.asset?.symbol || '';
    const name = h.asset?.company_name || '';
    return sym.toLowerCase().includes(searchTerm.toLowerCase()) || name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Portfolio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)] flex items-center gap-2">
            <span>Portfolio Holdings &amp; Ledger</span>
            {activePortfolio && (
              <button
                onClick={() => setIsEditPortfolioOpen(true)}
                className="text-[var(--text-muted)] hover:text-[#2563EB] transition-colors"
                title="Edit Portfolio Info"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time holdings tracking, position cost-basis, and transaction log.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Portfolio Selector */}
          <select
            value={activePortfolio?.id || ''}
            onChange={(e) => handleSelectPortfolio(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
          >
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>

          <Button onClick={() => { setPortfolioName(''); setPortfolioDesc(''); setIsCreatePortfolioOpen(true); }} variant="secondary" className="text-xs px-3 py-2 flex items-center gap-1">
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Portfolio</span>
          </Button>

          <Button onClick={() => setIsRecordTxOpen(true)} variant="secondary" className="text-xs px-3 py-2 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>Record Trade</span>
          </Button>

          <Button onClick={() => setIsAddHoldingOpen(true)} className="text-xs px-3.5 py-2 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs font-mono text-[#F87171] flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Valuation & Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Portfolio Value" subtitle="Total Market Value">
          <div className="space-y-1 font-mono">
            <div className="text-2xl font-bold text-[var(--text-main)]">
              {formatAmount(metrics?.portfolio_value || 0)}
            </div>
            <div className={`text-xs font-bold flex items-center gap-1 ${(metrics?.profit_loss || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#F87171]'}`}>
              <ArrowUpRight className="w-3.5 h-3.5" />
              {(metrics?.profit_loss || 0) >= 0 ? '+' : ''}{formatAmount(metrics?.profit_loss || 0)} ({metrics?.profit_loss_pct || 0}%) Total Return
            </div>
          </div>
        </Card>

        <Card title="Total Capital Invested" subtitle="Book Cost Basis">
          <div className="space-y-1 font-mono">
            <div className="text-2xl font-bold text-[var(--text-main)]">
              {formatAmount(metrics?.total_invested || 0)}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Across {metrics?.holdings_count || 0} position(s)
            </div>
          </div>
        </Card>


        <Card title="Position Count" subtitle="Asset Allocation">
          <div className="space-y-1 font-mono">
            <div className="text-2xl font-bold text-[#2563EB]">
              {metrics?.holdings_count || 0} Active Positions
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {metrics?.assets_count || 0} Unique Asset Tickers
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs (Holdings vs Transactions) */}
      <div className="flex border-b border-[var(--border-color)] font-mono text-xs">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-colors ${
            activeTab === 'holdings'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Active Holdings ({holdings.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-colors ${
            activeTab === 'transactions'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Transaction History ({transactions.length})
        </button>
      </div>

      {/* Holdings View */}
      {activeTab === 'holdings' && (
        <Card title={`Holdings in ${activePortfolio?.name || 'Portfolio'}`} subtitle="Position Accounting">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 pt-2">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search holding symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
              Loading holdings...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="p-3">SYMBOL</th>
                    <th className="p-3">COMPANY</th>
                    <th className="p-3 text-right">SHARES</th>
                    <th className="p-3 text-right">AVG COST</th>
                    <th className="p-3 text-right">CURRENT PRICE</th>
                    <th className="p-3 text-right">MARKET VALUE</th>
                    <th className="p-3 text-right">UNREALIZED P&amp;L</th>
                    <th className="p-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredHoldings.length > 0 ? (
                    filteredHoldings.map((h) => (
                      <tr key={h.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                        <td className="p-3 font-bold text-[#2563EB]">{h.asset?.symbol}</td>
                        <td className="p-3 text-[var(--text-main)] font-sans">{h.asset?.company_name}</td>
                        <td className="p-3 text-right text-[var(--text-main)]">{h.quantity.toLocaleString()}</td>
                        <td className="p-3 text-right text-[var(--text-muted)]">{formatAmount(h.average_buy_price)}</td>
                        <td className="p-3 text-right font-bold text-[var(--text-main)]">{formatAmount(h.asset?.price || h.average_buy_price)}</td>
                        <td className="p-3 text-right font-bold text-[var(--text-main)]">{formatAmount(h.market_value)}</td>
                        <td className={`p-3 text-right font-bold ${h.unrealized_pnl >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                          {h.unrealized_pnl >= 0 ? '+' : ''}{formatAmount(h.unrealized_pnl)} ({h.unrealized_pnl_pct}%)
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteHolding(h.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-[#DC2626] transition-colors"
                            title="Delete holding"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-[var(--text-muted)] font-sans">
                        No holdings in this portfolio yet. Click <strong>Add Position</strong> above to record your first holding.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Transactions View */}
      {activeTab === 'transactions' && (
        <Card title={`Transaction History for ${activePortfolio?.name || 'Portfolio'}`} subtitle="Ledger Audit Trail">
          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
              Loading transactions...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="p-3">DATE / TIMESTAMP</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">SYMBOL</th>
                    <th className="p-3 text-right">QUANTITY</th>
                    <th className="p-3 text-right">PRICE</th>
                    <th className="p-3 text-right">FEES</th>
                    <th className="p-3 text-right">TOTAL AMOUNT</th>
                    <th className="p-3">NOTES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                        <td className="p-3 text-[var(--text-muted)]">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded border ${
                            tx.transaction_type === 'BUY' ? 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/30' :
                            tx.transaction_type === 'SELL' ? 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30' :
                            'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/30'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[#2563EB]">{tx.asset?.symbol}</td>
                        <td className="p-3 text-right text-[var(--text-main)]">{tx.quantity}</td>
                        <td className="p-3 text-right text-[var(--text-main)]">{formatAmount(tx.price)}</td>
                        <td className="p-3 text-right text-[var(--text-muted)]">{formatAmount(tx.fees)}</td>
                        <td className="p-3 text-right font-bold text-[var(--text-main)]">{formatAmount(tx.total_amount)}</td>
                        <td className="p-3 text-[var(--text-muted)] font-sans">{tx.notes || '-'}</td>
                      </tr>

                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-[var(--text-muted)] font-sans">
                        No transactions recorded for this portfolio. Click <strong>Record Trade</strong> to log your first order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Record Transaction Modal */}
      {isRecordTxOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-main)]">Record Portfolio Transaction</h3>
              <button onClick={() => setIsRecordTxOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[var(--text-muted)]">Type</label>
                  <select
                    value={txType}
                    onChange={(e: any) => setTxType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="DIVIDEND">DIVIDEND</option>
                    <option value="FEE">FEE</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-[var(--text-muted)]">Asset Symbol</label>
                  <select
                    value={txAssetId}
                    onChange={(e) => {
                      setTxAssetId(e.target.value);
                      const found = assets.find(a => a.id === e.target.value);
                      if (found) setTxPrice(found.price.toString());
                    }}
                    className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.symbol} (${a.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[var(--text-muted)]">Quantity (Shares)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={txQty}
                    onChange={(e) => setTxQty(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[var(--text-muted)]">Execution Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 175.50"
                    value={txPrice}
                    onChange={(e) => setTxPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Broker Fees ($)</label>
                <input
                  type="number"
                  step="any"
                  value={txFees}
                  onChange={(e) => setTxFees(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Transaction Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly DCA rebalance order"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsRecordTxOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Record Trade
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Portfolio Modal */}
      {isEditPortfolioOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-main)]">Edit Portfolio Details</h3>
              <button onClick={() => setIsEditPortfolioOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditPortfolio} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Portfolio Name</label>
                <input
                  type="text"
                  required
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Description</label>
                <input
                  type="text"
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditPortfolioOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holding Modal */}
      {isAddHoldingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-main)]">Add Asset Position</h3>
              <button onClick={() => setIsAddHoldingOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddHolding} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Select Asset</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    const found = assets.find(a => a.id === e.target.value);
                    if (found) setBuyPrice(found.price.toString());
                  }}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.symbol} — {a.company_name} (${a.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Quantity (Shares)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 10"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Average Buy Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 150.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddHoldingOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Position
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Portfolio Modal */}
      {isCreatePortfolioOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-main)]">Create New Portfolio</h3>
              <button onClick={() => setIsCreatePortfolioOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePortfolio} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Portfolio Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Retirement Core"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Long term equity growth"
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsCreatePortfolioOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Portfolio
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

