import { axiosInstance } from './axiosInstance';
import type { LoginCredentials, LoginResponse, ForgotPasswordPayload, ResetPasswordPayload, ChangePasswordPayload } from '@/types/api.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response: any = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await axiosInstance.post('/auth/logout', { refreshToken });
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
    return axiosInstance.post('/auth/forgot-password', payload);
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    return axiosInstance.post('/auth/reset-password', payload);
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    return axiosInstance.post('/auth/change-password', payload);
  },
};
