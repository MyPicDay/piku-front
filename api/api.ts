// api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getServerURL } from '@/lib/utils/url';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

/**
 * 프로젝트 전역으로 사용될 Axios 인스턴스.
 * baseURL, withCredentials 등 공통 설정을 포함합니다.
 */
const api = axios.create({
  baseURL: getServerURL(),
  withCredentials: true,
});

/**
 * 요청 인터셉터 (Request Interceptor)
 * - 모든 API 요청이 보내지기 전에 실행됩니다.
 * - 로컬 스토리지에서 accessToken을 가져와 요청 헤더에 'Authorization'으로 추가합니다.
 * - 서버 사이드 렌더링(SSR) 환경에서는 로컬 스토리지가 없으므로, 클라이언트 사이드에서만 동작합니다.
 */
api.interceptors.request.use(config => {
  if (typeof window === 'undefined') {
    return config;
  }
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 응답 인터셉터 (Response Interceptor)
 * - API 응답을 받은 후 실행됩니다.
 * - 401 Unauthorized 에러 발생 시, 토큰 재발급 로직을 수행합니다.
 */

// 토큰 재발급 요청이 진행 중인지 여부를 나타내는 플래그
let isRefreshing = false;
// 토큰 재발급 중 실패한 요청들을 저장하는 큐
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

// 큐에 쌓인 요청들을 처리하는 함수
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 에러이고, 재시도한 요청이 아닐 경우
    if (error.response?.status === 401 && !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/reissue') {
      // 이미 토큰 재발급이 진행 중인 경우, 현재 요청을 큐에 추가
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = 'Bearer ' + token;
            }
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      // 재시도 플래그를 설정하여 무한 재발급 요청 방지
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 리프레시 토큰을 사용하여 새로운 액세스 토큰 발급 요청
        const response = await axios.post(
          `${getServerURL()}/auth/reissue`,
          {},
          { withCredentials: true },
        );

        const authHeader = response.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new Error('New access token not found in response header.');
        }
        const newAccessToken = authHeader.slice(7);
        localStorage.setItem(AUTH_TOKEN_KEY, newAccessToken);

        // 새로 발급받은 토큰으로 원래 요청의 헤더를 수정
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // 큐에 쌓여있던 다른 요청들을 새로운 토큰으로 처리
        processQueue(null, newAccessToken);

        // 원래 요청을 다시 시도
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 재발급 실패 시
        processQueue(refreshError as Error, null);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        if (typeof window !== 'undefined') {
          // 로그인 페이지로 리다이렉트
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
