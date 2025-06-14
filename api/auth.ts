import api from '@/api/api';

interface SignupData {
  email: string;
  password: string;
  nickname: string;
  character: string;
}

export const signup = async (data: SignupData) => {
  const response = await api.post('/api/auth/signup', data);
  return response.data;
};

interface LoginData {
  email: string;
  password: string;
}

export const login = async (data: LoginData) => {
  const response = await api.post('/api/auth/login', data, { withCredentials: true });
  return response;
};
