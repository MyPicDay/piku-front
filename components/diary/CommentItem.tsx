'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';

import type { Comment } from '@/types/comment';
import { formatTimeAgo } from '@/lib/utils/date';

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
}

const CommentItem = ({
  comment,
  diaryId,
  onSetReplyTo,
  replies,
  replyState,
  onToggleReplies,
  onFetchMoreReplies,
}: CommentItemProps) => {
  const showReplies = replyState?.isShown ?? false;
  const isLoading = replyState?.isLoading ?? false;
  const hasMore = replyState?.hasMore ?? false;

  return (
    <div
      id={`comment-${comment.id}`}
      className="flex w-full items-start justify-between scroll-mt-20"
    >
      <div className="flex w-full items-start space-x-3">
        <Image
          src={comment.avatar || '/globe.svg'}
          alt={comment.nickname}
          width={32}
          height={32}
          className="mt-1 rounded-full bg-gray-200"
          unoptimized
        />
        <div className="flex-1">
          <p className="text-sm dark:text-gray-100">
            <span className="font-semibold dark:text-white">
              {comment.nickname}
            </span>{' '}
            {comment.content}
          </p>
          <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
            <span>{formatTimeAgo(comment.createdAt)}</span>
            {comment.parentId === null && (
              <button
                onClick={() => onSetReplyTo(comment)}
                className="font-semibold hover:text-gray-700"
              >
                답글 달기
              </button>
            )}
          </div>

          {comment.replyCount > 0 && !showReplies && (
            <button
              onClick={onToggleReplies}
              className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
            >
              ━━ 답글 보기 ({comment.replyCount}개)
            </button>
          )}

          {showReplies && (
            <>
              <button
                onClick={onToggleReplies}
                className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                ━━ 답글 숨기기
              </button>
              <div className="mt-3 space-y-3">
                {replies.map(reply => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    diaryId={diaryId}
                    onSetReplyTo={onSetReplyTo}
                    // 답글의 답글은 렌더링하지 않으므로 빈 배열과 더미 함수 전달
                    replies={[]}
                    onToggleReplies={() => {}}
                    onFetchMoreReplies={() => {}}
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
      <button className="pl-4 text-gray-400 hover:text-red-500">
        <Heart size={16} />
      </button>
    </div>
  );
};

export default CommentItem; 