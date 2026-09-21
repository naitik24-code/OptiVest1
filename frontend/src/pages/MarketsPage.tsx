import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import {
  marketService,

  AssetSearchResult,
  MarketQuote,
  HistoricalPricePoint,
  CompanyProfile,
  TechnicalIndicators,
  MarketOverview
} from '../services/marketService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InteractiveChart, ChartDataPoint } from '../components/ui/InteractiveChart';
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Globe,
  Building,
  Activity,
  Zap,
  Info
} from 'lucide-react';

export const MarketsPage: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetSearchResult | null>(null);
  const [activeQuote, setActiveQuote] = useState<MarketQuote | null>(null);
  const [historyData, setHistoryData] = useState<HistoricalPricePoint[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1M');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Expanded Modules State
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'profile' | 'indicators'>('chart');
  const [sidebarTab, setSidebarTab] = useState<'all' | 'gainers' | 'losers' | 'active'>('all');

  const isInitialLoaded = useRef(false);

  // Initial load
  useEffect(() => {
    loadSearchResults('', true);
    loadMarketOverview();
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (isInitialLoaded.current) {
      const timer = setTimeout(() => {
        loadSearchResults(searchTerm, false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const loadMarketOverview = async () => {
    const ov = await marketService.getMarketOverview();
    if (ov) setMarketOverview(ov);
  };

  const loadSearchResults = async (query: string, shouldAutoSelect: boolean = false) => {
    try {
      const list = await marketService.searchAssets(query);
      const safeList = Array.isArray(list) ? list : [];
      setSearchResults(safeList);
      if (safeList.length > 0 && (shouldAutoSelect || !isInitialLoaded.current)) {
        isInitialLoaded.current = true;
        handleSelectAsset(safeList[0]);
      }
    } catch (err) {
      console.error('Failed to load asset search results:', err);
      setSearchResults([]);
    }
  };

  const handleSelectAsset = async (asset: AssetSearchResult) => {
    setSelectedAsset(asset);
    setActiveQuote(null);
    setCompanyProfile(null);
    setIndicators(null);
    try {
      const [quote, prof, ind] = await Promise.all([
        marketService.getLiveQuote(asset.symbol),
        marketService.getCompanyProfile(asset.symbol),
        marketService.getTechnicalIndicators(asset.symbol)
      ]);
      setActiveQuote(quote);
      setCompanyProfile(prof);
      setIndicators(ind);
      await loadHistoricalChart(asset.symbol, activeTimeframe);
    } catch (err) {
      console.error(`Failed to load details for ${asset.symbol}:`, err);
    }
  };

  const loadHistoricalChart = async (symbol: string, timeframe: string) => {
    try {
      const res = await marketService.getHistoricalPrices(symbol, timeframe);
      setHistoryData(res.data || []);
    } catch (err) {
      console.error(`Failed to load history for ${symbol}:`, err);
      setHistoryData([]);
    }
  };

  const handleTimeframeChange = async (tf: string) => {
    setActiveTimeframe(tf);
    if (selectedAsset) {
      await loadHistoricalChart(selectedAsset.symbol, tf);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Synchronizing live market prices across global assets...');
    try {
      const status = await marketService.triggerSync(undefined, 'LIVE_PRICES');
      setSyncStatusMsg(`Sync Completed! Processed ${status.symbols_processed} tickers successfully.`);
      await loadMarketOverview();
      if (selectedAsset) {
        handleSelectAsset(selectedAsset);
      }
    } catch (err) {
      setSyncStatusMsg('Market sync error occurred.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // Sidebar list selector based on active sub-tab
  const getSidebarList = (): AssetSearchResult[] => {
    if (!marketOverview) return searchResults;
    if (sidebarTab === 'gainers') return marketOverview.top_gainers;
    if (sidebarTab === 'losers') return marketOverview.top_losers;
    if (sidebarTab === 'active') return marketOverview.most_active;
    return searchResults;
  };

  // Build chart data points from history
  const buildChartPoints = (): ChartDataPoint[] => {
    if (!historyData || historyData.length === 0) return [];
    return historyData.map((d, i) => ({
      date: d.timestamp
        ? new Date(d.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : `T-${historyData.length - i}`,
      price: d.close || 100,
    }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Module 10: Top Market Indices & Sector Overview Bar */}
      {marketOverview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {marketOverview.indices.map((idx) => (
            <Card key={idx.symbol} className="p-3 inst-card border border-[var(--border-color)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-muted)] truncate">{idx.name}</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{idx.symbol}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold font-mono text-[var(--text-main)]">
                  {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${idx.change_percent >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {idx.change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {idx.change_percent >= 0 ? '+' : ''}{idx.change_percent.toFixed(2)}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading tracking-tight text-[var(--text-main)]">
            Market Intelligence &amp; Global Data Engine
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Real-time market quotes, OHLCV history, technical indicators, and sector breakdown.
          </p>
        </div>

        <Button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          variant="secondary"
          className="text-xs px-3 py-2 flex items-center gap-1.5 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing Market...' : 'Sync Live Prices'}</span>
        </Button>
      </div>

      {syncStatusMsg && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs font-mono text-primary">
          {syncStatusMsg}
        </div>
      )}

      {/* Main Grid: Sidebar Tickers + Right Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Asset Search & Selection */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="p-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search symbol, company, exchange..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-none focus:border-primary"
              />
            </div>

            {/* Sub-tabs: All | Top Gainers | Top Losers | Most Active */}
            <div className="flex border-b border-[var(--border-color)] text-xs font-medium text-[var(--text-muted)]">
              {(['all', 'gainers', 'losers', 'active'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`pb-2 px-2 capitalize transition-colors ${
                    sidebarTab === tab
                      ? 'border-b-2 border-primary text-primary font-bold'
                      : 'hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab === 'all' ? 'All Assets' : tab}
                </button>
              ))}
            </div>

            {/* Asset List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {getSidebarList().map((a) => {
                const isSelected = selectedAsset?.symbol === a.symbol;
                return (
                  <div
                    key={a.symbol}
                    onClick={() => handleSelectAsset(a)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs text-primary">{a.symbol}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                          a.change_percent >= 0
                            ? 'bg-[#16A34A]/15 text-[#16A34A]'
                            : 'bg-[#DC2626]/15 text-[#DC2626]'
                        }`}>
                          {a.change_percent >= 0 ? '+' : ''}{a.change_percent.toFixed(2)}%
                        </span>
                        <span className="font-mono font-bold text-xs text-[var(--text-main)]">
                          {formatAmount(a.price)}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[var(--text-main)] truncate mt-0.5">{a.company_name}</div>
                    <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono mt-1 pt-1 border-t border-[var(--border-color)]/50">
                      <span>{a.exchange} • {a.sector}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right 2 Columns: Google Finance–style Chart */}
        <div className="space-y-5 lg:col-span-2">
          {selectedAsset && activeQuote && (
            <>
              {/* ── Google Finance–style all-in-one chart card ── */}
              {activeTab === 'chart' && (
                <InteractiveChart
                  companyName={selectedAsset.company_name}
                  ticker={`${activeQuote.exchange}:${activeQuote.symbol}`}
                  data={buildChartPoints()}
                  timeframes={['1M', '3M', '6M', '1Y', '5Y', 'MAX']}
                  activeTimeframe={activeTimeframe}
                  onTimeframeChange={handleTimeframeChange}
                  height={220}
                  showPercentageAxis={true}
                  stats={{
                    open:      activeQuote.open_price,
                    high:      activeQuote.day_high,
                    low:       activeQuote.day_low,
                    prevClose: activeQuote.price - activeQuote.change_amount,
                    marketCap: activeQuote.market_cap
                      ? activeQuote.market_cap >= 1e12
                        ? `$${(activeQuote.market_cap / 1e12).toFixed(2)}T`
                        : `$${(activeQuote.market_cap / 1e9).toFixed(2)}B`
                      : '—',
                    peRatio: companyProfile?.pe_ratio ?? '—',
                    volume:  activeQuote.volume,
                    week52High: (activeQuote as any).week_52_high,
                    week52Low:  (activeQuote as any).week_52_low,
                  }}
                />
              )}

              {/* ── Page-level tabs (Chart / Profile / Indicators) ── */}
              <div className="flex border-b border-[var(--border-color)] space-x-6 text-sm font-semibold">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`pb-3 flex items-center gap-2 transition-colors ${
                    activeTab === 'chart' ? 'border-b-2 border-primary text-primary' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Chart</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-3 flex items-center gap-2 transition-colors ${
                    activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Company Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('indicators')}
                  className={`pb-3 flex items-center gap-2 transition-colors ${
                    activeTab === 'indicators' ? 'border-b-2 border-primary text-primary' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Technical Indicators</span>
                </button>
              </div>



              {/* Tab 2: Module 9 Company Profile */}
              {activeTab === 'profile' && companyProfile && (
                <Card className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)] mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span>About {companyProfile.company_name}</span>
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{companyProfile.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono pt-4 border-t border-[var(--border-color)]">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase">CEO</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.ceo}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase">Website</span>
                      <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Visit Site</span>
                      </a>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase">Employees</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.employees?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase">P/E Ratio</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.pe_ratio}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase">Dividend Yield</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.dividend_yield}%</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase">Country</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.country}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Tab 3: Module 8 Technical Indicators */}
              {activeTab === 'indicators' && indicators && (
                <Card className="space-y-6">
                  {/* Indicator Overview Banner */}
                  <div className="flex items-center justify-between p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)] text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#F59E0B]" />
                      <span>Trend Signal: <strong className={indicators.short_term_trend === 'BULLISH' ? 'text-[#16A34A]' : 'text-[#DC2626]'}>{indicators.short_term_trend}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Golden Cross: </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${indicators.golden_cross_signal ? 'bg-[#16A34A]/20 text-[#16A34A]' : 'bg-[var(--border-color)] text-[var(--text-muted)]'}`}>
                        {indicators.golden_cross_signal ? 'BULLISH (SMA 50 > 200)' : 'NEUTRAL / NONE'}
                      </span>
                    </div>
                  </div>

                  {/* Indicator Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)] text-[10px] block uppercase">RSI (14)</span>
                      <span className="text-base font-bold text-[var(--text-main)]">{indicators.rsi_14}</span>
                      <span className={`text-[10px] block mt-0.5 ${indicators.rsi_14 > 70 ? 'text-[#DC2626]' : indicators.rsi_14 < 30 ? 'text-[#16A34A]' : 'text-[var(--text-muted)]'}`}>
                        {indicators.rsi_14 > 70 ? 'Overbought (>70)' : indicators.rsi_14 < 30 ? 'Oversold (<30)' : 'Neutral (30-70)'}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)] text-[10px] block uppercase">MACD Line</span>
                      <span className="text-base font-bold text-[var(--text-main)]">{indicators.macd}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">Signal: {indicators.macd_signal}</span>
                    </div>

                    <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)] text-[10px] block uppercase">SMA 20 / 50 / 200</span>
                      <span className="text-xs font-bold text-[var(--text-main)] block">${indicators.sma_20} / ${indicators.sma_50}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">SMA 200: ${indicators.sma_200}</span>
                    </div>

                    <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
                      <span className="text-[var(--text-muted)] text-[10px] block uppercase">Bollinger Bands</span>
                      <span className="text-xs font-bold text-[var(--text-main)] block">${indicators.bollinger_lower} - ${indicators.bollinger_upper}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">Mid: ${indicators.bollinger_middle}</span>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketsPage;
