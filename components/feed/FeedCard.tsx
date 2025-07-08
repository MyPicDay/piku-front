import { FeedDiary } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';
import Image from 'next/image';
import { formatTimeAgo, formatYearMonthDayDots } from '@/lib/utils/date';
import { BookmarkIcon, CommentIcon, MoreIcon, ShareIcon } from '../icons/FeedIcons';
import { useState, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { createComment } from '@/api/comment';
import { useRouter } from 'next/navigation';
import ProfileHoverCard from './ProfileHoverCard';
import {
  cancelFriendRequest,
  deleteFriend,
  sendFriendRequest,
} from '@/api/friend';

interface FeedCardProps {
  post: FeedDiary;
  onFriendshipStatusChange: (
    diaryId: number,
    newStatus: FriendshipStatus,
  ) => void;
  onContentClick: () => void;
}

const FeedCard = ({
  post,
  onFriendshipStatusChange,
  onContentClick,
}: FeedCardProps) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setIsHovering(false), 200);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    const trimmedComment = comment.trim();
    if (!trimmedComment || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createComment({ diaryId: post.diaryId, content: trimmedComment });
      setComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFriendAction = async (
    action: () => Promise<any>,
    newStatus: FriendshipStatus,
  ) => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      await action();
      onFriendshipStatusChange(post.diaryId, newStatus);
    } catch (error) {
      console.error('Friend action failed:', error);
      alert('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderFriendButton = () => {
    if (!user || user.id === post.userId) return null;

    const friendshipStatus = post.friendshipStatus ?? FriendshipStatus.NONE;
    let text = '';
    let action: (() => void) | null = null;

    switch (friendshipStatus) {
      case FriendshipStatus.NONE:
        text = '친구 추가';
        action = () =>
          handleFriendAction(
            () => sendFriendRequest(post.userId),
            FriendshipStatus.SENT,
          );
        break;
      case FriendshipStatus.FRIEND:
        text = '친구 끊기';
        action = () => {
          if (window.confirm('정말로 친구를 끊으시겠습니까?')) {
            handleFriendAction(
              () => deleteFriend(post.userId),
              FriendshipStatus.NONE,
            );
          }
        };
        break;
      case FriendshipStatus.SENT:
        text = '요청 취소';
        action = () =>
          handleFriendAction(
            () => cancelFriendRequest(post.userId),
            FriendshipStatus.NONE,
          );
        break;
      case FriendshipStatus.RECEIVED:
        text = '요청 확인';
        action = () => router.push('/friends');
        break;
      default:
        return null;
    }

    return (
      <button
        onClick={e => {
          e.stopPropagation();
          action?.();
        }}
        disabled={isActionLoading}
        className="ml-2 text-xs font-semibold text-blue-500 hover:text-blue-600 disabled:text-gray-400"
      >
        {isActionLoading ? '...' : text}
      </button>
    );
  };

  const photoUrl =
    post.imgUrls?.length > 0 ? post.imgUrls[0] : 'https://via.placeholder.com/600';
  const avatarUrl = post.avatar || 'https://via.placeholder.com/32';

  return (
    <div className="w-full rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between p-3">
        <div
          className="relative flex items-center"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Image
            src={avatarUrl}
            alt={post.nickname}
            width={50}
            height={50}
            className="rounded-full object-cover"
            unoptimized
          />
          <div className="ml-3">
            <div className="flex items-center">
              <p className="text-sm font-semibold">{post.nickname}</p>
              {renderFriendButton()}
            </div>
            <p className="text-xs text-gray-500">
              {formatYearMonthDayDots(post.date)}
            </p>
          </div>
          {isHovering && (
            <ProfileHoverCard
              userId={post.userId}
              nickname={post.nickname}
              avatar={post.avatar}
              onStatusChange={() =>
                onFriendshipStatusChange(post.diaryId, post.friendshipStatus)
              }
            />
          )}
        </div>
        <button>
          <MoreIcon />
        </button>
      </div>

      <div
        className="relative aspect-square w-full cursor-pointer"
        onClick={onContentClick}
      >
        <Image
          src={photoUrl}
          alt="Diary image"
          fill
          style={{ objectFit: 'cover' }}
          unoptimized
          priority 
        />
      </div>

      <div className="p-3">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <button onClick={onContentClick}>
              <CommentIcon />
            </button>
            <button>
              <ShareIcon />
            </button>
          </div>
          <button>
            <BookmarkIcon />
          </button>
        </div>
      </div>

      <div className="px-3">
        <p className="truncate text-sm">
          <span className="mr-1 font-semibold">{post.nickname}</span>
          {post.content}
        </p>
      </div>

      <div className="px-3 pt-1">
        <div onClick={onContentClick} className="cursor-pointer">
          <p className="text-sm text-gray-500">View comments</p>
        </div>
      </div>

      <div className="px-3 pt-1">
        <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
      </div>

      <form
        onSubmit={handleCommentSubmit}
        className="mt-2 flex items-center justify-between border-t border-gray-200 p-3 dark:border-gray-700"
      >
        <div className="flex flex-1 items-center space-x-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full border-none bg-transparent text-sm focus:outline-none"
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          disabled={!comment.trim() || isSubmitting}
          className="text-sm font-semibold text-blue-500 disabled:text-gray-400"
        >
          {isSubmitting ? '게시 중...' : '게시'}
        </button>
      </form>
    </div>
  );
};

export default FeedCard; 