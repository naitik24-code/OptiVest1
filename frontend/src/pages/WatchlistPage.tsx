import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { portfolioService } from '../services/portfolioService';
import { marketService, MarketQuote } from '../services/marketService';
import { Watchlist, Asset } from '../types/portfolio';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bookmark, Trash2, Plus, X } from 'lucide-react';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Custom Asset Watchlists
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Monitor target equity symbols, price points, and custom watchlist tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsCreateWlModalOpen(true)} className="flex items-center gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>New Watchlist</span>
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} disabled={!activeWatchlist} className="flex items-center gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Symbol</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs font-mono text-[#F87171]">
          {errorMsg}
        </div>
      )}

      {/* Multi-Watchlist Selector Bar */}
      {watchlists.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Active Watchlist:</label>
            <select
              value={activeWatchlist?.id || ''}
              onChange={(e) => {
                const found = watchlists.find(w => w.id === e.target.value);
                if (found) setActiveWatchlist(found);
              }}
              className="px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
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
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[#DC2626] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Watchlist</span>
            </button>
          )}
        </div>
      )}

      <Card title={`Tracked Instruments (${activeWatchlist?.name || 'Watchlist'})`} subtitle="Personalized Intelligence Targets">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
            Loading watchlist data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="p-3">SYMBOL</th>
                  <th className="p-3">COMPANY NAME</th>
                  <th className="p-3">EXCHANGE</th>
                  <th className="p-3">SECTOR</th>
                  <th className="p-3 text-right">MARKET PRICE</th>
                  <th className="p-3 text-right">24H CHANGE</th>
                  <th className="p-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {items.length > 0 ? (
                  items.map((item) => {
                    const quote = item.asset?.symbol ? liveQuotes[item.asset.symbol] : null;
                    const price = quote?.price || item.asset?.price || 100.0;
                    const chgPct = quote?.change_percent || 0.0;

                    return (
                      <tr key={item.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                        <td className="p-3 font-bold text-[#2563EB] flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{item.asset?.symbol}</span>
                        </td>
                        <td className="p-3 text-[var(--text-main)] font-sans">{item.asset?.company_name}</td>
                        <td className="p-3 text-[var(--text-muted)]">{item.asset?.exchange}</td>
                        <td className="p-3 text-[var(--text-muted)]">{item.asset?.sector}</td>
                        <td className="p-3 text-right font-bold text-[var(--text-main)]">
                          {formatAmount(price)}
                        </td>

                        <td className={`p-3 text-right font-bold ${chgPct >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                          {chgPct >= 0 ? '+' : ''}{chgPct.toFixed(2)}%
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.asset_id)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[#DC2626] transition-colors"
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
                    <td colSpan={6} className="p-6 text-center text-[var(--text-muted)] font-sans">
                      No items in this watchlist. Click <strong>Add Symbol</strong> to start tracking assets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Watchlist Modal */}
      {isCreateWlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-main)]">Create New Watchlist</h3>
              <button onClick={() => setIsCreateWlModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWatchlist} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Watchlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tech Leaders, Dividend Stocks"
                  value={newWlName}
                  onChange={(e) => setNewWlName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[var(--text-muted)] font-bold">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. High growth tech portfolio candidates"
                  value={newWlDesc}
                  onChange={(e) => setNewWlDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsCreateWlModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Watchlist
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Symbol Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-bold font-heading text-[var(--text-main)]">Add Symbol to Watchlist</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[var(--text-muted)]">Select Asset Symbol</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.symbol} — {a.company_name} ({a.exchange})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add to Watchlist
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

