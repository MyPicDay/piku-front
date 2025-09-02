'use client';

import Link from 'next/link';
import { useState } from 'react';
import { guestLogin } from '@/lib/api/auth';
import useAuthStore from '@/components/store/authStore';
import { useRouter } from 'next/navigation';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import { getServerURL } from '@/lib/utils/url';

const LandingClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      const response = await guestLogin();
      
      let token: string | null = null;
      const authHeader = response.headers['authorization'];
      const user = response.data.user;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
        if (token != null) {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        }
      } else {
        console.warn('응답 헤더에 토큰이 없습니다.');
      }

      if (token && user) {
        // avatar URL에 서버 URL 추가
        const avatarUrl = user.avatar && !user.avatar.startsWith('http') 
          ? `${getServerURL()}/${user.avatar}` 
          : user.avatar;
        
        // API 응답의 guest 필드를 isGuest로 변환
        const userWithIsGuest = { 
          ...user, 
          avatar: avatarUrl,
          isGuest: (user as any).guest || false
        };
        
        login(userWithIsGuest);
        router.push('/');
      } else {
        // 성공 응답을 받았으나 토큰이나 유저 정보가 없는 경우
        throw new Error('인증 정보가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('비회원 로그인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">PikU</h1>
        <p className="mt-4 text-lg text-gray-600">
          캐릭터로 기록하는 하루 한 장
        </p>
      </div>
      <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
        <button 
          onClick={handleGuestLogin}
          disabled={isLoading}
          className="w-full bg-gray-600 text-white py-3 rounded-full text-lg font-semibold cursor-pointer disabled:opacity-50"
        >
          {isLoading ? '로그인 중...' : '게스트로 시작'}
        </button>
        <Link href="/login" passHref>
          <button className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold cursor-pointer">
            로그인
          </button>
        </Link>
        <Link href="/signup" passHref>
          <button className="text-gray-600 w-full cursor-pointer">
            회원가입
          </button>
        </Link>
      </div>
    </div>
  );
};

export default LandingClient; 