import { axiosInstance } from './axiosInstance';
import type { MegaChallenge } from '@/types/api.types';

export const challengeApi = {
  getAllChallenges: async (page = 1, limit = 20): Promise<{ challenges: MegaChallenge[]; total: number }> => {
    const response: any = await axiosInstance.get(`/mega-challenge?page=${page}&limit=${limit}`);
    const data = response.data || response;
    return {
      challenges: data.challenges || [],
      total: data.total || 0,
    };
  },

  createChallenge: async (challenge: Partial<MegaChallenge>): Promise<MegaChallenge> => {
    const response: any = await axiosInstance.post('/admin/mega-challenge', challenge);
    return response.data || response;
  },

  updateChallenge: async (id: string, challenge: Partial<MegaChallenge>): Promise<MegaChallenge> => {
    const response: any = await axiosInstance.put(`/admin/mega-challenge/${id}`, challenge);
    return response.data || response;
  },

  deleteChallenge: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/admin/mega-challenge/${id}`);
  },

  drawWinner: async (challengeId: string): Promise<any> => {
    const response: any = await axiosInstance.post(`/admin/winners/mega-challenge/${challengeId}/draw`);
    return response.data || response;
  },
};
