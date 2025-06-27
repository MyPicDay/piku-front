'use client';

import { useState, useEffect } from 'react';
import FriendList from './FriendList';
import FriendRequestList from './FriendRequestList';
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from '@/api/friend';
import { FriendRequest } from '@/types/friend';

const FriendsClient = () => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const data = await getFriendRequests();
      setRequests(data);
    };
    fetchRequests();
  }, []);

  const handleAccept = async (id: number) => {
    await acceptFriendRequest(id);
    setRequests(currentRequests =>
      currentRequests.filter(req => req.id !== id),
    );
    // You might want to refresh the main friend list here as well
  };

  const handleReject = async (id: number) => {
    await rejectFriendRequest(id);
    setRequests(currentRequests =>
      currentRequests.filter(req => req.id !== id),
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
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
            {requests.length > 0 && (
              <span className="absolute top-1 right-0 transform translate-x-1/2 -translate-y-1/2">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {requests.length}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsClient; 