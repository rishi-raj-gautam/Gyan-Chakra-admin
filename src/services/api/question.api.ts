import { axiosInstance } from './axiosInstance';

export interface BankQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  type: 'MCQ' | 'image' | 'video';
  mediaUrl?: string;
  createdAt: string;
}

export const questionApi = {
  getQuestionBank: async (): Promise<BankQuestion[]> => {
    try {
      const response: any = await axiosInstance.get('/admin/settings');
      const settings = response.data || response;
      return settings.question_bank || [];
    } catch {
      return [];
    }
  },

  saveQuestionBank: async (questions: BankQuestion[]): Promise<BankQuestion[]> => {
    const response: any = await axiosInstance.put('/admin/settings', {
      key: 'question_bank',
      value: questions,
      description: 'Persistent repository of all question bank items',
    });
    const settings = response.data || response;
    return settings.value || [];
  },
};
