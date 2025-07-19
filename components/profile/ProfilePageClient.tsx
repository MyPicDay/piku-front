'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';
import Header from '@/components/profile/Header';
import { UserProfileResponseDTO } from '@/types/profile';
import { getUserProfile } from '@/api/user';
import { getDaysInMonth } from '@/lib/utils/date';
import useAuthStore from '@/components/store/authStore';

interface ProfilePageClientProps {
  userId: string;
}

const ProfilePageClient = ({ userId }: ProfilePageClientProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [profileData, setProfileData] = useState<UserProfileResponseDTO | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (
        !currentUser ||
        (pathname === '/profile' && userId !== currentUser.id)
      ) {
        if (currentUser?.id) {
          router.replace(`/profile/${currentUser.id}`);
        } else {
          router.replace('/login');
        }
        return;
      }

      try {
        setIsLoading(true);
        const data = await getUserProfile(userId);

        const monthlyDiaryCountWithDays = data.monthlyDiaryCount.map(item => ({
          ...item,
          daysInMonth: getDaysInMonth(item.year, item.month),
        }));

        setProfileData({
          ...data,
          monthlyDiaryCount: monthlyDiaryCountWithDays,
          userId: data.id,
        });
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId, currentUser, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>프로필을 불러오는 중...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>프로필 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <Header nickname={profileData.nickname} isOwner={profileData.isOwner} />
      <ProfileClient profileData={profileData} />
    </>
  );
};

export default ProfilePageClient; 