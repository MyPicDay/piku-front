'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import ProfileEditClient from '@/components/profile/ProfileEditClient';
import { UserProfileResponseDTO } from '@/types/profile';
import useAuthStore from '@/components/store/authStore';
import { getUserProfile } from '@/api/user';

const ProfileEditPageClient = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<UserProfileResponseDTO | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const data = await getUserProfile(user.id);
          setProfileData(data);
        } catch (error) {
          console.error('프로필 정보를 불러오는데 실패했습니다:', error);
          // TODO: 에러 처리 UI 추가
        } finally {
          setIsLoading(false);
        }
      } else {
        // 로그인 되어있지 않으면 로그인 페이지로 이동
        // authStore의 상태가 확정된 후에 실행하기 위해 user가 명시적으로 null일 때를 확인
        if (user === null) {
          router.replace('/login');
        }
      }
    };
    fetchProfile();
  }, [user, router]);

  const Header = () => (
    <header className="sticky top-0 z-10 flex items-center justify-center p-4 border-b bg-white xl:hidden">
      <button onClick={() => router.back()} className="absolute left-4">
        <ChevronLeft className="w-6 h-6 cursor-pointer" />
      </button>
      <h1 className="text-lg font-semibold">프로필 편집</h1>
    </header>
  );

  if (isLoading || !profileData) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-65px)]">
          <p>프로필 정보를 불러오는 중입니다...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <ProfileEditClient profileData={profileData} />
    </>
  );
};

export default ProfileEditPageClient; 