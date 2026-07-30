import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { Watchlist, Asset } from '../types/portfolio';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bookmark, Trash2, Plus, X } from 'lucide-react';

export const WatchlistPage: React.FC = () => {
  const [activeWatchlist, setActiveWatchlist] = useState<Watchlist | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [wls, assetList] = await Promise.all([
        portfolioService.getWatchlists(),
        portfolioService.getAssets()
      ]);
      setAssets(assetList);
      if (assetList.length > 0) setSelectedAssetId(assetList[0].id);
      if (wls.length > 0) setActiveWatchlist(wls[0]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load watchlists');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWatchlist || !selectedAssetId) return;
    try {
      const updatedWl = await portfolioService.addWatchlistItem(activeWatchlist.id, selectedAssetId);
      setActiveWatchlist(updatedWl);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRemoveItem = async (assetId: string) => {
    if (!activeWatchlist) return;
    try {
      const updatedWl = await portfolioService.removeWatchlistItem(activeWatchlist.id, assetId);
      setActiveWatchlist(updatedWl);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const items = activeWatchlist?.items || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Custom Asset Watchlist
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Monitor target equity symbols, price points, and custom watchlist tracking.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Add Symbol to Watchlist</span>
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs font-mono text-[#F87171]">
          {errorMsg}
        </div>
      )}

      <Card title={`Tracked Instruments (${activeWatchlist?.name || 'Default Watchlist'})`} subtitle="Personalized Intelligence Targets">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)]">
              <tr>
                <th className="p-3">SYMBOL</th>
                <th className="p-3">COMPANY NAME</th>
                <th className="p-3">EXCHANGE</th>
                <th className="p-3">SECTOR</th>
                <th className="p-3 text-right">MARKET PRICE</th>
                <th className="p-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="p-3 font-bold text-[#2563EB] flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{item.asset?.symbol}</span>
                    </td>
                    <td className="p-3 text-[var(--text-main)] font-sans">{item.asset?.company_name}</td>
                    <td className="p-3 text-[var(--text-muted)]">{item.asset?.exchange}</td>
                    <td className="p-3 text-[var(--text-muted)]">{item.asset?.sector}</td>
                    <td className="p-3 text-right font-bold text-[var(--text-main)]">
                      ${item.asset?.price ? item.asset.price.toFixed(2) : '100.00'}
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[var(--text-muted)] font-sans">
                    No items in this watchlist. Click <strong>Add Symbol to Watchlist</strong> to start tracking assets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
