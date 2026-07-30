export interface Asset {
  id: string;
  symbol: string;
  company_name: string;
  exchange: string;
  sector: string;
  industry: string;
  asset_type: string;
  currency: string;
  country: string;
  price: number;
  is_active: boolean;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  asset_id: string;
  quantity: number;
  average_buy_price: number;
  book_value: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  created_at: string;
  updated_at: string;
  asset?: Asset;
}

export interface Transaction {
  id: string;
  portfolio_id: string;
  asset_id: string;
  transaction_type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE';
  quantity: number;
  price: number;
  fees: number;
  total_amount: number;
  notes?: string;
  timestamp: string;
  created_at: string;
  asset?: Asset;
}

export interface PortfolioMetrics {
  portfolio_value: number;
  total_invested: number;
  book_value: number;
  market_value: number;
  profit_loss: number;
  profit_loss_pct: number;
  cash_balance: number;
  holdings_count: number;
  assets_count: number;
  portfolio_return_pct: number;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  currency: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  metrics?: PortfolioMetrics;
  holdings: Holding[];
  recent_transactions: Transaction[];
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  asset_id: string;
  added_at: string;
  asset?: Asset;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  items: WatchlistItem[];
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
  currency?: string;
  is_default?: boolean;
}

export interface AddHoldingPayload {
  portfolio_id: string;
  asset_id: string;
  quantity: number;
  average_buy_price: number;
}

export interface RecordTransactionPayload {
  portfolio_id: string;
  asset_id: string;
  transaction_type: 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE';
  quantity: number;
  price: number;
  fees?: number;
  notes?: string;
}
