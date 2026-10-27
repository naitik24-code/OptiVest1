import { apiClient } from './apiClient';
import { ResponseEnvelope } from '../types/api';
import {
  Portfolio,
  Asset,
  Watchlist,
  Transaction,
  CreatePortfolioPayload,
  AddHoldingPayload,
  RecordTransactionPayload,
} from '../types/portfolio';
import axios from 'axios';

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error?.message) {
      return err.response.data.error.message;
    }
    if (err.response?.data?.detail) {
      return err.response.data.detail;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMsg;
}

export const portfolioService = {
  // --- Portfolios ---
  async getPortfolios(): Promise<Portfolio[]> {
    try {
      const res = await apiClient.get<ResponseEnvelope<Portfolio[]>>('/portfolios');
      return res.data.data || [];
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch portfolios'));
    }
  },

  async getPortfolioById(id: string): Promise<Portfolio> {
    try {
      const res = await apiClient.get<ResponseEnvelope<Portfolio>>(`/portfolios/${id}`);
      if (!res.data.data) throw new Error('Portfolio not found');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch portfolio'));
    }
  },

  async createPortfolio(payload: CreatePortfolioPayload): Promise<Portfolio> {
    try {
      const res = await apiClient.post<ResponseEnvelope<Portfolio>>('/portfolios', payload);
      if (!res.data.data) throw new Error('Failed to create portfolio');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to create portfolio'));
    }
  },

  async updatePortfolio(id: string, payload: Partial<CreatePortfolioPayload>): Promise<Portfolio> {
    try {
      const res = await apiClient.put<ResponseEnvelope<Portfolio>>(`/portfolios/${id}`, payload);
      if (!res.data.data) throw new Error('Failed to update portfolio');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to update portfolio'));
    }
  },

  async deletePortfolio(id: string): Promise<void> {
    try {
      await apiClient.delete(`/portfolios/${id}`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to delete portfolio'));
    }
  },

  // --- Holdings ---
  async addHolding(payload: AddHoldingPayload): Promise<Portfolio> {
    try {
      const res = await apiClient.post<ResponseEnvelope<Portfolio>>('/portfolios/holdings', payload);
      if (!res.data.data) throw new Error('Failed to add holding');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to add holding'));
    }
  },

  async deleteHolding(holdingId: string): Promise<Portfolio> {
    try {
      const res = await apiClient.delete<ResponseEnvelope<Portfolio>>(`/portfolios/holdings/${holdingId}`);
      if (!res.data.data) throw new Error('Failed to delete holding');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to delete holding'));
    }
  },

  // --- Transactions ---
  async recordTransaction(payload: RecordTransactionPayload): Promise<Transaction> {
    try {
      const res = await apiClient.post<ResponseEnvelope<Transaction>>('/portfolios/transactions', payload);
      if (!res.data.data) throw new Error('Failed to record transaction');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to record transaction'));
    }
  },

  async getPortfolioTransactions(portfolioId: string, transactionType?: string): Promise<Transaction[]> {
    try {
      const query = transactionType ? `?transaction_type=${transactionType}` : '';
      const res = await apiClient.get<ResponseEnvelope<Transaction[]>>(`/portfolios/${portfolioId}/transactions${query}`);
      return res.data.data || [];
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch portfolio transactions'));
    }
  },

  // --- Asset Master ---
  async getAssets(): Promise<Asset[]> {
    try {
      const res = await apiClient.get<ResponseEnvelope<Asset[]>>('/assets');
      return res.data.data || [];
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch assets'));
    }
  },

  async searchAssets(query: string): Promise<Asset[]> {
    try {
      const res = await apiClient.get<ResponseEnvelope<Asset[]>>(`/assets/search?q=${encodeURIComponent(query)}`);
      return res.data.data || [];
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to search assets'));
    }
  },

  // --- Watchlists ---
  async getWatchlists(): Promise<Watchlist[]> {
    try {
      const res = await apiClient.get<ResponseEnvelope<Watchlist[]>>('/watchlists');
      return res.data.data || [];
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch watchlists'));
    }
  },

  async createWatchlist(name: string, description?: string): Promise<Watchlist> {
    try {
      const res = await apiClient.post<ResponseEnvelope<Watchlist>>('/watchlists', { name, description });
      if (!res.data.data) throw new Error('Failed to create watchlist');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to create watchlist'));
    }
  },

  async deleteWatchlist(watchlistId: string): Promise<void> {
    try {
      await apiClient.delete(`/watchlists/${watchlistId}`);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to delete watchlist'));
    }
  },

  async addWatchlistItem(watchlistId: string, assetId: string): Promise<Watchlist> {
    try {
      const res = await apiClient.post<ResponseEnvelope<Watchlist>>(`/watchlists/${watchlistId}/items`, { asset_id: assetId });
      if (!res.data.data) throw new Error('Failed to add to watchlist');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to add item to watchlist'));
    }
  },

  async removeWatchlistItem(watchlistId: string, assetId: string): Promise<Watchlist> {
    try {
      const res = await apiClient.delete<ResponseEnvelope<Watchlist>>(`/watchlists/${watchlistId}/items/${assetId}`);
      if (!res.data.data) throw new Error('Failed to remove from watchlist');
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to remove item from watchlist'));
    }
  },

  // --- Explainable replacement workflow ---
  async getReplacementOptions(portfolioId: string, targetHolding: string, limit = 5): Promise<any> {
    try {
      const res = await apiClient.get(`/apde/replacement-options/${portfolioId}`, {
        params: { target_holding: targetHolding, limit },
      });
      return res.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch replacement options'));
    }
  },
};

