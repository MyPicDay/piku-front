'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import UserProfile from '@/components/common/UserProfile';
import { Friend } from '@/types/friend';
import { deleteFriend, getFriends } from '@/api/friend';

const PAGE_SIZE = 20;

const FriendList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastFriendElementRef = useCallback((node: HTMLLIElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNext) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasNext]);

  const fetchFriends = useCallback(async (pageNum: number) => {
    if (!hasNext && pageNum > 0) return; // 첫 페이지가 아니고, 다음 페이지가 없으면 요청 X
    setIsLoading(true);
    try {
      const data = await getFriends(pageNum, PAGE_SIZE);
      const newFriends = data.friends || [];
      setFriends(prevFriends =>
        pageNum === 0 ? newFriends : [...prevFriends, ...newFriends],
      );
      setHasNext(data.hasNext);
    } catch (error) {
      console.error('친구 목록을 불러오는데 실패했습니다:', error);
    } finally {
      setIsLoading(false);
      setInitialLoad(true);
    }
  }, [hasNext]);

  useEffect(() => {
    fetchFriends(page);
  }, [fetchFriends, page]);

  const handleDeleteFriend = async (userId: string) => {
    try {
      await deleteFriend(userId);
      setFriends(prevFriends => prevFriends.filter(friend => friend.userId !== userId));
    } catch (error) {
      console.error("친구 삭제에 실패했습니다:", error);
      alert("친구 삭제에 실패했습니다.");
    }
  };

  if (initialLoad && friends.length === 0 && !isLoading) {
    return (
      <div className="text-center text-gray-500 py-10">
        친구 목록이 비었습니다.
      </div>
    );
  }

  return (
    <>
      <ul>
        {friends.map((friend, index) => {
          const isLastElement = friends.length === index + 1;
          return (
            <li
              ref={isLastElement ? lastFriendElementRef : null}
              key={friend.userId}
              className="flex items-center justify-between py-3 border-b"
            >
              <div className="flex items-center">
                <UserProfile
                  userId={friend.userId}
                  nickname={friend.nickname}
                  avatar={friend.avatar}
                  imageSize={40}
                  containerClassName="flex-grow"
                />
              </div>
              <button
                onClick={() => handleDeleteFriend(friend.userId)}
                className="border rounded-md px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                친구 끊기
              </button>
            </li>
          );
        })}
      </ul>
      {isLoading && (
        <div className="text-center py-4">
          친구를 불러오는 중...
        </div>
      )}
    </>
  );
};

export default FriendList; 