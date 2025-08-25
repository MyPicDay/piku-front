'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { UserProfile, FriendshipStatus } from '@/types/friend';
import {
  sendFriendRequest,
  deleteFriend,
  cancelFriendRequest,
  getProfileInfo,
} from '@/lib/api/friend';
import useAuthStore from '../store/authStore';
import { useRouter } from 'next/navigation';

interface ProfileHoverCardProps {
  userId: string;
  nickname: string;
  avatar: string;
  onStatusChange: () => void;
}

const ProfileHoverCard = ({
  userId,
  nickname,
  avatar,
  onStatusChange,
}: ProfileHoverCardProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const currentUserId = useAuthStore(state => state.user?.id);
  const router = useRouter();

  const fetchProfile = async () => {
    if (!isLoading) setIsLoading(true);
    try {
      const data = await getProfileInfo(userId);
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile info:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleFriendAction = async (action: () => Promise<any>) => {
    setIsActionLoading(true);
    try {
      await action();
      await fetchProfile(); // 자신의 상태 갱신
      onStatusChange(); // 부모(피드) 상태 갱신 요청
    } catch (error) {
      console.error('Friend action failed', error);
      alert('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddFriend = () => handleFriendAction(() => sendFriendRequest(userId));
  const handleRemoveFriend = () => {
    if (window.confirm('정말로 친구를 끊으시겠습니까?')) {
      handleFriendAction(() => deleteFriend(userId));
    }
  };
  const handleCancelRequest = () => handleFriendAction(() => cancelFriendRequest(userId));

  const renderButton = () => {
    if (!profile) return null;
    if (userId === currentUserId) return null;

    const friendshipStatus = profile.friendStatus ?? FriendshipStatus.NONE;

    const buttonProps = {
      base: 'w-full px-4 py-2 text-sm font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors',
      colors: '',
      text: '',
      action: () => {},
    };

    switch (friendshipStatus) {
      case FriendshipStatus.NONE:
        buttonProps.colors = 'bg-blue-500 hover:bg-blue-600';
        buttonProps.text = '친구 추가';
        buttonProps.action = handleAddFriend;
        break;
      case FriendshipStatus.FRIEND:
        buttonProps.colors = 'bg-red-500 hover:bg-red-600';
        buttonProps.text = '친구 끊기';
        buttonProps.action = handleRemoveFriend;
        break;
      case FriendshipStatus.SENT:
        buttonProps.colors = 'bg-green-500 hover:bg-green-600';
        buttonProps.text = '친구 요청 취소';
        buttonProps.action = handleCancelRequest;
        break;
      case FriendshipStatus.RECEIVED:
        buttonProps.colors = 'bg-yellow-500 hover:bg-yellow-600';
        buttonProps.text = '요청 확인';
        buttonProps.action = () => router.push('/friends');
        break;
      default:
        return null;
    }

    return (
      <button
        onClick={(e) => { e.stopPropagation(); buttonProps.action(); }}
        disabled={isActionLoading}
        className={`${buttonProps.base} ${buttonProps.colors}`}
      >
        {isActionLoading ? '처리 중...' : buttonProps.text}
      </button>
    );
  };
  
  const renderContent = () => {
    if (isLoading) return <p className="p-4 text-center text-sm">로딩 중...</p>;
    if (!profile) return <p className="p-4 text-center text-sm">정보를 불러올 수 없습니다.</p>;

    return (
      <>
        <div className="my-3 flex justify-around text-center">
          <div>
            <p className="font-bold">{profile.diaryCount}</p>
            <p className="text-sm text-gray-500">일기</p>
          </div>
          <div>
            <p className="font-bold">{profile.friendCount}</p>
            <p className="text-sm text-gray-500">친구</p>
          </div>
        </div>
        <div className="mt-2">{renderButton()}</div>
      </>
    );
  };

  return (
    <div className="w-64 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-2xl backdrop-blur-lg dark:border-gray-700 dark:bg-gray-900/80 dark:shadow-black/50">
      <div className="flex items-center gap-3">
        <Image
          src={avatar || 'https://via.placeholder.com/48'}
          alt={nickname}
          width={60}
          height={60}
          className="rounded-full w-12 h-12"
        />
        <div>
          <p className="font-semibold">{nickname}</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

const MotionProfileHoverCard = (props: ProfileHoverCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
    className="absolute left-0 top-full z-10"
  >
    <ProfileHoverCard {...props} />
  </motion.div>
);

export default MotionProfileHoverCard; 