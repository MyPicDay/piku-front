'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Friend } from '@/types/friend';
import { deleteFriend, getFriends } from '@/api/friend';

const FriendList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      const data = await getFriends();
      setFriends(data);
    };
    fetchFriends();
  }, []);

  const handleDeleteFriend = async (id: number) => {
    await deleteFriend(id);
    setFriends(friends.filter(friend => friend.id !== id));
  };

  return (
    <ul>
      {friends.map(friend => (
        <li
          key={friend.id}
          className="flex items-center justify-between py-3 border-b"
        >
          <div className="flex items-center">
            <Image
              src={friend.profileImageUrl}
              alt={friend.nickname}
              width={40}
              height={40}
              className="rounded-full mr-4"
            />
            <span>{friend.nickname}</span>
          </div>
          <button
            onClick={() => handleDeleteFriend(friend.id)}
            className="border rounded-md px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            친구 끊기
          </button>
        </li>
      ))}
    </ul>
  );
};

export default FriendList; 