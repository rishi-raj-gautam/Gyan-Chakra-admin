import { axiosInstance } from './axiosInstance';

export const settingsApi = {
  getSettings: async (): Promise<Record<string, any>> => {
    const response: any = await axiosInstance.get('/admin/settings');
    return response.data || response;
  },

  updateSetting: async (key: string, value: any, description?: string): Promise<any> => {
    const response: any = await axiosInstance.put('/admin/settings', {
      key,
      value,
      description,
    });
    return response.data || response;
  },

  getAuditLogs: async (page = 1, limit = 20): Promise<{ logs: any[]; total: number }> => {
    const response: any = await axiosInstance.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
    const data = response.data || response;
    return {
      logs: data.logs || [],
      total: data.total || 0,
    };
  },
};
