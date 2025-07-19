'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/components/store/authStore';

const ProfileRedirectPage = () => {
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (user?.id) {
      router.replace(`/profile/${user.id}`);
    } else {
      // 로그인되어 있지 않은 경우 로그인 페이지로 보낼 수 있습니다.
      // 또는 단순히 로딩 상태를 표시할 수도 있습니다.
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>프로필 페이지로 이동 중입니다...</p>
    </div>
  );
};

export default ProfileRedirectPage; 