import { FeedDiary } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';
import Image from 'next/image';
import { formatTimeAgo, formatYearMonthDayDots } from '@/lib/utils/date';
import {
  BookmarkIcon,
  CommentIcon,
  MoreIcon,
  ShareIcon,
} from '../icons/FeedIcons';
import { useState, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { createComment } from '@/api/comment';
import { useRouter } from 'next/navigation';
import ProfileHoverCard from './ProfileHoverCard';
import FriendActionConfirmModal from './FriendActionConfirmModal';
import {
  cancelFriendRequest,
  deleteFriend,
  sendFriendRequest,
} from '@/api/friend';
import { ChevronLeft, ChevronRight, DotIcon } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import UserProfile from '../common/UserProfile';

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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalState, setConfirmModalState] = useState<{
    actionType: 'cancel' | 'unfriend';
    onConfirm: () => void;
  } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { user } = useAuthStore();
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 200);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (post.imgUrls && post.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === 0 ? post.imgUrls.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (post.imgUrls && post.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === post.imgUrls.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNextImage(),
    onSwipedRight: () => handlePrevImage(),
    trackMouse: true,
  });

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
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error('Friend action failed:', error);
      alert('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderFriendButton = () => {
    if (!user || user.id === post.userId) return null;

    const friendshipStatus = post.friendStatus ?? FriendshipStatus.NONE;
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
          setConfirmModalState({
            actionType: 'unfriend',
            onConfirm: () =>
              handleFriendAction(
                () => deleteFriend(post.userId),
                FriendshipStatus.NONE,
              ),
          });
          setIsConfirmModalOpen(true);
        };
        break;
      case FriendshipStatus.SENT:
        text = '요청 취소';
        action = () => {
          setConfirmModalState({
            actionType: 'cancel',
            onConfirm: () =>
              handleFriendAction(
                () => cancelFriendRequest(post.userId),
                FriendshipStatus.NONE,
              ),
          });
          setIsConfirmModalOpen(true);
        };
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
    post.imgUrls?.[currentImageIndex] || 'https://via.placeholder.com/600';

  return (
    <>
      <div className="w-full rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between p-3">
          <div className="relative flex items-center">
            <div
              className="flex cursor-pointer items-center"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <UserProfile
                userId={post.userId}
                nickname={post.nickname}
                avatar={post.avatar}
              />
            </div>
            <div className="flex items-center">
              <DotIcon />
              <span
                  className="text-xs text-gray-500"
                  title={new Date(post.createdAt).toLocaleString()}
                >
                  {formatTimeAgo(post.createdAt)}
                </span>
            </div>
            <div>
              {renderFriendButton()}
            </div>

            {isHovering && (
              <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <ProfileHoverCard
                  userId={post.userId}
                  nickname={post.nickname}
                  avatar={post.avatar}
                  onStatusChange={() =>
                    onFriendshipStatusChange(post.diaryId, post.friendStatus)
                  }
                />
          </div>
            )}
        </div>
        <button>
          <MoreIcon />
        </button>
      </div>

        <div {...swipeHandlers} className="relative aspect-square w-full">
          <div
            className="h-full w-full cursor-pointer"
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
          {post.imgUrls && post.imgUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/75"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/75"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 space-x-1.5">
                {post.imgUrls.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentImageIndex
                        ? 'bg-white'
                        : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
      </div>

      <div className="p-3">
        <div className="flex justify-between">
          <div className="flex space-x-4">
              <button onClick={onContentClick}>
              <CommentIcon />
              </button>
            {/* <button>
              <ShareIcon />
            </button> */}
          </div>
          {/* <button>
            <BookmarkIcon />
          </button> */}
        </div>
      </div>

      <div className="px-3">
        <p className="truncate text-sm">
          <UserProfile
            userId={post.userId}
            nickname={post.nickname}
            avatar={post.avatar}
            containerClassName="inline-flex mr-1"
            imageSize={16}
            nicknameClassName="font-semibold"
          />
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
      {confirmModalState && (
        <FriendActionConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={confirmModalState.onConfirm}
          actionType={confirmModalState.actionType}
          nickname={post.nickname}
          avatar={post.avatar || 'https://via.placeholder.com/96'}
          isLoading={isActionLoading}
        />
      )}
    </>
  );
};

export default FeedCard; 