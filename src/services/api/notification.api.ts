import { axiosInstance } from './axiosInstance';

export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'quiz_participants' | 'challenge_participants' | 'selected_users';
  targetUserIds?: string[];
  scheduleTime?: string; // Empty if sent immediately
  status: 'sent' | 'scheduled';
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (): Promise<ScheduledNotification[]> => {
    try {
      const response: any = await axiosInstance.get('/admin/settings');
      const settings = response.data || response;
      return settings.notifications_schedule || [];
    } catch {
      return [];
    }
  },

  saveNotification: async (notification: Partial<ScheduledNotification>): Promise<ScheduledNotification[]> => {
    const list = await notificationApi.getNotifications();
    const newNotification: ScheduledNotification = {
      id: notification.id || Math.random().toString(36).substr(2, 9),
      title: notification.title || '',
      message: notification.message || '',
      audience: notification.audience || 'all',
      targetUserIds: notification.targetUserIds || [],
      scheduleTime: notification.scheduleTime,
      status: notification.scheduleTime ? 'scheduled' : 'sent',
      createdAt: new Date().toISOString(),
    };

    const updatedList = notification.id
      ? list.map((item) => (item.id === notification.id ? { ...item, ...newNotification } : item))
      : [newNotification, ...list];

    // Trigger immediate FCM broadcast on the backend if no scheduleTime is defined
    if (!notification.scheduleTime) {
      await axiosInstance.post('/admin/notifications/broadcast', {
        title: notification.title,
        message: notification.message,
        audience: notification.audience,
      });
    }

    const response: any = await axiosInstance.put('/admin/settings', {
      key: 'notifications_schedule',
      value: updatedList,
      description: 'Persistent list of scheduled and sent push notifications',
    });

    const settings = response.data || response;
    return settings.value || [];
  },

  deleteNotification: async (id: string): Promise<ScheduledNotification[]> => {
    const list = await notificationApi.getNotifications();
    const updatedList = list.filter((item) => item.id !== id);

    const response: any = await axiosInstance.put('/admin/settings', {
      key: 'notifications_schedule',
      value: updatedList,
      description: 'Persistent list of scheduled and sent push notifications',
    });

    const settings = response.data || response;
    return settings.value || [];
  },
};
