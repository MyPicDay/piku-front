'use client';

import { useState, useRef, useEffect } from 'react';
import { X, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import type { Comment } from '@/types/comment';
import { createComment, getRootComments, getReplies } from '@/api/comment';
import useAuthStore from '@/components/store/authStore';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

interface CommentRepliesState {
  list: Comment[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isShown: boolean;
}

interface CommentModalProps {
  diaryId: number;
  initialCommentCount: number;
  onClose: () => void;
  onUpdateCommentCount: (newCount: number) => void;
}

const CommentModal = ({
  diaryId,
  initialCommentCount,
  onClose,
  onUpdateCommentCount,
}: CommentModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReplies, setCommentReplies] = useState<
    Record<number, CommentRepliesState>
  >({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalComments, setTotalComments] = useState(initialCommentCount);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [scrollToCommentId, setScrollToCommentId] = useState<number | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { isLoggedIn, user } = useAuthStore();

  useEffect(() => {
    if (scrollToCommentId) {
      const element = document.getElementById(`comment-${scrollToCommentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setScrollToCommentId(null);
    }
  }, [scrollToCommentId, comments, commentReplies]);

  const fetchComments = async (isNewFetch: boolean = false) => {
    if (isLoading || (!hasMore && !isNewFetch)) return;

    setIsLoading(true);
    const pageToFetch = isNewFetch ? 0 : page;

    try {
      const data = await getRootComments(diaryId, pageToFetch, 10);
      setComments(prev =>
        isNewFetch ? data.content : [...prev, ...data.content],
      );
      setPage(pageToFetch + 1);
      setHasMore(!data.last);
      if (isNewFetch) {
        setTotalComments(data.totalElements);
      }
    } catch (error) {
      console.error('댓글을 불러오는데 실패했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReplies = async (comment: Comment) => {
    const currentState = commentReplies[comment.id] || {
      isShown: false,
      list: [],
      page: 0,
      hasMore: comment.replyCount > 0,
      isLoading: false,
    };

    if (currentState.isShown) {
      setCommentReplies(prev => ({
        ...prev,
        [comment.id]: { ...currentState, isShown: false },
      }));
    } else {
      setCommentReplies(prev => ({
        ...prev,
        [comment.id]: { ...currentState, isShown: true },
      }));
      if (currentState.list.length === 0 && currentState.hasMore) {
        await handleFetchReplies(comment.id);
      }
    }
  };

  const handleFetchReplies = async (commentId: number) => {
    const currentState = commentReplies[commentId] || {
      list: [],
      page: 0,
      hasMore: true,
      isLoading: false,
      isShown: true,
    };
    if (currentState.isLoading || !currentState.hasMore) return;

    setCommentReplies(prev => ({
      ...prev,
      [commentId]: { ...currentState, isLoading: true },
    }));

    try {
      const data = await getReplies(commentId, currentState.page, 5);
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          list: [...prev[commentId].list, ...data.content],
          page: prev[commentId].page + 1,
          hasMore: !data.last,
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error('답글을 불러오는데 실패했습니다:', error);
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: { ...prev[commentId], isLoading: false },
      }));
    }
  };

  useEffect(() => {
    fetchComments(true);
  }, [diaryId]);

  const handleSetReplyTo = (comment: Comment) => {
    setReplyTo(comment);
    setNewComment(`@${comment.nickname} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };

  const handleCreateComment = async () => {
    if (!isLoggedIn || !user || !newComment.trim()) return;

    setIsSubmitting(true);
    const tempId = Date.now();
    const isReply = replyTo !== null;
    const parentId = isReply && replyTo ? replyTo.id : undefined;

    const contentToSend =
      isReply && replyTo
        ? newComment.replace(`@${replyTo.nickname} `, '')
        : newComment;

    const optimisticComment: Comment = {
      id: tempId,
      diaryId: diaryId,
      userId: String(user.id),
      nickname: user.nickname || '사용자',
      avatar: user.avatar || null,
      content: contentToSend.trim(),
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replyCount: 0,
    };

    const originalNewComment = newComment;
    const originalReplyTo = replyTo;

    // 낙관적 업데이트
    const newTotal = totalComments + 1;
    setTotalComments(newTotal);
    onUpdateCommentCount(newTotal);

    if (isReply && parentId) {
      setComments(prev =>
        prev.map(c =>
          c.id === parentId ? { ...c, replyCount: c.replyCount + 1 } : c,
        ),
      );
      const parentState = commentReplies[parentId] || {
        list: [],
        page: 0,
        hasMore: true,
        isLoading: false,
        isShown: true,
      };
      setCommentReplies(prev => ({
        ...prev,
        [parentId]: {
          ...parentState,
          list: [optimisticComment, ...parentState.list],
          isShown: true,
        },
      }));
    } else {
      setComments(prev => [optimisticComment, ...prev]);
    }

    setScrollToCommentId(tempId);

    cancelReply();

    try {
      const newCommentData = await createComment({
        diaryId,
        content: contentToSend.trim(),
        parentId,
      });

      const finalComment = { ...optimisticComment, ...newCommentData };

      if (isReply && parentId) {
        setCommentReplies(prev => {
          const newReplies = prev[parentId].list.map(c =>
            c.id === tempId ? finalComment : c,
          );
          return {
            ...prev,
            [parentId]: { ...prev[parentId], list: newReplies },
          };
        });
      } else {
        setComments(prev =>
          prev.map(c => (c.id === tempId ? finalComment : c)),
        );
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      const revertedTotal = totalComments;
      setTotalComments(revertedTotal);
      onUpdateCommentCount(revertedTotal);

      if (isReply && parentId) {
        setComments(prev =>
          prev.map(c =>
            c.id === parentId ? { ...c, replyCount: c.replyCount - 1 } : c,
          ),
        );
        setCommentReplies(prev => {
          const newReplies = prev[parentId].list.filter(c => c.id !== tempId);
          return {
            ...prev,
            [parentId]: { ...prev[parentId], list: newReplies },
          };
        });
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId));
      }

      setNewComment(originalNewComment);
      setReplyTo(originalReplyTo);
      alert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="relative flex h-auto max-h-[80vh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-gray-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="flex items-center justify-center border-b p-4 dark:border-gray-700">
          <h2 className="text-lg font-bold dark:text-white">댓글</h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow space-y-4 overflow-y-auto p-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              diaryId={diaryId}
              onSetReplyTo={handleSetReplyTo}
              replies={commentReplies[comment.id]?.list || []}
              replyState={commentReplies[comment.id]}
              onToggleReplies={() => handleToggleReplies(comment)}
              onFetchMoreReplies={() => handleFetchReplies(comment.id)}
            />
          ))}
          {isLoading && <p className="text-center">댓글 로딩 중...</p>}
          {!isLoading && hasMore && comments.length > 0 && (
            <button
              onClick={() => fetchComments()}
              className="w-full text-center text-sm text-gray-500 hover:underline"
            >
              이전 댓글 더 보기
            </button>
          )}
          {!isLoading && comments.length === 0 && (
            <p className="text-center text-gray-500">
              아직 댓글이 없습니다.
            </p>
          )}
        </div>

        <div className="border-t bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <CommentInput
            inputRef={inputRef as React.RefObject<HTMLInputElement>}
            value={newComment}
            onChange={setNewComment}
            onSubmit={handleCreateComment}
            placeholder={
              replyTo ? `@${replyTo.nickname}님에게 답글 남기기` : '댓글 달기...'
            }
            isSubmitting={isSubmitting}
            onCancelReply={replyTo ? cancelReply : undefined}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default CommentModal; 