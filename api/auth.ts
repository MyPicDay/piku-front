import api from '@/api/api';

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

interface LoginData {
  email: string;
  password: string;
}

export const login = async (data: LoginData) => {
  const response = await api.post('/auth/login', data);
  return response;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout failed:', error);
    // 서버 로그아웃에 실패하더라도 클라이언트 측 로그아웃은 진행되어야 하므로 에러를 다시 throw하지 않습니다.
  } finally {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
};
