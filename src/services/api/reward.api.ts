import { axiosInstance } from './axiosInstance';
import type { Winner } from '@/types/api.types';

export const rewardApi = {
  getRewardHistory: async (): Promise<Winner[]> => {
    try {
      const response: any = await axiosInstance.get('/daily-quiz/winners');
      const data = response.data || response;
      return data || [];
    } catch {
      return [];
    }
  },

  getPendingRewardsCount: async (): Promise<number> => {
    // We can infer pending rewards by checking quizzes/challenges that have expired but don't have a winnerId yet
    try {
      const quizRes: any = await axiosInstance.get('/daily-quiz?limit=100');
      const quizzes = quizRes.data?.quizzes || quizRes.quizzes || [];
      const pendingQuizzes = quizzes.filter((q: any) => q.status === 'expired' && !q.winnerId);
      return pendingQuizzes.length;
    } catch {
      return 0;
    }
  },
};
