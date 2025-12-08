import apiClient from './client';
import type { ApiResponse, FailImage } from '../types';

interface FailImagesListResponse {
  success: boolean;
  data: FailImage[];
}

export const failImagesApi = {
  getAll: async (params?: {
    isActive?: boolean;
  }): Promise<FailImagesListResponse> => {
    const response = await apiClient.get<FailImagesListResponse>('/fail-images', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<FailImage>> => {
    const response = await apiClient.get<ApiResponse<FailImage>>(`/fail-images/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<ApiResponse<FailImage>> => {
    const response = await apiClient.post<ApiResponse<FailImage>>('/fail-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, data: { order?: number; isActive?: boolean }): Promise<ApiResponse<FailImage>> => {
    const response = await apiClient.put<ApiResponse<FailImage>>(`/fail-images/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ deletedImage: { _id: string; filename: string } }>> => {
    const response = await apiClient.delete(`/fail-images/${id}`);
    return response.data;
  },

  reorder: async (id: string, newOrder: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`/fail-images/${id}/reorder`, { newOrder });
    return response.data;
  },
};

