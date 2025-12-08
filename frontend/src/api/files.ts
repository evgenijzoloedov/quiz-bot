import apiClient from './client';
import type { FileInfo, ApiResponse, PaginationInfo } from '../types';

interface FilesListResponse {
  success: boolean;
  data: FileInfo[];
  pagination: PaginationInfo;
}

export const filesApi = {
  getAll: async (params?: {
    type?: 'image' | 'pdf';
    page?: number;
    limit?: number;
  }): Promise<FilesListResponse> => {
    const response = await apiClient.get<FilesListResponse>('/files', { params });
    return response.data;
  },

  upload: async (file: File): Promise<ApiResponse<FileInfo>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<FileInfo>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (filename: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/files/${filename}`);
    return response.data;
  },
};
