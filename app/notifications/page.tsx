import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '알림 - PikU',
  description: 'PikU에서 받은 최신 알림을 확인하세요',
};
import NotificationsClient from '@/components/notifications/NotificationsClient';

const NotificationPage = () => {
  return (
      <NotificationsClient />
  );
};

export default NotificationPage;
