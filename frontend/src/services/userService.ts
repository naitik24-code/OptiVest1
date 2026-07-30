import { apiClient } from './apiClient';
import { ResponseEnvelope } from '../types/api';
import { User, UserProfile, UserProfileUpdatePayload } from '../types/user';
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

export const userService = {
  async getMe(): Promise<User> {
    try {
      const res = await apiClient.get<ResponseEnvelope<User>>('/users/me');
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Failed to fetch user data');
      }
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch user data'));
    }
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const res = await apiClient.get<ResponseEnvelope<UserProfile>>('/users/profile');
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Failed to fetch user profile');
      }
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to fetch user profile'));
    }
  },

  async updateProfile(payload: UserProfileUpdatePayload): Promise<UserProfile> {
    try {
      const res = await apiClient.put<ResponseEnvelope<UserProfile>>('/users/profile', payload);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message || 'Failed to update profile');
      }
      return res.data.data;
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to update profile'));
    }
  },
};
