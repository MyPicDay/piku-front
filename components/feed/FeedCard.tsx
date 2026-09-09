import { FeedDiary } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';
import Image from 'next/image';
import { formatYearMonthDayDots } from '@/lib/utils/date';
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  MoreIcon,
} from '../icons/FeedIcons';
import { useRef, useState } from 'react';
import useAuthStore from '../store/authStore';
import { createComment } from '@/lib/api/comment';
import { useRouter } from 'next/navigation';
import ProfileHoverCard from './ProfileHoverCard';
import FriendActionConfirmModal from './FriendActionConfirmModal';
import {
  cancelFriendRequest,
  deleteFriend,
  sendFriendRequest,
} from '@/lib/api/friend';
import { ChevronLeft, ChevronRight, DotIcon, Loader2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import UserProfile from '../common/UserProfile';
import Link from 'next/link';
import { isAnonymousDiaryIdentity } from '@/lib/utils/privacy';
import AnonymousProfileIcon from '@/components/common/AnonymousProfileIcon';
import { useDiaryShare } from '@/hooks/useDiaryShare';
import DiaryShareButton from '@/components/diary/DiaryShareButton';
import DiaryShareDialog from '@/components/diary/DiaryShareDialog';

interface FeedCardProps {
  post: FeedDiary;
  onFriendshipStatusChange: (
    diaryId: number,
    newStatus: FriendshipStatus,
  ) => void;
  onContentClick: () => void;
  onCommentClick: () => void;
  onLikeToggle: (diaryId: number) => void;
  onCommentCreated?: (diaryId: number) => void;
  isMobile: boolean;
}

const TEXT_PREVIEW_CHARACTER_LIMIT = 100;
const TEXT_PREVIEW_LINE_LIMIT = 5;

const FeedCard = ({
  post,
  onFriendshipStatusChange,
  onContentClick,
  onCommentClick,
  onLikeToggle,
  onCommentCreated,
  isMobile,
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
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const textDetailButtonRef = useRef<HTMLButtonElement>(null);

  const { user } = useAuthStore();
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnonymousPost = isAnonymousDiaryIdentity(post);
  const displayNickname = isAnonymousPost ? '익명' : post.nickname;
  const diaryShare = useDiaryShare(post.diaryId, post.status);

  const handleMouseEnter = () => {
    if (isAnonymousPost) return;
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
    if (post.imgUrls && post.imgUrls.length > 0 && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (post.imgUrls && post.imgUrls.length > 0 && currentImageIndex < post.imgUrls.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
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
      onCommentCreated?.(post.diaryId);
      setComment('');
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Friend action failed:', error);
      if (error?.response?.status != 403) {
        alert('요청 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderFriendButton = () => {
    if (!user || isAnonymousPost || !post.userId || user.id === post.userId) {
      return null;
    }

    const postUserId = post.userId;

    const friendshipStatus = post.friendStatus ?? FriendshipStatus.NONE;
    let text = '';
    let action: (() => void) | null = null;

    switch (friendshipStatus) {
      case FriendshipStatus.NONE:
        text = '친구 추가';
        action = () =>
          handleFriendAction(
            () => sendFriendRequest(postUserId),
            FriendshipStatus.SENT,
          );
        break;
      // case FriendshipStatus.FRIEND:
      //   text = '친구 끊기';
      //   action = () => {
      //     setConfirmModalState({
      //       actionType: 'unfriend',
      //       onConfirm: () =>
      //         handleFriendAction(
      //           () => deleteFriend(post.userId),
      //           FriendshipStatus.NONE,
      //         ),
      //     });
      //     setIsConfirmModalOpen(true);
      //   };
      //   break;
      case FriendshipStatus.SENT:
        text = '요청 취소';
        action = () => {
          setConfirmModalState({
            actionType: 'cancel',
            onConfirm: () =>
              handleFriendAction(
                () => cancelFriendRequest(postUserId),
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

    const loadingLabelByStatus: Partial<Record<FriendshipStatus, string>> = {
      [FriendshipStatus.NONE]: '친구 요청 처리 중',
      [FriendshipStatus.SENT]: '친구 요청 취소 처리 중',
      [FriendshipStatus.FRIEND]: '친구 끊기 처리 중',
    };

    return (
      <button
        onClick={e => {
          e.stopPropagation();
          action?.();
        }}
        disabled={isActionLoading}
        aria-label={
          isActionLoading ? loadingLabelByStatus[friendshipStatus] : undefined
        }
        className="ml-2 inline-flex min-w-[52px] items-center justify-center text-xs font-semibold text-blue-500 hover:text-blue-600 disabled:text-gray-400"
      >
        {isActionLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          text
        )}
      </button>
    );
  };

  const photoUrl =
    post.imgUrls[currentImageIndex] ?? post.imgUrls[0];
  const shouldShowTextMore =
    post.content.length > TEXT_PREVIEW_CHARACTER_LIMIT ||
    post.content.split(/\r\n|\r|\n/).length > TEXT_PREVIEW_LINE_LIMIT;

  const handleTextContentExpand = () => {
    setIsContentExpanded(true);
    textDetailButtonRef.current?.focus();
  };

  return (
    <>
      {/* <div className="w-full rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"> */}
      <div
        data-testid="feed-card"
        className="w-full rounded-xl border border-gray-200 bg-white shadow-md p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex items-center justify-between p-3">
          <div className="relative flex items-center">
            {isAnonymousPost || !post.userId ? (
              <span className="inline-flex items-center gap-2">
                <AnonymousProfileIcon className="h-8 w-8" />
                <span className="text-sm font-semibold">{displayNickname}</span>
              </span>
            ) : (
              <div
                className="flex cursor-pointer items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <UserProfile
                  userId={post.userId}
                  nickname={displayNickname}
                  avatar={post.avatar}
                />
              </div>
            )}
            <div className="flex items-center">
              <DotIcon />
              <span
                  className="text-xs text-gray-500"
                  title={new Date(post.date).toLocaleString()}
                >
                  {formatYearMonthDayDots(post.date)}
                </span>
            </div>
            <div>
              {renderFriendButton()}
            </div>

            {isHovering && !isAnonymousPost && post.userId && (
              <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <ProfileHoverCard
                  userId={post.userId}
                  nickname={displayNickname}
                  avatar={post.avatar}
                  onStatusChange={() =>
                    onFriendshipStatusChange(post.diaryId, post.friendStatus)
                  }
                />
          </div>
            )}
        </div>
        {/* <button>
          <MoreIcon />
        </button> */}
      </div>

      {photoUrl ? (
        <div {...swipeHandlers} className="relative aspect-square w-full">
          <div
            className="h-full w-full cursor-pointer"
            onClick={onContentClick}
          >
            <Image
              src={photoUrl}
              alt="Diary image"
              fill
              className="rounded"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          {post.imgUrls.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/75"
                >
                  <ChevronLeft size={20} className="cursor-pointer" />
                </button>
              )}
              {currentImageIndex < post.imgUrls.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/75"
                >
                  <ChevronRight size={20} className="cursor-pointer" />
                </button>
              )}
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
      ) : (
        <div className="border-y border-gray-100 px-5 py-6 dark:border-gray-700">
          <button
            ref={textDetailButtonRef}
            type="button"
            aria-label="일기 상세 보기"
            aria-describedby={`feed-text-content-${post.diaryId}`}
            onClick={onContentClick}
            className="block w-full text-left"
          >
            <span className="flex items-center gap-2 text-[10px] font-semibold tracking-wide text-amber-700 dark:text-yellow-300">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-yellow-400"
              />
              오늘의 일기
            </span>
            <span
              id={`feed-text-content-${post.diaryId}`}
              className={`mt-3 whitespace-pre-wrap break-words text-[15px] leading-[1.7] text-gray-900 dark:text-gray-100 ${
                isContentExpanded ? 'block' : 'line-clamp-5'
              }`}
            >
              {post.content}
            </span>
          </button>
          {shouldShowTextMore && !isContentExpanded && (
            <button
              type="button"
              aria-controls={`feed-text-content-${post.diaryId}`}
              aria-expanded={isContentExpanded}
              onClick={handleTextContentExpand}
              className="mt-2 inline-flex min-h-8 items-center text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              더 보기
            </button>
          )}
          {isContentExpanded && (
            <span
              role="status"
              aria-label="일기 전체 내용이 펼쳐졌습니다."
              className="sr-only"
            >
              일기 전체 내용이 펼쳐졌습니다.
            </span>
          )}
        </div>
      )}

      <div className="p-3">
        <div className="flex justify-between">
          <div className="flex space-x-3">
            <button
              className="flex items-center space-x-1"
              onClick={() => onLikeToggle(post.diaryId)}
            >
              <HeartIcon filled={post.isLiked} />
              <span className="font-bold">{post.likeCount}</span>
            </button>
            <button
              className="flex items-center space-x-1"
              onClick={isMobile ? onCommentClick : onContentClick}
            >
              <CommentIcon />
              <span className="font-bold">{post.commentCount}</span>
            </button>
            {diaryShare.visible && (
              <DiaryShareButton
                status={post.status}
                pending={diaryShare.pending}
                onShare={diaryShare.open}
              />
            )}
          </div>
          {/* <button>
            <BookmarkIcon />
          </button> */}
        </div>
        <DiaryShareDialog
          controller={diaryShare}
          status={post.status}
        />
      </div>

      {photoUrl && (
        <div className="px-3">
          {isContentExpanded ? (
            <p className="text-sm whitespace-pre-wrap">
              {isAnonymousPost ? (
                <span className="mr-1 font-semibold">{displayNickname}</span>
              ) : (
                <Link
                  href={`/profile/${post.userId}`}
                  className="mr-1 font-semibold hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  {displayNickname}
                </Link>
              )}{' '}
              {post.content}
            </p>
          ) : (
            <div className="flex items-baseline text-sm">
              <p className="truncate">
                {isAnonymousPost ? (
                  <span className="mr-1 font-semibold">{displayNickname}</span>
                ) : (
                  <Link
                    href={`/profile/${post.userId}`}
                    className="mr-1 font-semibold hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {displayNickname}
                  </Link>
                )}{' '}
                <span>{post.content}</span>
              </p>
              {post.content.length > 30 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setIsContentExpanded(true);
                  }}
                  className="ml-1 flex-shrink-0 text-gray-500 cursor-pointer"
                >
                  더 보기
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
          nickname={displayNickname}
          avatar={post.avatar || 'https://via.placeholder.com/96'}
          isLoading={isActionLoading}
        />
      )}
    </>
  );
};

export default FeedCard;
