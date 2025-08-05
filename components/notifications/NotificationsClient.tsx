'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deleteNotification, getNotifications, markNotificationAsRead } from '@/api/notification';
import { Notification } from '@/types/notification';
import { Trash2 } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';

const NotificationsClient = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuthStore();
  const { decrementUnreadCount } = useNotificationStore();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      readMutation.mutate(notification.id);
      decrementUnreadCount();
    }

    if (notification.diaryDate) {
      const url = `/profile/${notification.diaryUserId}/calendar?date=${notification.diaryDate}&diaryId=${notification.relatedDiaryId}`;
      router.push(url);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    deleteMutation.mutate(notification.id, {
      onSuccess: () => {
        if (!notification.isRead) {
          decrementUnreadCount();
        }
      },
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">알림</h1>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
              notification.isRead
                ? 'bg-white dark:bg-gray-800'
                : 'bg-blue-50 dark:bg-blue-900/50'
            } hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-center flex-1">
              {notification.avatarUrl && (
                <Image
                  src={notification.avatarUrl}
                  alt={`${notification.nickname}'s avatar`}
                  width={40}
                  height={40}
                  className="rounded-full mr-4"
                />
              )}
              <div className="flex-1">
                <p>
                  <span className="font-semibold">{notification.nickname}</span>
                  {` ${notification.message}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {notification.thumbnailUrl && (
                <Image
                  src={notification.thumbnailUrl}
                  alt="thumbnail"
                  width={40}
                  height={40}
                  className="rounded-md"
                />
              )}
              <button
                onClick={(e) => handleDeleteClick(e, notification)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsClient;

