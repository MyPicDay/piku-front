'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deleteNotification, getNotifications, markNotificationAsRead } from '@/api/notification';
import { Notification } from '@/types/notification';
import { Trash2 } from 'lucide-react';

const NotificationsClient = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

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
      queryClient.invalidateQueries({ queryKey: ['notifications']});
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    readMutation.mutate(notification.id);
    // relatedId를 사용한 라우팅 로직이 필요하지만, type 정보가 없어 우선 보류합니다.
    // if (notification.relatedId) {
    //   router.push(`/some-path/${notification.relatedId}`);
    // }
  };

  const handleDeleteClick = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    deleteMutation.mutate(notificationId);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">알림</h1>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${notification.isRead ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/50'} hover:bg-gray-100 dark:hover:bg-gray-700`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-center">
                {notification.thumbnailUrl && (
                    <Image src={notification.thumbnailUrl} alt="thumbnail" width={40} height={40} className="rounded-full mr-4" />
                )}
              <p>
                {notification.message}
              </p>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={(e) => handleDeleteClick(e, notification.id)} className='p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600'>
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
