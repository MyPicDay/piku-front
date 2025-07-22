'use client';

import UserProfile from '@/components/common/UserProfile';
import { FriendRequest } from '@/types/friend';

interface FriendRequestListProps {
  requests: FriendRequest[];
  onAccept: (userId: string) => void;
  onReject: (userId: string) => void;
  lastRequestElementRef: (node: HTMLLIElement) => void;
}

const FriendRequestList = ({
  requests,
  onAccept,
  onReject,
  lastRequestElementRef,
}: FriendRequestListProps) => {
  if (requests.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        받은 친구 요청이 없습니다.
      </div>
    );
  }

  return (
    <ul>
      {requests.map((request, index) => {
        const isLastElement = index === requests.length - 1;
        return (
          <li
            key={request.userId}
            ref={isLastElement ? lastRequestElementRef : null}
            className="flex items-center justify-between py-3 border-b"
          >
            <div className="flex items-center">
              <UserProfile
                userId={request.userId}
                nickname={request.nickname}
                avatar={request.avatar}
                imageSize={40}
                containerClassName="flex-grow"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onAccept(request.userId)}
                className="border rounded-md px-3 py-1 text-sm font-semibold border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
              >
                수락
              </button>
              <button
                onClick={() => onReject(request.userId)}
                className="border rounded-md px-3 py-1 text-sm font-semibold border-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                거절
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default FriendRequestList; 