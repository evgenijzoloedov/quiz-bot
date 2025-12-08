import apiClient from './client';
import type { Question, ApiResponse } from '../types';

export const questionsApi = {
  getAll: async (): Promise<ApiResponse<Question[]>> => {
    const response = await apiClient.get<ApiResponse<Question[]>>('/questions');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Question>> => {
    const response = await apiClient.get<ApiResponse<Question>>(`/questions/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<ApiResponse<Question>> => {
    const response = await apiClient.post<ApiResponse<Question>>(
      '/questions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (id: string, formData: FormData): Promise<ApiResponse<Question>> => {
    const response = await apiClient.put<ApiResponse<Question>>(`/questions/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/questions/${id}`);
    return response.data;
  },

  reorder: async (id: string, newOrder: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`/questions/${id}/reorder`, { newOrder });
    return response.data;
  },
};
