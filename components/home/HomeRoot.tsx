'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/components/store/authStore';
import HomeCalendar from '@/components/home/HomeCalendar';
import FeedClient from '@/components/feed/FeedClient';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

export default function HomeRoot() {
  const { user } = useAuthStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    setIsLoggedIn(!!token && !!user);
  }, [user]);

  // SSR 및 크롤러를 위한 기본 콘텐츠 제공
  if (!isClient) {
    return (
      <div className="w-full min-h-screen">
        <FeedClient />
      </div>
    );
  }

  return isLoggedIn ? <HomeCalendar /> : <FeedClient />;
} 