'use client';

import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { getServerURL } from '@/lib/utils/url';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import { EventSourcePolyfill, MessageEvent } from 'event-source-polyfill';

const SSEInitializer = () => {
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let eventSource: EventSourcePolyfill;

    const connect = () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      const sseUrl = `${getServerURL()}/notifications/subscribe`;
      eventSource = new EventSourcePolyfill(sseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        heartbeatTimeout: 86400000, // 24시간
      });

      eventSource.onopen = () => {
        console.log('SSE connection opened.');
      };

      eventSource.onmessage = (event: MessageEvent) => {
        console.log('New message from server:', event.data);
        // TODO: 수신된 데이터를 기반으로 알림 UI 업데이트
      };

      eventSource.onerror = (error: any) => {
        console.error('SSE error:', error);
        eventSource.close();
      };
    };

    connect();

    return () => {
      if (eventSource) {
        console.log('Closing SSE connection.');
        eventSource.close();
      }
    };
  }, [isLoggedIn]);

  return null;
};

export default SSEInitializer;
