// api.ts
import axios from 'axios';
import { getServerURL } from '@/lib/utils/url';

const api = axios.create({
  baseURL: getServerURL(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // 또는 쿠키에서 가져올 수도 있음
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
