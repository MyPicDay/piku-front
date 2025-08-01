import api  from './api';
import { Notification } from '@/types/notification';

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/notifications/${notificationId}`);
};

export const deleteNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};
