import { apiClient } from './apiClient';
import { ResponseEnvelope } from '../types/api';
import { TokenData, UserLoginPayload, UserRegisterPayload } from '../types/auth';
import { User } from '../types/user';
import axios from 'axios';

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error?.message) {
      return err.response.data.error.message;
    }
    if (err.response?.data?.detail) {
      return err.response.data.detail;
    }
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
      return 'Unable to connect to backend server. Please ensure FastAPI is running on port 8000.';
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return defaultMsg;
}

export const authService = {
  async register(payload: UserRegisterPayload): Promise<User> {
    try {
      const res = await apiClient.post<ResponseEnvelope<User>>('/auth/register', payload);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Registration failed');
      }
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Registration failed'));
    }
  },

  async login(payload: UserLoginPayload): Promise<TokenData> {
    try {
      const res = await apiClient.post<ResponseEnvelope<TokenData>>('/auth/login', payload);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Authentication failed');
      }
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Authentication failed'));
    }
  },

  async refreshToken(refreshToken: string): Promise<TokenData> {
    try {
      const res = await apiClient.post<ResponseEnvelope<TokenData>>('/auth/refresh', {
        refresh_token: refreshToken,
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Token refresh failed');
      }
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Token refresh failed'));
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};
