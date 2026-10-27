import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { portfolioService } from '../services/portfolioService';
import { marketService, MarketQuote } from '../services/marketService';
import { Watchlist, Asset } from '../types/portfolio';
import { Bookmark, Trash2, Plus, X, LineChart } from 'lucide-react';

export const WatchlistPage: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  const [activeWatchlist, setActiveWatchlist] = useState<Watchlist | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, MarketQuote>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateWlModalOpen, setIsCreateWlModalOpen] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [newWlDesc, setNewWlDesc] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async (preferredId?: string) => {
    setIsLoading(true);
    try {
      const [wls, assetList] = await Promise.all([
        portfolioService.getWatchlists(),
        portfolioService.getAssets()
      ]);
      setWatchlists(wls);
      setAssets(assetList);
      if (assetList.length > 0 && !selectedAssetId) setSelectedAssetId(assetList[0].id);

      if (wls.length > 0) {
        const target = preferredId ? wls.find(w => w.id === preferredId) || wls[0] : wls[0];
        setActiveWatchlist(target);
      } else {
        setActiveWatchlist(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load watchlists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!activeWatchlist || !activeWatchlist.items) return;
    const fetchQuotes = async () => {
      const quotesMap: Record<string, MarketQuote> = {};
      for (const item of activeWatchlist.items) {
        if (item.asset?.symbol) {
          try {
            const q = await marketService.getLiveQuote(item.asset.symbol);
            quotesMap[item.asset.symbol] = q;
          } catch (e) {
            console.error(`Failed to fetch quote for ${item.asset.symbol}`, e);
          }
        }
      }
      setLiveQuotes(quotesMap);
    };
    fetchQuotes();
  }, [activeWatchlist]);

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWlName.trim()) return;
    try {
      const created = await portfolioService.createWatchlist(newWlName, newWlDesc);
      setNewWlName('');
      setNewWlDesc('');
      setIsCreateWlModalOpen(false);
      await loadData(created.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteWatchlist = async () => {
    if (!activeWatchlist) return;
    if (!window.confirm(`Are you sure you want to delete '${activeWatchlist.name}'?`)) return;
    try {
      await portfolioService.deleteWatchlist(activeWatchlist.id);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWatchlist || !selectedAssetId) return;
    try {
      const updatedWl = await portfolioService.addWatchlistItem(activeWatchlist.id, selectedAssetId);
      setActiveWatchlist(updatedWl);
      setIsAddModalOpen(false);
      await loadData(updatedWl.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRemoveItem = async (assetId: string) => {
    if (!activeWatchlist) return;
    try {
      const updatedWl = await portfolioService.removeWatchlistItem(activeWatchlist.id, assetId);
      setActiveWatchlist(updatedWl);
      await loadData(updatedWl.id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const items = activeWatchlist?.items || [];

  return (
    <div className="max-w-[1120px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#14b8a6] uppercase tracking-wider mb-1">
            <LineChart className="w-4 h-4" />
            <span>Markets &bull; Price Discovery</span>
          </div>
          <h2 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Custom Asset Watchlists
          </h2>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Monitor target equity symbols, price points, and custom watchlist tracking.
          </p>
        </div>
        <div className="flex items-center gap-[12px]">
          <button
            onClick={() => setIsCreateWlModalOpen(true)}
            className="px-[16px] py-[10px] bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] rounded-[6px] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Watchlist</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={!activeWatchlist}
            className="px-[16px] py-[10px] bg-[var(--primary)] hover:bg-[#ff7a45] disabled:opacity-50 text-[#050608] text-[11px] font-mono font-bold uppercase tracking-wider rounded-[6px] flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(255,90,31,0.3)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 fill-current" />
            <span>Add Symbol</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-[16px] rounded-[8px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[13px] font-mono text-[var(--danger)] flex items-center gap-2 shadow-[0_0_10px_rgba(255,74,99,0.1)]">
          <div className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
          {errorMsg}
        </div>
      )}

      {/* Multi-Watchlist Selector Bar */}
      {watchlists.length > 0 && (
        <div className="flex items-center justify-between gap-[16px] p-[16px] rounded-[8px] bg-background border border-[var(--border-color)]">
          <div className="flex items-center gap-[12px]">
            <label className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">Active Watchlist:</label>
            <select
              value={activeWatchlist?.id || ''}
              onChange={(e) => {
                const found = watchlists.find(w => w.id === e.target.value);
                if (found) setActiveWatchlist(found);
              }}
              className="px-[12px] py-[8px] bg-surface border border-[var(--border-color)] rounded-[6px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer min-w-[250px]"
            >
              {watchlists.map((wl) => (
                <option key={wl.id} value={wl.id}>
                  {wl.name} ({wl.items?.length || 0} items)
                </option>
              ))}
            </select>
          </div>

          {activeWatchlist && (
            <button
              onClick={handleDeleteWatchlist}
              className="flex items-center gap-2 px-[12px] py-[8px] rounded-[6px] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Watchlist</span>
            </button>
          )}
        </div>
      )}

      <div className="inst-card p-[32px]">
        <h3 className="text-[14px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-[16px] mb-[24px]">
          <Bookmark className="w-5 h-5 text-[var(--secondary)]" />
          Tracked Instruments ({activeWatchlist?.name || 'Watchlist'})
        </h3>
        
        {isLoading ? (
          <div className="p-[60px] text-center text-[13px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
            Loading watchlist data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[13px]">
              <thead className="bg-background/50 border-b border-[var(--border-color)]">
                <tr>
                  <th className="py-4 px-4 font-bold tracking-wider uppercase text-[var(--text-muted)] text-[10px] border-b border-[var(--border-color)]">Symbol</th>
                  <th className="py-4 px-4 font-bold tracking-wider uppercase text-[var(--text-muted)] text-[10px] border-b border-[var(--border-color)]">Company Name</th>
                  <th className="py-4 px-4 font-bold tracking-wider uppercase text-[var(--text-muted)] text-[10px] border-b border-[var(--border-color)]">Exchange</th>
                  <th className="py-4 px-4 font-bold tracking-wider uppercase text-[var(--text-muted)] text-[10px] border-b border-[var(--border-color)]">Sector</th>
                  <th className="py-4 px-4 font-bold tracking-wider uppercase text-[var(--text-muted)] text-[10px] border-b border-[var(--border-color)] text-right">Market Price</th>
                  <th className="py-4 px-4 font-bold tracking-wider uppercase text-[var(--text-muted)] text-[10px] border-b border-[var(--border-color)] text-right">24H Change</th>
                  <th className="py-4 px-4 font-bold tracking-wider uppercase text-[var(--text-muted)] text-[10px] border-b border-[var(--border-color)] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {items.length > 0 ? (
                  items.map((item) => {
                    const quote = item.asset?.symbol ? liveQuotes[item.asset.symbol] : null;
                    const price = quote?.price || item.asset?.price || 100.0;
                    const chgPct = quote?.change_percent || 0.0;

                    return (
                      <tr key={item.id} className="hover:bg-background transition-colors">
                        <td className="py-4 px-4 font-extrabold text-[15px] text-[var(--secondary)] flex items-center gap-2 drop-shadow-[0_0_5px_rgba(76,139,255,0.4)]">
                          {item.asset?.symbol}
                        </td>
                        <td className="py-4 px-4 text-[var(--text-main)] font-heading uppercase tracking-wider">{item.asset?.company_name}</td>
                        <td className="py-4 px-4 text-[var(--text-muted)]">{item.asset?.exchange}</td>
                        <td className="py-4 px-4 text-[var(--text-muted)]">{item.asset?.sector}</td>
                        <td className="py-4 px-4 text-right font-extrabold text-[15px] text-[var(--text-main)]">
                          {formatAmount(price)}
                        </td>
                        <td className={`py-4 px-4 text-right font-bold ${chgPct >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'}`}>
                          {chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.asset_id)}
                            className="p-[8px] rounded-[6px] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all cursor-pointer"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-[60px] text-center text-[var(--text-muted)] font-mono text-[13px]">
                      No items in this watchlist. Click <span className="text-[var(--primary)] font-bold">Add Symbol</span> to start tracking assets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Watchlist Modal */}
      {isCreateWlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="inst-card w-full max-w-md p-[32px] space-y-[24px]">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px]">
              <h3 className="text-[16px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] m-0">Create New Watchlist</h3>
              <button onClick={() => setIsCreateWlModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWatchlist} className="space-y-[16px]">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Watchlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tech Leaders, Dividend Stocks"
                  value={newWlName}
                  onChange={(e) => setNewWlName(e.target.value)}
                  className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[16px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. High growth tech portfolio candidates"
                  value={newWlDesc}
                  onChange={(e) => setNewWlDesc(e.target.value)}
                  className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[16px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-[12px] pt-[16px] border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsCreateWlModalOpen(false)} className="px-[16px] py-[10px] bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] rounded-[6px] transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-[16px] py-[10px] bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] font-bold font-mono text-[11px] uppercase tracking-wider rounded-[6px] transition-all shadow-[0_0_15px_rgba(255,90,31,0.3)] cursor-pointer">
                  Create Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Symbol Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="inst-card w-full max-w-md p-[32px] space-y-[24px]">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-[16px]">
              <h3 className="text-[16px] font-bold font-heading uppercase tracking-wider text-[var(--text-main)] m-0">Add Symbol to Watchlist</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-[16px]">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">Select Asset Symbol</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-background border border-[var(--border-color)] rounded-[8px] px-[16px] py-[12px] text-[13px] font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--secondary)] transition-colors cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.symbol} — {a.company_name} ({a.exchange})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-[12px] pt-[16px] border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-[16px] py-[10px] bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--text-muted)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-main)] rounded-[6px] transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-[16px] py-[10px] bg-[var(--primary)] hover:bg-[#ff7a45] text-[#050608] font-bold font-mono text-[11px] uppercase tracking-wider rounded-[6px] transition-all shadow-[0_0_15px_rgba(255,90,31,0.3)] cursor-pointer">
                  Add to Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
