import { apiClient } from './apiClient';
import { ResponseEnvelope } from '../types/api';

export interface MarketQuote {
  symbol: string;
  price: number;
  previous_close: number;
  change_amount: number;
  change_percent: number;
  open_price: number;
  day_high: number;
  day_low: number;
  volume: number;
  currency: string;
  exchange: string;
  market_cap?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  pe_ratio?: number;
  timestamp: string;
}

export interface HistoricalPricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adj_close: number;
  volume: number;
}

export interface HistoricalPriceResponse {
  symbol: string;
  timeframe: string;
  count: number;
  data: HistoricalPricePoint[];
}

export interface AssetSearchResult {
  id?: string;
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  industry: string;
  asset_type: string;
  currency: string;
  country: string;
  price: number;
  change_percent: number;
  market_cap?: number;
}

export interface MarketSyncStatus {
  id: string;
  sync_type: string;
  status: string;
  symbols_processed: number;
  symbols_failed: number;
  details?: string;
  created_at: string;
  completed_at?: string;
}

export interface CompanyProfile {
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
  currency: string;
  market_cap: number;
  pe_ratio: number;
  dividend_yield: number;
  description?: string;
  website?: string;
  ceo?: string;
  employees?: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
}

export interface TechnicalIndicators {
  symbol: string;
  current_price: number;
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_12: number;
  ema_26: number;
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  bollinger_upper: number;
  bollinger_middle: number;
  bollinger_lower: number;
  avg_volume_20: number;
  price_change_pct_24h: number;
  fifty_two_week_position_pct: number;
  golden_cross_signal: boolean;
  short_term_trend: string;
}

export interface MarketIndexQuote {
  name: string;
  symbol: string;
  value: number;
  change: number;
  change_percent: number;
}

export interface SectorPerformanceItem {
  sector: string;
  change_percent: number;
  asset_count: number;
}

export interface MarketOverview {
  indices: MarketIndexQuote[];
  top_gainers: AssetSearchResult[];
  top_losers: AssetSearchResult[];
  most_active: AssetSearchResult[];
  sector_performance: SectorPerformanceItem[];
  total_tracked_assets: number;
}

export interface FundamentalQualityAssessment {
  status: string;
  score: number;
  quality: 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT_DATA';
  freshness: string;
  reporting_date?: string;
  metrics: Record<string, number>;
  dimension_scores: Record<string, { earned: number; max: number }>;
  reasons: string[];
  warnings: string[];
}

export interface AssetFundamentalsData {
  asset_id: string;
  symbol: string;
  company_name?: string;
  data_source: string;
  quality_assessment: FundamentalQualityAssessment;
  raw_statement_metrics?: Record<string, any>;
}

class MarketService {
  async searchAssets(query: string): Promise<AssetSearchResult[]> {
    try {
      const response = await apiClient.get<ResponseEnvelope<AssetSearchResult[]>>(`/market/search`, {
        params: { q: query },
      });
      return response.data.data || [];
    } catch (err) {
      console.error('Failed to search market assets:', err);
      return [];
    }
  }

  async getLiveQuote(symbol: string): Promise<MarketQuote> {
    const response = await apiClient.get<ResponseEnvelope<MarketQuote>>(`/market/quote/${symbol}`);
    if (!response.data.data) {
      throw new Error(`Quote not available for ${symbol}`);
    }
    return response.data.data;
  }

  async getHistoricalPrices(symbol: string, timeframe: string = '1M'): Promise<HistoricalPriceResponse> {
    const response = await apiClient.get<ResponseEnvelope<HistoricalPriceResponse>>(`/market/history/${symbol}`, {
      params: { timeframe },
    });
    return response.data.data || { symbol, timeframe, count: 0, data: [] };
  }

  async triggerSync(symbols?: string[], syncType: string = 'LIVE_PRICES'): Promise<MarketSyncStatus> {
    const response = await apiClient.post<ResponseEnvelope<MarketSyncStatus>>(`/market/sync`, {
      symbols,
      sync_type: syncType,
    });
    if (!response.data.data) {
      throw new Error('Failed to trigger market sync');
    }
    return response.data.data;
  }

  async getSyncStatus(limit: number = 10): Promise<MarketSyncStatus[]> {
    const response = await apiClient.get<ResponseEnvelope<MarketSyncStatus[]>>(`/market/sync/status`, {
      params: { limit },
    });
    return response.data.data || [];
  }

  async refreshQuote(symbol: string): Promise<MarketQuote> {
    const response = await apiClient.post<ResponseEnvelope<MarketQuote>>(`/market/refresh/${symbol}`);
    if (!response.data.data) {
      throw new Error(`Failed to refresh quote for ${symbol}`);
    }
    return response.data.data;
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    try {
      const response = await apiClient.get<ResponseEnvelope<CompanyProfile>>(`/market/profile/${symbol}`);
      return response.data.data || null;
    } catch (err) {
      console.error(`Failed to fetch company profile for ${symbol}:`, err);
      return null;
    }
  }

  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators | null> {
    try {
      const response = await apiClient.get<ResponseEnvelope<TechnicalIndicators>>(`/market/indicators/${symbol}`);
      return response.data.data || null;
    } catch (err) {
      console.error(`Failed to fetch technical indicators for ${symbol}:`, err);
      return null;
    }
  }

  async getMarketOverview(): Promise<MarketOverview | null> {
    try {
      const response = await apiClient.get<ResponseEnvelope<MarketOverview>>(`/market/overview`);
      return response.data.data || null;
    } catch (err) {
      console.error('Failed to fetch market overview:', err);
      return null;
    }
  }

  async getAssetFundamentals(assetId: string): Promise<AssetFundamentalsData | null> {
    try {
      const response = await apiClient.get<ResponseEnvelope<AssetFundamentalsData>>(`/assets/${assetId}/fundamentals`);
      return response.data.data || null;
    } catch (err) {
      console.error(`Failed to fetch fundamentals for asset ${assetId}:`, err);
      return null;
    }
  }
}

export const marketService = new MarketService();
export default marketService;

