import { axiosInstance } from './axiosInstance';
import type { DailyQuiz } from '@/types/api.types';

export const quizApi = {
  getAllQuizzes: async (page = 1, limit = 20): Promise<{ quizzes: DailyQuiz[]; total: number }> => {
    const response: any = await axiosInstance.get(`/daily-quiz?page=${page}&limit=${limit}`);
    // Check if data structure is success / data wrapper
    const data = response.data || response;
    return {
      quizzes: data.quizzes || [],
      total: data.total || 0,
    };
  },

  createQuiz: async (quiz: Partial<DailyQuiz>): Promise<DailyQuiz> => {
    const response: any = await axiosInstance.post('/admin/daily-quiz', quiz);
    return response.data || response;
  },

  updateQuiz: async (id: string, quiz: Partial<DailyQuiz>): Promise<DailyQuiz> => {
    const response: any = await axiosInstance.put(`/admin/daily-quiz/${id}`, quiz);
    return response.data || response;
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/admin/daily-quiz/${id}`);
  },

  drawWinner: async (quizId: string): Promise<any> => {
    const response: any = await axiosInstance.post(`/admin/winners/daily-quiz/${quizId}/draw`);
    return response.data || response;
  },
};
