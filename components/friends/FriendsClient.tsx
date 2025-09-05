'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FriendList from './FriendList';
import FriendRequestList from './FriendRequestList';
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from '@/lib/api/friend';
import { FriendRequest } from '@/types/friend';

const FriendsClient = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [requestsPage, setRequestsPage] = useState(0);
  const [requestsHasMore, setRequestsHasMore] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);

  const loadMoreRequests = useCallback(async () => {
    if (requestsLoading || !requestsHasMore) return;
    setRequestsLoading(true);

    try {
      const data = await getFriendRequests(requestsPage, 10);
      
      // 데이터가 없거나 빈 배열인 경우 처리
      if (!data.requests || data.requests.length === 0) {
        setRequestsHasMore(false);
        setRequestsLoading(false);
        return;
      }

      setRequests(prev => {
        const existingUserIds = new Set(prev.map(req => req.userId));
        const newRequests = data.requests.filter(
          req => !existingUserIds.has(req.userId),
        );
        return [...prev, ...newRequests];
      });
      
      setRequestsHasMore(data.hasNext);
      setTotalRequests(data.totalElements);
      setRequestsPage(prev => prev + 1);
    } catch (error) {
      console.error('친구 요청 목록을 불러오는데 실패했습니다:', error);
      // 에러 발생 시 더 이상 로드하지 않도록 설정
      setRequestsHasMore(false);
    } finally {
      setRequestsLoading(false);
    }
  }, [requestsPage, requestsLoading, requestsHasMore]);

  const lastRequestElementRef = useCallback(
    (node: HTMLLIElement) => {
      if (requestsLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && requestsHasMore) {
          loadMoreRequests();
        }
      });

      if (node) observer.current.observe(node);
    },
    [requestsLoading, requestsHasMore, loadMoreRequests],
  );

  // 초기 로드만 실행
  useEffect(() => {
    if (requestsPage === 0 && !requestsLoading) {
      loadMoreRequests();
    }
  }, []); // 빈 의존성 배열로 초기 로드만 실행

  const handleAccept = async (userId: string) => {
    await acceptFriendRequest(userId);
    setRequests(currentRequests =>
      currentRequests.filter(req => req.userId !== userId),
    );
    setTotalRequests(prev => prev - 1);
  };

  const handleReject = async (userId: string) => {
    await rejectFriendRequest(userId);
    setRequests(currentRequests =>
      currentRequests.filter(req => req.userId !== userId),
    );
    setTotalRequests(prev => prev - 1);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-grow">
        <h1 className="text-2xl font-bold mb-6">친구</h1>
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-300 rounded-t-md cursor-pointer ${
              activeTab === 'friends'
                ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('friends')}
          >
            친구 목록
          </button>
          <button
            className={`py-2 px-4 text-lg font-semibold relative transition-colors duration-300 rounded-t-md cursor-pointer ${
              activeTab === 'requests'
                ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            친구 요청
            {totalRequests > 0 && (
              <span className="absolute top-1 right-0 transform translate-x-1/2 -translate-y-1/2">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {totalRequests}
                </span>
              </span>
            )}
          </button>
        </div>

        <div>
          {activeTab === 'friends' ? (
            <FriendList />
          ) : (
            <FriendRequestList
              requests={requests}
              onAccept={handleAccept}
              onReject={handleReject}
              lastRequestElementRef={lastRequestElementRef}
            />
          )}
          {requestsLoading && (
            <div className="text-center p-4">
              <p>요청 목록을 불러오는 중...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsClient; 