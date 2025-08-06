'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';

const MobileHeader = () => {
  const { unreadCount } = useNotificationStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between h-14 px-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 xl:hidden">
      <Link href="/" className="text-xl font-bold">
        PIKU
      </Link>
      <Link href="/notifications" className="relative p-1">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
};

export default MobileHeader;
