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
  recipientCount?: number;
  successCount?: number;
  failureCount?: number;
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
    let report = { successCount: 0, failureCount: 0, recipientCount: 0 };

    // Trigger immediate FCM broadcast on the backend if no scheduleTime is defined
    if (!notification.scheduleTime) {
      const broadcastRes: any = await axiosInstance.post('/admin/notifications/broadcast', {
        title: notification.title,
        message: notification.message,
        audience: notification.audience,
      });
      if (broadcastRes && broadcastRes.data) {
        report = broadcastRes.data;
      } else if (broadcastRes) {
        report = broadcastRes;
      }
    }

    const newNotification: ScheduledNotification = {
      id: notification.id || Math.random().toString(36).substr(2, 9),
      title: notification.title || '',
      message: notification.message || '',
      audience: notification.audience || 'all',
      targetUserIds: notification.targetUserIds || [],
      scheduleTime: notification.scheduleTime,
      status: notification.scheduleTime ? 'scheduled' : 'sent',
      createdAt: new Date().toISOString(),
      recipientCount: report.recipientCount,
      successCount: report.successCount,
      failureCount: report.failureCount,
    };

    const updatedList = notification.id
      ? list.map((item) => (item.id === notification.id ? { ...item, ...newNotification } : item))
      : [newNotification, ...list];

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
