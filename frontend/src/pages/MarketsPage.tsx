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

  useEffect(() => {
    loadSearchResults('', true);
    loadMarketOverview();
  }, []);

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

  const getSidebarList = (): AssetSearchResult[] => {
    if (!marketOverview) return searchResults;
    if (sidebarTab === 'gainers') return marketOverview.top_gainers;
    if (sidebarTab === 'losers') return marketOverview.top_losers;
    if (sidebarTab === 'active') return marketOverview.most_active;
    return searchResults;
  };

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
    <div className="max-w-[1120px] mx-auto space-y-6">
      {/* Top Indices Overview */}
      {marketOverview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {marketOverview.indices.map((idx) => (
            <div key={idx.symbol} className="inst-card p-[16px] group transition-all">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-mono truncate">{idx.name}</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">{idx.symbol}</span>
              </div>
              <div className="flex items-baseline justify-between mt-[10px]">
                <span className="text-[18px] font-extrabold font-mono text-[var(--text-main)]">
                  {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-[12px] font-mono font-bold flex items-center gap-1 tracking-wider ${idx.change_percent >= 0 ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.3)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.3)]'}`}>
                  {idx.change_percent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {idx.change_percent >= 0 ? '+' : ''}{idx.change_percent.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-[10px]">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[var(--secondary)] uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            <span>Global Market Data</span>
          </div>
          <h1 className="text-[26px] tracking-[-0.02em] m-0 font-heading font-bold text-[var(--text-main)]">
            Market Intelligence Engine
          </h1>
          <p className="text-[14px] text-[var(--text-muted)] m-0 mt-1 font-mono">
            Real-time market quotes, OHLCV history, technical indicators, and sector breakdown.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold bg-[var(--surface2)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-main)] transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Live Prices'}</span>
        </button>
      </div>

      {syncStatusMsg && (
        <div className="p-[14px] bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-[8px] text-[13px] font-mono text-[var(--primary)]">
          {syncStatusMsg}
        </div>
      )}

      {/* Main Grid: Sidebar Tickers + Right Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Column: Asset Search & Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="inst-card p-[20px] flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-[14px] top-[14px] text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search symbol, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-[38px] pr-[14px] py-[12px] text-[13px] font-mono bg-background border border-[var(--border-color)] rounded-[8px] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--text-muted)]/50"
              />
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-[var(--border-color)] text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 shrink-0 overflow-x-auto no-scrollbar">
              {(['all', 'gainers', 'losers', 'active'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`pb-[10px] px-3 whitespace-nowrap transition-colors cursor-pointer relative ${
                    sidebarTab === tab
                      ? 'text-[var(--primary)]'
                      : 'hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab === 'all' ? 'All Assets' : tab}
                  {sidebarTab === tab && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--primary)] shadow-[0_0_8px_rgba(255,90,31,0.5)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {getSidebarList().map((a) => {
                const isSelected = selectedAsset?.symbol === a.symbol;
                return (
                  <div
                    key={a.symbol}
                    onClick={() => handleSelectAsset(a)}
                    className={`p-[14px] rounded-[8px] border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[var(--primary)]/10 border-[var(--primary)] shadow-[0_0_15px_rgba(255,90,31,0.1)]'
                        : 'bg-background border-[var(--border-color)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-[14px] text-[var(--primary)] drop-shadow-sm">{a.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] border flex items-center tracking-wider ${
                          a.change_percent >= 0
                            ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                            : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
                        }`}>
                          {a.change_percent >= 0 ? '+' : ''}{a.change_percent.toFixed(2)}%
                        </span>
                        <span className="font-mono font-bold text-[13px] text-[var(--text-main)]">
                          {formatAmount(a.price)}
                        </span>
                      </div>
                    </div>
                    <div className="text-[12px] font-heading font-bold text-[var(--text-main)] truncate mt-[6px]">{a.company_name}</div>
                    <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-[10px] pt-[8px] border-t border-[var(--border-color)]">
                      <span>{a.exchange} &bull; {a.sector}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAsset && activeQuote && (
            <>
              {/* Page-level tabs (Chart / Profile / Indicators) */}
              <div className="flex border-b border-[var(--border-color)] space-x-2 text-[12px] font-mono font-bold uppercase tracking-wider overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`pb-[12px] px-4 flex items-center gap-2 transition-colors cursor-pointer relative ${
                    activeTab === 'chart' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Chart</span>
                  {activeTab === 'chart' && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--primary)] shadow-[0_0_8px_rgba(255,90,31,0.5)]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-[12px] px-4 flex items-center gap-2 transition-colors cursor-pointer relative ${
                    activeTab === 'profile' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Company Profile</span>
                  {activeTab === 'profile' && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--primary)] shadow-[0_0_8px_rgba(255,90,31,0.5)]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('indicators')}
                  className={`pb-[12px] px-4 flex items-center gap-2 transition-colors cursor-pointer relative ${
                    activeTab === 'indicators' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Technical Indicators</span>
                  {activeTab === 'indicators' && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--primary)] shadow-[0_0_8px_rgba(255,90,31,0.5)]" />
                  )}
                </button>
              </div>

              {/* Tab 1: Chart */}
              {activeTab === 'chart' && (
                <InteractiveChart
                  companyName={selectedAsset.company_name}
                  ticker={`${activeQuote.exchange}:${activeQuote.symbol}`}
                  data={buildChartPoints()}
                  timeframes={['1M', '3M', '6M', '1Y', '5Y', 'MAX']}
                  activeTimeframe={activeTimeframe}
                  onTimeframeChange={handleTimeframeChange}
                  height={320}
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

              {/* Tab 2: Profile */}
              {activeTab === 'profile' && companyProfile && (
                <div className="inst-card p-[24px]">
                  <div className="mb-6">
                    <h3 className="text-[16px] font-bold font-heading text-[var(--text-main)] mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-[var(--primary)]" />
                      <span>About {companyProfile.company_name}</span>
                    </h3>
                    <p className="text-[13px] font-mono text-[var(--text-muted)] leading-relaxed bg-background p-[16px] rounded-[8px] border border-[var(--border-color)]">{companyProfile.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-[16px] text-[13px] font-mono pt-[24px] border-t border-[var(--border-color)]">
                    <div className="bg-background border border-[var(--border-color)] p-[12px] rounded-[8px]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider mb-1">CEO</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.ceo}</span>
                    </div>
                    <div className="bg-background border border-[var(--border-color)] p-[12px] rounded-[8px]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider mb-1">Website</span>
                      <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Visit Site</span>
                      </a>
                    </div>
                    <div className="bg-background border border-[var(--border-color)] p-[12px] rounded-[8px]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider mb-1">Employees</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.employees?.toLocaleString()}</span>
                    </div>
                    <div className="bg-background border border-[var(--border-color)] p-[12px] rounded-[8px]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider mb-1">P/E Ratio</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.pe_ratio}</span>
                    </div>
                    <div className="bg-background border border-[var(--border-color)] p-[12px] rounded-[8px]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider mb-1">Dividend Yield</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.dividend_yield}%</span>
                    </div>
                    <div className="bg-background border border-[var(--border-color)] p-[12px] rounded-[8px]">
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider mb-1">Country</span>
                      <span className="font-bold text-[var(--text-main)]">{companyProfile.country}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Indicators */}
              {activeTab === 'indicators' && indicators && (
                <div className="inst-card p-[24px]">
                  {/* Indicator Overview Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-[16px] bg-background rounded-[8px] border border-[var(--border-color)] text-[13px] font-mono mb-[24px] gap-4">
                    <div className="flex items-center gap-2 text-[14px]">
                      <Zap className="w-5 h-5 text-[#eab308]" />
                      <span>Trend Signal: <strong className={indicators.short_term_trend === 'BULLISH' ? 'text-[var(--success)] drop-shadow-[0_0_5px_rgba(23,217,140,0.4)]' : 'text-[var(--danger)] drop-shadow-[0_0_5px_rgba(255,74,99,0.4)]'}>{indicators.short_term_trend}</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-muted)]">Golden Cross: </span>
                      <span className={`px-3 py-1 rounded-[6px] text-[11px] font-bold tracking-wider uppercase border ${indicators.golden_cross_signal ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30' : 'bg-[var(--border-color)] text-[var(--text-muted)] border-[var(--border-color)]'}`}>
                        {indicators.golden_cross_signal ? 'BULLISH (SMA 50 > 200)' : 'NEUTRAL / NONE'}
                      </span>
                    </div>
                  </div>

                  {/* Indicator Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] text-[13px] font-mono">
                    <div className="p-[16px] bg-background rounded-[8px] border border-[var(--border-color)] transition-colors hover:border-[var(--primary)]/30">
                      <span className="text-[var(--text-muted)] text-[10px] font-bold block uppercase tracking-wider mb-2">RSI (14)</span>
                      <span className="text-[20px] font-bold text-[var(--text-main)]">{indicators.rsi_14}</span>
                      <span className={`text-[11px] font-bold block mt-1 ${indicators.rsi_14 > 70 ? 'text-[var(--danger)]' : indicators.rsi_14 < 30 ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                        {indicators.rsi_14 > 70 ? 'Overbought (>70)' : indicators.rsi_14 < 30 ? 'Oversold (<30)' : 'Neutral (30-70)'}
                      </span>
                    </div>

                    <div className="p-[16px] bg-background rounded-[8px] border border-[var(--border-color)] transition-colors hover:border-[var(--primary)]/30">
                      <span className="text-[var(--text-muted)] text-[10px] font-bold block uppercase tracking-wider mb-2">MACD Line</span>
                      <span className="text-[20px] font-bold text-[var(--text-main)]">{indicators.macd}</span>
                      <span className="text-[11px] font-bold text-[var(--text-muted)] block mt-1">Signal: {indicators.macd_signal}</span>
                    </div>

                    <div className="p-[16px] bg-background rounded-[8px] border border-[var(--border-color)] transition-colors hover:border-[var(--primary)]/30">
                      <span className="text-[var(--text-muted)] text-[10px] font-bold block uppercase tracking-wider mb-2">SMA 20 / 50 / 200</span>
                      <span className="text-[15px] font-bold text-[var(--text-main)] block">${indicators.sma_20} / ${indicators.sma_50}</span>
                      <span className="text-[11px] font-bold text-[var(--text-muted)] block mt-1">SMA 200: ${indicators.sma_200}</span>
                    </div>

                    <div className="p-[16px] bg-background rounded-[8px] border border-[var(--border-color)] transition-colors hover:border-[var(--primary)]/30">
                      <span className="text-[var(--text-muted)] text-[10px] font-bold block uppercase tracking-wider mb-2">Bollinger Bands</span>
                      <span className="text-[15px] font-bold text-[var(--text-main)] block">${indicators.bollinger_lower} - ${indicators.bollinger_upper}</span>
                      <span className="text-[11px] font-bold text-[var(--text-muted)] block mt-1">Mid: ${indicators.bollinger_middle}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketsPage;
