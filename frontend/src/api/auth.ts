import apiClient from './client';
import type { AuthResponse, Admin, ApiResponse } from '../types';

export const authApi = {
  login: async (telegramId: number): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { telegramId });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<ApiResponse<{ admin: Admin }>> => {
    const response = await apiClient.get<ApiResponse<{ admin: Admin }>>('/auth/me');
    return response.data;
  },
};
