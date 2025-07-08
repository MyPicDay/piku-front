'use client';

import { useState, useEffect } from 'react';
import type { DiaryDetail } from '@/types/diary';
import type { Comment } from '@/types/comment';
import { createComment, getRootComments } from '@/api/comment';
import useAuthStore from '@/components/store/authStore';
import { formatTimeAgo } from '@/lib/utils/date';
import { X, Heart } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface CommentModalProps {
  diary: DiaryDetail;
  onClose: () => void;
}

const CommentModal = ({ diary, onClose }: CommentModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [totalComments, setTotalComments] = useState(diary.commentCount);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isLoggedIn } = useAuthStore();

  const fetchComments = async (reset = false) => {
    if (isLoading || (!hasMore && !reset)) return;

    setIsLoading(true);
    const pageToFetch = reset ? 0 : page;

    try {
      const data = await getRootComments(diary.diaryId, pageToFetch, 10);
      setComments(prev => (reset ? data.content : [...prev, ...data.content]));
      setPage(pageToFetch + 1);
      setHasMore(!data.last);
      setTotalComments(data.totalElements);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(true);
  }, []);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting || !isLoggedIn || !user) return;
    setIsSubmitting(true);
    
    const tempId = Date.now();
    const optimisticComment: Comment = {
      id: tempId,
      diaryId: diary.diaryId,
      userId: String(user.id),
      nickname: user.nickname || '사용자',
      avatar: user.avatar,
      content: newComment.trim(),
      parentId: null,
      createdAt: new Date().toISOString(),
      replyCount: 0,
    };

    setComments(prev => [optimisticComment, ...prev]);
    setTotalComments(prev => prev + 1);
    setNewComment('');

    try {
      const createdComment = await createComment({
        diaryId: diary.diaryId,
        content: newComment.trim(),
      });
      setComments(prev =>
        prev.map(c =>
          c.id === tempId
            ? {
                ...c,
                id: createdComment.id,
                content: createdComment.content,
                createdAt: createdComment.createdAt,
              }
            : c,
        ),
      );
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      setComments(prev => prev.filter(c => c.id !== tempId));
      setTotalComments(prev => prev - 1);
      // Revert input for user to retry
      setNewComment(optimisticComment.content);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl min-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            댓글 {totalComments}개
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {hasMore && !isLoading && (
            <div className="text-center py-4">
              <button
                onClick={() => fetchComments()}
                className="text-blue-500 font-semibold"
              >
                이전 댓글 더 보기
              </button>
            </div>
          )}
          {isLoading && <div className="text-center py-4">댓글을 불러오는 중...</div>}
          
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="flex items-start justify-between w-full"
                >
                  <div className="flex items-start space-x-3">
                    <Image
                      src={comment.avatar || '/globe.svg'}
                      alt={comment.nickname}
                      width={32}
                      height={32}
                      className="rounded-full bg-gray-200 mt-1"
                      unoptimized
                    />
                    <div className="flex-1">
                      <p className="text-sm dark:text-gray-100">
                        <span className="font-semibold dark:text-white">
                          {comment.nickname}
                        </span>{' '}
                        {comment.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                        <button className="font-semibold hover:text-gray-700 dark:hover:text-gray-300">
                          답글 달기
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 pl-4">
                    <Heart size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                <p>아직 댓글이 없습니다.</p>
                <p>가장 먼저 댓글을 남겨보세요!</p>
              </div>
            )
          )}
        </div>

        <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1 bg-transparent focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              onKeyPress={e => e.key === 'Enter' && handleSubmit()}
              disabled={isSubmitting}
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="flex-shrink-0 text-blue-500 hover:text-blue-700 disabled:text-gray-500 dark:disabled:text-gray-400 font-bold text-sm transition-colors"
            >
              {isSubmitting ? '게시 중...' : '게시'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CommentModal; 