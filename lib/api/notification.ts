import api  from './api';
import { Notification } from '@/types/notification';

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/sse/notifications');
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/sse/${notificationId}`);
};

export const deleteNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/sse/${notificationId}`);
};
