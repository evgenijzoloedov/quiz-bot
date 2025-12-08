import apiClient from './client';
import type { AnalyticsOverview, NameAnalytics, ApiResponse } from '../types';

export const analyticsApi = {
  getOverview: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<AnalyticsOverview>> => {
    const response = await apiClient.get<ApiResponse<AnalyticsOverview>>('/analytics/overview', { params });
    return response.data;
  },

  getNameAnalytics: async (
    name: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<NameAnalytics>> => {
    const response = await apiClient.get<ApiResponse<NameAnalytics>>(
      `/analytics/names/${encodeURIComponent(name)}`,
      { params }
    );
    return response.data;
  },
};
