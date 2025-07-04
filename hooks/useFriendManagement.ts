import { useState, useEffect, useCallback } from 'react';
import { getFriendshipStatus, sendFriendRequest, cancelFriendRequest, deleteFriend, getFriends } from '@/api/friend';
import type { Friend, PaginatedFriendsResponse } from '@/types/friend';
import { FriendshipStatus } from '@/types/friend';

export const useFriendManagement = (currentUserId?: string) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>(FriendshipStatus.NONE);
  const [viewedUserIndex, setViewedUserIndex] = useState<number | null>(null);

  const viewedUser = viewedUserIndex !== null ? friends[viewedUserIndex] : null;

  useEffect(() => {
    const fetchAllFriends = async () => {
      try {
        let allFriends: Friend[] = [];
        let page = 0;
        let hasNext = true;
        
        while (hasNext) {
          const response: PaginatedFriendsResponse = await getFriends(page, 20); // 페이지 크기는 임의로 20으로 설정
          allFriends = [...allFriends, ...response.friends];
          hasNext = response.hasNext;
          page += 1;
        }
        
        setFriends(allFriends);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      }
    };
    fetchAllFriends();
  }, []);

  const fetchFriendStatus = useCallback(async (targetUserId: string) => {
    if (!currentUserId || targetUserId === currentUserId) return;
    
    try {
      const status = await getFriendshipStatus(targetUserId);
      setFriendshipStatus(status);
    } catch (error) {
      console.error('Failed to fetch friendship status:', error);
    }
  }, [currentUserId]);

  const handleFriendAction = async (targetUserId: string) => {
    try {
      switch (friendshipStatus) {
        case FriendshipStatus.NONE:
          await sendFriendRequest(targetUserId);
          break;
        case FriendshipStatus.REQUEST_SENT:
          await cancelFriendRequest(targetUserId);
          break;
        case FriendshipStatus.FRIEND:
          if (window.confirm('정말로 친구를 끊으시겠습니까?')) {
            await deleteFriend(targetUserId);
          }
          break;
        default:
          break;
      }
      await fetchFriendStatus(targetUserId);
    } catch (error) {
      console.error('Failed to perform friend action:', error);
    }
  };

  const nextFriend = useCallback(() => {
    if (friends.length === 0) return;
    setViewedUserIndex(prev => {
      if (prev === null) return 0;
      if (prev === friends.length - 1) return null;
      return prev + 1;
    });
  }, [friends]);

  const prevFriend = useCallback(() => {
    if (friends.length === 0) return;
    setViewedUserIndex(prev => {
      if (prev === null) return friends.length - 1;
      if (prev === 0) return null;
      return prev - 1;
    });
  }, [friends]);

  return {
    friends,
    viewedUser,
    friendshipStatus,
    fetchFriendStatus,
    handleFriendAction,
    nextFriend,
    prevFriend,
    setViewedUserIndex,
  };
}; 