// api.ts
import axios from 'axios';
import { getServerURL } from '@/lib/utils/url';

const api = axios.create({
  baseURL: getServerURL(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }
  const token = localStorage.getItem('accessToken'); // 또는 쿠키에서 가져올 수도 있음
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.response?.data === 'Access token has expired.'
    ) {
      localStorage.removeItem('accessToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export default api;
