'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { requestPermissionAndGetToken } from '@/lib/utils/fcm';
import { registerFCMToken } from '@/api/user';

const FCMInitializer = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [isTokenRegistered, setIsTokenRegistered] = useState(false);

  useEffect(() => {
    // 사용자가 로그인했고, user 객체가 있으며, 아직 토큰이 등록되지 않았을 때 실행
    if (!isLoggedIn || !user || isTokenRegistered) return;

    const initializeFCM = async () => {
      const token = await requestPermissionAndGetToken();
      if (token) {
        try {
          const deviceId = localStorage.getItem('deviceId') || '';
          await registerFCMToken(user.id, token, deviceId);
          // 세션 내에서 중복 등록 방지
          setIsTokenRegistered(true); 
        } catch (error) {
        }
      }
    };

    initializeFCM();
  }, [isLoggedIn, user, isTokenRegistered]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다.
};

export default FCMInitializer;
