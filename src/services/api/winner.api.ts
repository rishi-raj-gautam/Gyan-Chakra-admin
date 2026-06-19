import { axiosInstance } from './axiosInstance';
import type { Winner } from '@/types/api.types';

export const winnerApi = {
  getRecentWinners: async (_limit = 20): Promise<Winner[]> => {
    // Merge daily quiz winners and mega challenge winners or fetch from daily-quiz/winners
    try {
      const response: any = await axiosInstance.get(`/daily-quiz/winners`);
      const data = response.data || response;
      return data || [];
    } catch {
      return [];
    }
  },

  drawDailyQuizWinner: async (quizId: string): Promise<Winner> => {
    const response: any = await axiosInstance.post(`/admin/winners/daily-quiz/${quizId}/draw`);
    return response.data || response;
  },

  drawMegaChallengeWinner: async (challengeId: string): Promise<Winner> => {
    const response: any = await axiosInstance.post(`/admin/winners/mega-challenge/${challengeId}/draw`);
    return response.data || response;
  },
};
