'use client';

import { useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { getServerURL } from '@/lib/utils/url';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import { EventSourcePolyfill } from 'event-source-polyfill';
import useNotificationStore from '../store/notificationStore';

const SSEInitializer = () => {
  const { isLoggedIn } = useAuthStore();
  const { setUnreadCount, incrementUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let eventSource: EventSourcePolyfill;
    let isFirstMessage = true;

    const connect = () => {
      // 이미 연결되어 있다면 중복 연결 방지
      if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
        return;
      }

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      const sseUrl = `${getServerURL()}/sse/subscribe`;
      eventSource = new EventSourcePolyfill(sseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        heartbeatTimeout: 86400000, // 24시간
      });

      isFirstMessage = true; // 재연결 시 초기 메시지 처리를 위해 리셋

      eventSource.onopen = () => {
      };

      eventSource.onmessage = (event: any) => {
        if (isFirstMessage) {
          const count = parseInt(event.data, 10);
          if (!isNaN(count)) {
            setUnreadCount(count);
          }
          isFirstMessage = false;
        } else {
          incrementUnreadCount();
        }
      };

      eventSource.onerror = (error: any) => {
        eventSource.close();
      };
    };

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, setUnreadCount, incrementUnreadCount]);

  return null;
};

export default SSEInitializer;
