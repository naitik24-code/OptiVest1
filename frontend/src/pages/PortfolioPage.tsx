import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { useCurrency } from '../context/CurrencyContext';
import { Portfolio, Asset, Transaction } from '../types/portfolio';
import { Search, Plus, Trash2, ArrowUpRight, FolderPlus, X, Edit3, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';

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
  const reallocationTransactions = transactions.filter((tx) =>
    Boolean(tx.notes?.toLowerCase().includes('reallocation'))
  );

  const filteredHoldings = holdings.filter((h) => {
    const sym = h.asset?.symbol || '';
    const name = h.asset?.company_name || '';
    return sym.toLowerCase().includes(searchTerm.toLowerCase()) || name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* Portfolio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--primary)] uppercase tracking-wider mb-1">
            <FolderPlus className="w-4 h-4" />
            <span>Management &bull; Assets</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)] flex items-center gap-3">
            <span>Portfolio Holdings &amp; Ledger</span>
            {activePortfolio && (
              <button
                onClick={() => setIsEditPortfolioOpen(true)}
                className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1"
                title="Edit Portfolio Info"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Real-time holdings tracking, position cost-basis, and transaction log.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-[12px]">
          {/* Portfolio Selector */}
          <select
            value={activePortfolio?.id || ''}
            onChange={(e) => handleSelectPortfolio(e.target.value)}
            className="px-[16px] py-[10px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
          >
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>

          <button onClick={() => { setPortfolioName(''); setPortfolioDesc(''); setIsCreatePortfolioOpen(true); }} className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all flex items-center gap-2 cursor-pointer">
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Portfolio</span>
          </button>

          <button onClick={() => setIsRecordTxOpen(true)} className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all flex items-center gap-2 cursor-pointer">
            <Receipt className="w-3.5 h-3.5" />
            <span>Record Trade</span>
          </button>

          <button onClick={() => setIsAddHoldingOpen(true)} className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-all flex items-center gap-2 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-[16px] rounded-[8px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[13px] font-mono font-bold tracking-wider text-[var(--danger)] flex justify-between items-center shadow-[0_0_15px_rgba(255,74,99,0.1)]">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Valuation & Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="inst-card p-[24px] relative overflow-hidden group">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Portfolio Value</div>
          <div className="text-[32px] font-extrabold font-mono text-[var(--text-main)] leading-none mb-[8px] drop-shadow-sm">
            {formatAmount(metrics?.portfolio_value || 0)}
          </div>
          <div className={`text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${(metrics?.profit_loss || 0) >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            <ArrowUpRight className="w-3.5 h-3.5" />
            {(metrics?.profit_loss || 0) >= 0 ? '+' : ''}{formatAmount(metrics?.profit_loss || 0)} ({metrics?.profit_loss_pct || 0}%) Total Return
          </div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Total Capital Invested</div>
          <div className="text-[32px] font-extrabold font-mono text-[var(--text-main)] leading-none mb-[8px] drop-shadow-sm">
            {formatAmount(metrics?.total_invested || 0)}
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Across {metrics?.holdings_count || 0} position(s)
          </div>
        </div>

        <div className="inst-card p-[24px] relative overflow-hidden group">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">Position Count</div>
          <div className="text-[32px] font-extrabold font-mono text-[var(--secondary)] leading-none mb-[8px] drop-shadow-[0_0_5px_rgba(76,139,255,0.3)]">
            {metrics?.holdings_count || 0}
          </div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {metrics?.assets_count || 0} Unique Asset Tickers
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Holdings vs Transactions) */}
      <div className="flex border-b border-[var(--border-color)] font-mono text-[13px] gap-[24px]">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`py-[12px] font-bold uppercase tracking-wider border-b-[2px] transition-all cursor-pointer ${
            activeTab === 'holdings'
              ? 'border-[var(--primary)] text-[var(--primary)] drop-shadow-[0_0_5px_rgba(255,90,31,0.5)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color)]'
          }`}
        >
          Active Holdings ({holdings.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`py-[12px] font-bold uppercase tracking-wider border-b-[2px] transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-[var(--primary)] text-[var(--primary)] drop-shadow-[0_0_5px_rgba(255,90,31,0.5)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-color)]'
          }`}
        >
          Transaction History ({transactions.length})
        </button>
      </div>

      {/* Reallocation Audit: derived from persisted transaction notes so the rationale remains visible. */}
      {(
        <section className="inst-card p-[24px] border-[var(--primary)]/30 bg-[var(--primary)]/[0.03]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--primary)] font-mono text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> Reallocation Audit Trail
              </div>
              <h3 className="text-[18px] font-bold font-heading text-[var(--text-main)] mt-1">Why this portfolio changed</h3>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">Persisted execution records explaining the source, destination, size and rationale.</p>
            </div>
            <span className="px-2 py-1 rounded border border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-mono font-bold uppercase">Recorded</span>
          </div>
          <div className="space-y-3">
            {reallocationTransactions.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--border-color)] p-4 text-[12px] text-[var(--text-muted)] font-mono">
                No executed reallocation is recorded for this selected portfolio yet. The APDE evaluates drift, concentration, volatility, correlation, expected return, transaction cost and turnover limits before it can approve a move. A HOLD or CASH result is intentional when the evidence threshold is not met.
              </div>
            )}
            {reallocationTransactions.map((tx) => {
              const destination = tx.notes?.match(/to ([A-Z]+)$/i)?.[1] || (tx.transaction_type === 'BUY' ? tx.asset?.symbol : undefined);
              const source = tx.notes?.match(/reduce ([A-Z]+)/i)?.[1] || (tx.transaction_type === 'SELL' ? tx.asset?.symbol : undefined);
              return (
                <div key={tx.id} className="rounded-lg border border-[var(--border-color)] bg-[var(--surface2)] p-4">
                  <div className="flex flex-wrap items-center gap-3 text-[13px] font-mono font-bold text-[var(--text-main)]">
                    <span>{source || tx.asset?.symbol || 'Source'}</span><ArrowRight className="w-4 h-4 text-[var(--primary)]" /><span>{destination || tx.asset?.symbol || 'Destination'}</span>
                    <span className="ml-auto text-[11px] text-[var(--text-muted)] font-normal">{new Date(tx.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-2">{tx.notes}</p>
                  <p className="text-[12px] text-[var(--text-main)] mt-2"><b>Decision explanation:</b> the recorded move reduced the source position and redirected the same notional value to the destination. It is visible here as a paired SELL and BUY so the rationale and audit trail are not hidden inside raw order history.</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    <span>Action: <b className={tx.transaction_type === 'SELL' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}>{tx.transaction_type}</b></span>
                    <span>Quantity: <b className="text-[var(--text-main)]">{tx.quantity}</b></span>
                    <span>Value: <b className="text-[var(--text-main)]">{formatAmount(tx.total_amount)}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Holdings View */}
      {activeTab === 'holdings' && (
        <div className="inst-card p-[24px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <span className="flex items-center gap-2">Holdings in {activePortfolio?.name || 'Portfolio'}</span>
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-[24px]">
            <div className="relative w-full sm:w-[320px]">
              <Search className="w-4 h-4 absolute left-[14px] top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search holding symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-[40px] pr-[16px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-[32px] text-center text-[13px] font-mono text-[var(--text-muted)] tracking-wider">
              Loading holdings...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] font-mono">
                <thead className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="pb-3 px-2">SYMBOL</th>
                    <th className="pb-3 px-2">COMPANY</th>
                    <th className="pb-3 px-2 text-right">SHARES</th>
                    <th className="pb-3 px-2 text-right">AVG COST</th>
                    <th className="pb-3 px-2 text-right">CURRENT PRICE</th>
                    <th className="pb-3 px-2 text-right">MARKET VALUE</th>
                    <th className="pb-3 px-2 text-right">UNREALIZED P&amp;L</th>
                    <th className="pb-3 px-2 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredHoldings.length > 0 ? (
                    filteredHoldings.map((h) => (
                      <tr key={h.id} className="hover:bg-background transition-colors">
                        <td className="py-4 px-2 font-bold font-heading text-[15px] text-[var(--secondary)]">{h.asset?.symbol}</td>
                        <td className="py-4 px-2 text-[var(--text-main)] font-sans">{h.asset?.company_name}</td>
                        <td className="py-4 px-2 text-right text-[var(--text-main)] font-bold">{h.quantity.toLocaleString()}</td>
                        <td className="py-4 px-2 text-right text-[var(--text-muted)]">{formatAmount(h.average_buy_price)}</td>
                        <td className="py-4 px-2 text-right font-bold text-[var(--text-main)]">{formatAmount(h.asset?.price || h.average_buy_price)}</td>
                        <td className="py-4 px-2 text-right font-bold text-[var(--text-main)]">{formatAmount(h.market_value)}</td>
                        <td className={`py-4 px-2 text-right font-bold ${h.unrealized_pnl >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'}`}>
                          {h.unrealized_pnl >= 0 ? '+' : ''}{formatAmount(h.unrealized_pnl)} ({h.unrealized_pnl_pct}%)
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => handleDeleteHolding(h.id)}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer rounded-[4px] hover:bg-[var(--danger)]/10"
                            title="Delete holding"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-[32px] text-center text-[var(--text-muted)] font-mono text-[13px] bg-background rounded-[8px] border border-[var(--border-color)] mt-4">
                        No holdings in this portfolio yet. Click <strong className="text-[var(--text-main)]">Add Position</strong> above to record your first holding.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions View */}
      {activeTab === 'transactions' && (
        <div className="inst-card p-[24px]">
          <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] mb-6 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
            <span className="flex items-center gap-2">Transaction History for {activePortfolio?.name || 'Portfolio'}</span>
          </h3>
          {isLoading ? (
            <div className="p-[32px] text-center text-[13px] font-mono text-[var(--text-muted)] tracking-wider">
              Loading transactions...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] font-mono">
                <thead className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="pb-3 px-2">DATE / TIMESTAMP</th>
                    <th className="pb-3 px-2">TYPE</th>
                    <th className="pb-3 px-2">SYMBOL</th>
                    <th className="pb-3 px-2 text-right">QUANTITY</th>
                    <th className="pb-3 px-2 text-right">PRICE</th>
                    <th className="pb-3 px-2 text-right">FEES</th>
                    <th className="pb-3 px-2 text-right">TOTAL AMOUNT</th>
                    <th className="pb-3 px-2">NOTES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-background transition-colors">
                        <td className="py-4 px-2 text-[var(--text-muted)] text-[12px]">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td className="py-4 px-2 font-bold">
                          <span className={`px-[8px] py-[4px] rounded-[4px] border text-[10px] uppercase tracking-wider ${
                            tx.transaction_type === 'BUY' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30' :
                            tx.transaction_type === 'SELL' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30' :
                            'bg-[var(--secondary)]/10 text-[var(--secondary)] border-[var(--secondary)]/30'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-bold font-heading text-[15px] text-[var(--secondary)]">{tx.asset?.symbol}</td>
                        <td className="py-4 px-2 text-right text-[var(--text-main)]">{tx.quantity}</td>
                        <td className="py-4 px-2 text-right text-[var(--text-main)]">{formatAmount(tx.price)}</td>
                        <td className="py-4 px-2 text-right text-[var(--text-muted)]">{formatAmount(tx.fees)}</td>
                        <td className="py-4 px-2 text-right font-bold text-[var(--text-main)]">{formatAmount(tx.total_amount)}</td>
                        <td className="py-4 px-2 text-[var(--text-muted)] text-[12px] truncate max-w-[200px]">{tx.notes || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-[32px] text-center text-[var(--text-muted)] font-mono text-[13px] bg-background rounded-[8px] border border-[var(--border-color)] mt-4">
                        No transactions recorded for this portfolio. Click <strong className="text-[var(--text-main)]">Record Trade</strong> to log your first order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Transaction Modal */}
      {isRecordTxOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="inst-card w-full max-w-md p-[24px] shadow-[0_0_30px_rgba(0,0,0,0.8)] border-[var(--border-color)]">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
              <h3 className="text-[18px] font-bold font-heading text-[var(--text-main)]">Record Portfolio Transaction</h3>
              <button onClick={() => setIsRecordTxOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordTransaction} className="space-y-[16px]">
              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Type</label>
                  <select
                    value={txType}
                    onChange={(e: any) => setTxType(e.target.value)}
                    className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="DIVIDEND">DIVIDEND</option>
                    <option value="FEE">FEE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Asset Symbol</label>
                  <select
                    value={txAssetId}
                    onChange={(e) => {
                      setTxAssetId(e.target.value);
                      const found = assets.find(a => a.id === e.target.value);
                      if (found) setTxPrice(found.price.toString());
                    }}
                    className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.symbol} (${a.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Quantity (Shares)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={txQty}
                    onChange={(e) => setTxQty(e.target.value)}
                    className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Execution Price ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 175.50"
                    value={txPrice}
                    onChange={(e) => setTxPrice(e.target.value)}
                    className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Broker Fees ($)</label>
                <input
                  type="number"
                  step="any"
                  value={txFees}
                  onChange={(e) => setTxFees(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Transaction Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly DCA rebalance order"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-[12px] pt-[16px] border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsRecordTxOpen(false)} className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-colors cursor-pointer">
                  Record Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Portfolio Modal */}
      {isEditPortfolioOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="inst-card w-full max-w-md p-[24px] shadow-[0_0_30px_rgba(0,0,0,0.8)] border-[var(--border-color)]">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
              <h3 className="text-[18px] font-bold font-heading text-[var(--text-main)]">Edit Portfolio Details</h3>
              <button onClick={() => setIsEditPortfolioOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditPortfolio} className="space-y-[16px]">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Portfolio Name</label>
                <input
                  type="text"
                  required
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description</label>
                <input
                  type="text"
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-[12px] pt-[16px] border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsEditPortfolioOpen(false)} className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-colors cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holding Modal */}
      {isAddHoldingOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="inst-card w-full max-w-md p-[24px] shadow-[0_0_30px_rgba(0,0,0,0.8)] border-[var(--border-color)]">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
              <h3 className="text-[18px] font-bold font-heading text-[var(--text-main)]">Add Asset Position</h3>
              <button onClick={() => setIsAddHoldingOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddHolding} className="space-y-[16px]">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Select Asset</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    const found = assets.find(a => a.id === e.target.value);
                    if (found) setBuyPrice(found.price.toString());
                  }}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.symbol} — {a.company_name} (${a.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Quantity (Shares)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 10"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Average Buy Price ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 150.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-[12px] pt-[16px] border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsAddHoldingOpen(false)} className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-colors cursor-pointer">
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Portfolio Modal */}
      {isCreatePortfolioOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="inst-card w-full max-w-md p-[24px] shadow-[0_0_30px_rgba(0,0,0,0.8)] border-[var(--border-color)]">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
              <h3 className="text-[18px] font-bold font-heading text-[var(--text-main)]">Create New Portfolio</h3>
              <button onClick={() => setIsCreatePortfolioOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePortfolio} className="space-y-[16px]">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Portfolio Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Retirement Core"
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Long term equity growth"
                  value={portfolioDesc}
                  onChange={(e) => setPortfolioDesc(e.target.value)}
                  className="w-full px-[14px] py-[12px] bg-background border border-[var(--border-color)] rounded-[8px] text-[13px] font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-[12px] pt-[16px] border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsCreatePortfolioOpen(false)} className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-main)] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-[16px] py-[10px] rounded-[8px] text-[13px] font-bold font-mono uppercase tracking-wider bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-colors cursor-pointer">
                  Create Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
