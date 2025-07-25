import api from '@/api/api';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import generateUUID from '@/lib/utils/uuidGenerator';
import { PwdResetRequest } from '@/types/auth';

interface SignupData {
  email: string;
  password: string;
  nickname: string;
  character: string;
}

export const signup = async (data: SignupData) => {
  const { character, ...rest } = data;
  const response = await api.post('/auth/signup', {
    ...rest,
    fixedCharacterId: Number(character),
  });
  return response.data;
};

export const sendSignUpVerificationEmail = async (email: string) => {
  const response = await api.post('/auth/send-verification/sign-up', { email });
  return response.data;
};

export const verifyCode = async (email: string, code: string) => {
  const response = await api.post('/auth/verify-code', { email, code });
  return response.data;
};

export const sendVerificationCode = async (email: string) => {
  return await api.post('/auth/send-verification/password-reset', { email: email});
}

export const verifyCodeAndResetPassword = async(data: PwdResetRequest) => {
  return await api.post('/auth/verify-code/password-reset', data);
}

interface LoginData {
  email: string;
  password: string;
}

export const login = async (data: LoginData) => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
      deviceId = generateUUID(); // 브라우저 지원
      localStorage.setItem('deviceId', deviceId);
  }

  const response = await api.post('/auth/login', data, {
    headers: {
      'Device-Id': deviceId,
    },
  });
  return response;
};

export const logout = async (): Promise<void> => {
  try {
    localStorage.removeItem('deviceId');
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout failed:', error);
    // 서버 로그아웃에 실패하더라도 클라이언트 측 로그아웃은 진행되어야 하므로 에러를 다시 throw하지 않습니다.
  } finally {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.href = '/login';
  }
};
