'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from '@/components/store/authStore';
import type { Comment } from '@/types/comment';
import { formatTimeAgo } from '@/lib/utils/date';
import CommentActionModal from './CommentActionModal';
import NotReadyModal from '../common/NotReadyModal';
import ProfileHoverCard from '../feed/ProfileHoverCard';

interface CommentRepliesState {
  list: Comment[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isShown: boolean;
}

interface CommentItemProps {
  comment: Comment;
  diaryId: number;
  onSetReplyTo: (comment: Comment) => void;
  replies: Comment[];
  replyState?: CommentRepliesState;
  onToggleReplies: () => void;
  onFetchMoreReplies: () => void;
  onDeleteComment: (commentId: number, parentId: number | null) => void;
  onStartEdit: (comment: Comment) => void;
}

const CommentItem = ({
  comment,
  diaryId,
  onSetReplyTo,
  replies,
  replyState,
  onToggleReplies,
  onFetchMoreReplies,
  onDeleteComment,
  onStartEdit,
}: CommentItemProps) => {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isNotReadyModalOpen, setIsNotReadyModalOpen] = useState(false);
  const [longPressTimeout, setLongPressTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const [hoveredElement, setHoveredElement] = useState<
    'avatar' | 'nickname' | null
  >(null);
  const [profileCardHoverTimeout, setProfileCardHoverTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const [isCommentHovered, setIsCommentHovered] = useState(false);
  const [isRepliesHovered, setIsRepliesHovered] = useState(false);

  const { user } = useAuthStore();
  const showReplies = replyState?.isShown ?? false;
  const isLoading = replyState?.isLoading ?? false;
  const hasMore = replyState?.hasMore ?? false;

  const isOwner = user ? String(user.id) === comment.userId : false;

  const profileUrl = `/profile/${comment.userId}`;

  const handleReport = () => {
    setIsActionModalOpen(false);
    setIsNotReadyModalOpen(true);
  };

  const handleStartEdit = () => {
    setIsActionModalOpen(false);
    onStartEdit(comment);
  };

  const handleDelete = () => {
    setIsActionModalOpen(false);
    onDeleteComment(comment.id, comment.parentId);
  };

  const handleTouchStart = () => {
    if (longPressTimeout) clearTimeout(longPressTimeout);
    const timeout = setTimeout(() => {
      setIsActionModalOpen(true);
    }, 500); // 500ms for long press
    setLongPressTimeout(timeout);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout) clearTimeout(longPressTimeout);
  };

  const handleTouchMove = () => {
    if (longPressTimeout) clearTimeout(longPressTimeout);
  };

  const handleProfileMouseEnter = (element: 'avatar' | 'nickname') => {
    if (profileCardHoverTimeout) clearTimeout(profileCardHoverTimeout);

    const timeout = setTimeout(() => {
      setHoveredElement(element);
    }, 500); // 1초 지연
    setProfileCardHoverTimeout(timeout);
  };

  const handleProfileMouseLeave = () => {
    if (profileCardHoverTimeout) clearTimeout(profileCardHoverTimeout);

    const timeout = setTimeout(() => {
      setHoveredElement(null);
    }, 300);
    setProfileCardHoverTimeout(timeout);
  };

  return (
    <>
      <div
        id={`comment-${comment.id}`}
        className="flex w-full items-start justify-between scroll-mt-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setIsCommentHovered(true)}
        onMouseLeave={() => setIsCommentHovered(false)}
      >
        <div className="flex flex-1 items-start space-x-3">
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => handleProfileMouseEnter('avatar')}
            onMouseLeave={handleProfileMouseLeave}
          >
            <Link href={profileUrl}>
              <Image
                src={comment.avatar || '/globe.svg'}
                alt={comment.nickname}
                width={32}
                height={32}
                className="mt-1 rounded-full bg-gray-200"
              />
            </Link>
            <AnimatePresence>
              {hoveredElement === 'avatar' && (
                <div
                  className="absolute left-0 top-full z-10 mt-2"
                  onMouseEnter={() => handleProfileMouseEnter('avatar')}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  <ProfileHoverCard
                    userId={comment.userId}
                    nickname={comment.nickname}
                    avatar={comment.avatar || '/globe.svg'}
                    onStatusChange={() => {}}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1 ">
            <div className="text-sm dark:text-gray-100">
              <Link href={profileUrl}>
              <span
                className="relative inline-block font-semibold dark:text-white cursor-pointer"
                onMouseEnter={() => handleProfileMouseEnter('nickname')}
                onMouseLeave={handleProfileMouseLeave}
              >
                {comment.nickname}
                <AnimatePresence>
                  {hoveredElement === 'nickname' && (
                    <div
                      className="absolute left-0 top-full z-10 mt-2"
                      onMouseEnter={() => handleProfileMouseEnter('nickname')}
                      onMouseLeave={handleProfileMouseLeave}
                    >
                      <ProfileHoverCard
                        userId={comment.userId}
                        nickname={comment.nickname}
                        avatar={comment.avatar || '/globe.svg'}
                        onStatusChange={() => {}}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </span>
              </Link>
              <span className="ml-2">{comment.content}</span>
            </div>
            <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
              <span>{formatTimeAgo(comment.createdAt)}</span>
              {comment.parentId === null && (
                <button
                  onClick={() => onSetReplyTo(comment)}
                  className="font-semibold hover:text-gray-700 cursor-pointer"
                >
                  답글 달기
                </button>
              )}
              <div className="flex items-center">
            {(isCommentHovered && !isRepliesHovered) && (
              <button
                onClick={() => setIsActionModalOpen(true)}
                className="text-gray-500 transition-opacity hover:text-gray-800 dark:hover:text-white cursor-pointer"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
            </div>

            {comment.replyCount > 0 && !showReplies && (
              <button
                onClick={onToggleReplies}
                className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                ━━ 답글 보기 ({comment.replyCount}개)
              </button>
            )}

            {showReplies && (
              <>
                <button
                  onClick={onToggleReplies}
                  className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  ━━ 답글 숨기기
                </button>
                <div
                  className="mt-3 space-y-3"
                  onMouseEnter={() => setIsRepliesHovered(true)}
                  onMouseLeave={() => setIsRepliesHovered(false)}
                >
                  {replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      diaryId={diaryId}
                      onSetReplyTo={onSetReplyTo}
                      replies={[]}
                      onToggleReplies={() => {}}
                      onFetchMoreReplies={() => {}}
                      onDeleteComment={onDeleteComment}
                      onStartEdit={onStartEdit}
                    />
                  ))}
                  {isLoading && (
                    <p className="text-xs text-gray-400">답글 로딩 중...</p>
                  )}
                  {!isLoading && hasMore && (
                    <button
                      onClick={onFetchMoreReplies}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                    >
                      답글 더 보기
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {/* <div className="flex items-center pl-4">
          <button className="text-gray-400 hover:text-red-500">
            <Heart size={16} />
          </button>
        </div> */}
      </div>
      {isActionModalOpen && (
        <CommentActionModal
          onClose={() => setIsActionModalOpen(false)}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
          onReport={handleReport}
          isOwner={isOwner}
        />
      )}
      {isNotReadyModalOpen && (
        <NotReadyModal onClose={() => setIsNotReadyModalOpen(false)} />
      )}
    </>
  );
};

export default CommentItem; 