import apiClient from './client';
import type { ApiResponse, PaginationInfo } from '../types';

export interface Name {
  _id: string;
  name: string;
  pdfFilePath?: string;
  pdfFile?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface NamesListResponse {
  success: boolean;
  data: Name[];
  pagination: PaginationInfo;
}

export const namesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<NamesListResponse> => {
    const response = await apiClient.get<NamesListResponse>('/names', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Name>> => {
    const response = await apiClient.get<ApiResponse<Name>>(`/names/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<ApiResponse<Name>> => {
    const response = await apiClient.post<ApiResponse<Name>>('/names', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, formData: FormData): Promise<ApiResponse<Name>> => {
    const response = await apiClient.put<ApiResponse<Name>>(`/names/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ deletedName: { _id: string; name: string } }>> => {
    const response = await apiClient.delete(`/names/${id}`);
    return response.data;
  },
};

