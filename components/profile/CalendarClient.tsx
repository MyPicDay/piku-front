'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserProfile } from '@/api/user';
import HomeCalendar from '@/components/home/HomeCalendar';
import type { UserProfile } from '@/types/friend';
import useAuthStore from '../store/authStore';
import { getSeoulDate } from '@/lib/utils/date';

const getInitialDate = (dateStr: string | null): Date => {
  if (dateStr) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return getSeoulDate();
};

const CalendarClient = ({ userId }: { userId: string }) => {
  const [viewedUser, setViewedUser] = useState<
    Pick<UserProfile, 'userId' | 'nickname' | 'avatar'> | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const dateStr = useSearchParams().get('date');
  const initialDate = getInitialDate(dateStr);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const userProfile = await getUserProfile(userId);
        setViewedUser({
          userId: userProfile.id,
          nickname: userProfile.nickname,
          avatar: userProfile.avatar,
        });
      } catch (err) {
        setError('사용자 정보를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>사용자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <HomeCalendar
      viewedUser={viewedUser as UserProfile}
      initialDate={initialDate}
    />
  );
};

export default CalendarClient; 