import { axiosInstance } from './axiosInstance';
import type { User } from '@/types/api.types';

export const userApi = {
  getUsers: async (
    page = 1,
    limit = 20,
    search = '',
    status = ''
  ): Promise<{ users: User[]; total: number; totalPages: number }> => {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const response: any = await axiosInstance.get(url);
    const data = response.data || response;
    return {
      users: data.users || [],
      total: data.total || 0,
      totalPages: data.totalPages || 1,
    };
  },

  updateUserStatus: async (
    id: string,
    status: 'active' | 'suspended' | 'blocked',
    remarks?: string
  ): Promise<User> => {
    const response: any = await axiosInstance.put(`/users/${id}/status`, {
      status,
      remarks,
    });
    return response.data || response;
  },
};
