import apiClient from './client';
import type { ApiResponse, Question } from '../types';

export interface Quiz {
  _id: string;
  name: string;
  questions: Question[];
  successVideo: string | null;
  isActive: boolean;
  questionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const quizApi = {
  getActive: async (): Promise<ApiResponse<Quiz>> => {
    const response = await apiClient.get<ApiResponse<Quiz>>('/quiz');
    return response.data;
  },

  update: async (formData: FormData): Promise<ApiResponse<Quiz>> => {
    const response = await apiClient.put<ApiResponse<Quiz>>('/quiz', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

