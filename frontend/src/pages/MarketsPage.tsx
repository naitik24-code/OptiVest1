import React, { useState, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { Asset } from '../types/portfolio';
import { Card } from '../components/ui/Card';
import { TrendingUp, Search } from 'lucide-react';

export const MarketsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const list = await portfolioService.getAssets();
        setAssets(list);
      } catch (err) {
        console.error('Failed to load asset master', err);
      }
    };
    fetchAssets();
  }, []);

  const indices = [
    { name: 'S&P 500', symbol: 'SPX', price: '5,088.80', change: '+24.60', pct: '+0.49%', up: true },
    { name: 'NASDAQ 100', symbol: 'NDX', price: '17,937.60', change: '+142.10', pct: '+0.80%', up: true },
    { name: 'NIFTY 50', symbol: 'NIFTY', price: '22,120.40', change: '+85.30', pct: '+0.39%', up: true },
    { name: 'BSE SENSEX', symbol: 'SENSEX', price: '72,830.15', change: '+210.50', pct: '+0.29%', up: true },
  ];

  const filteredAssets = assets.filter(
    (a) => a.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || a.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
          Master Asset Registry &amp; Global Markets
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Master registry of equities, ETFs, and market instruments available for portfolio allocation.
        </p>
      </div>

      {/* Global Indices Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {indices.map((idx) => (
          <Card key={idx.symbol}>
            <div className="flex justify-between items-center text-xs font-mono text-[var(--text-muted)]">
              <span>{idx.symbol}</span>
              <span className="font-bold text-[var(--text-main)]">{idx.name}</span>
            </div>
            <div className="text-xl font-mono font-bold text-[var(--text-main)] mt-1">{idx.price}</div>
            <div className="text-xs font-mono font-bold flex items-center gap-1 mt-1 text-[#16A34A]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{idx.change} ({idx.pct})</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Master Assets Registry Table */}
      <Card title="Master Asset Registry" subtitle="Verified Global &amp; Indian Equities">
        <div className="flex items-center justify-between gap-4 mb-4 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search symbol or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-main)] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--bg-main)] text-[var(--text-muted)] border-b border-[var(--border-color)]">
              <tr>
                <th className="p-3">SYMBOL</th>
                <th className="p-3">COMPANY NAME</th>
                <th className="p-3">EXCHANGE</th>
                <th className="p-3">SECTOR</th>
                <th className="p-3">COUNTRY</th>
                <th className="p-3 text-right">MARKET PRICE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredAssets.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                  <td className="p-3 font-bold text-[#2563EB]">{a.symbol}</td>
                  <td className="p-3 text-[var(--text-main)] font-sans">{a.company_name}</td>
                  <td className="p-3 text-[var(--text-muted)]">{a.exchange}</td>
                  <td className="p-3 text-[var(--text-muted)]">{a.sector}</td>
                  <td className="p-3 text-[var(--text-muted)]">{a.country}</td>
                  <td className="p-3 text-right font-bold text-[var(--text-main)]">
                    {a.currency === 'INR' ? '₹' : '$'}{a.price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
