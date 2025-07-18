'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/components/store/authStore';
import HomeCalendar from '@/components/home/HomeCalendar';
import LandingClient from '@/components/home/LandingClient';
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

  if (!isClient) {
    return null; // 또는 로딩 스피너
  }

  return isLoggedIn ? <HomeCalendar /> : <LandingClient />;
} 