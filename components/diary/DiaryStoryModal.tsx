'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import type { DiaryDetail } from '@/types/diary';
import type { Comment } from '@/types/comment';
import { createComment, getRootComments, getReplies } from '@/api/comment';
import { formatTimeAgo } from '@/lib/utils/date';
import { getServerURL } from '@/lib/utils/url';
import useAuthStore from '@/components/store/authStore';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

interface DiaryStoryModalProps {
  diary: DiaryDetail;
  onClose: () => void;
}

interface CommentRepliesState {
  list: Comment[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isShown: boolean;
}

const DiaryStoryModal = ({ diary, onClose }: DiaryStoryModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReplies, setCommentReplies] = useState<
    Record<number, CommentRepliesState>
  >({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [totalComments, setTotalComments] = useState(diary.commentCount);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [scrollToCommentId, setScrollToCommentId] = useState<number | null>(
    null,
  );
  const [isCommentViewOpen, setIsCommentViewOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const { isLoggedIn, user } = useAuthStore();
  const serverUrl = getServerURL();

  const fetchComments = async (isNewFetch: boolean = false) => {
    if (isLoadingComments || (!hasMore && !isNewFetch)) return;
    setIsLoadingComments(true);
    const pageToFetch = isNewFetch ? 0 : page;
    try {
      const data = await getRootComments(diary.diaryId, pageToFetch, 10);
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
      setIsLoadingComments(false);
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
    if (diary.diaryId) {
      fetchComments(true);
    }
  }, [diary.diaryId]);

  useEffect(() => {
    if (scrollToCommentId) {
      const element = document.getElementById(`comment-${scrollToCommentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setScrollToCommentId(null);
    }
  }, [scrollToCommentId, comments, commentReplies, isCommentViewOpen]);

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
      diaryId: diary.diaryId,
      userId: String(user.id),
      nickname: user.nickname || '사용자',
      avatar: user.avatar || `${serverUrl}/globe.svg`,
      content: contentToSend.trim(),
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replyCount: 0,
    };

    setTotalComments(prev => prev + 1);
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
        diaryId: diary.diaryId,
        content: contentToSend.trim(),
        parentId,
      });

      const finalComment = { ...optimisticComment, ...newCommentData };

      if (isReply && parentId) {
        setCommentReplies(prev => {
          const newReplies = prev[parentId].list.map(c =>
            c.id === tempId ? finalComment : c,
          );
          return { ...prev, [parentId]: { ...prev[parentId], list: newReplies } };
        });
      } else {
        setComments(prev =>
          prev.map(c => (c.id === tempId ? finalComment : c)),
        );
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
      // Revert optimistic update
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevImage = () => {
    if (diary.imgUrls && diary.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === 0 ? diary.imgUrls.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = () => {
    if (diary.imgUrls && diary.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === diary.imgUrls.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50 && info.velocity.y < -200) {
      setIsCommentViewOpen(true);
    }
  };

  const handleCommentViewDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > 50 && info.velocity.y > 200) {
      setIsCommentViewOpen(false);
    }
  };

  const DEFAULT_AVATAR = `${serverUrl}/globe.svg`;
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = DEFAULT_AVATAR;
  };

  const displayImage = diary.imgUrls?.[currentImageIndex] || '/vercel.svg';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center">
          <img
            src={diary.avatar || DEFAULT_AVATAR}
            alt={diary.nickname}
            width={32}
            height={32}
            className="rounded-full"
            onError={handleAvatarError}
          />
          <p className="ml-3 text-sm font-bold text-white">{diary.nickname}</p>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X size={28} />
        </button>
      </div>

      {/* Image Viewer */}
      <div className="relative h-full w-full">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentImageIndex}
            className="h-full w-full"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={displayImage}
              alt="Diary image"
              fill
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image Navigation */}
      {diary.imgUrls && diary.imgUrls.length > 1 && (
        <>
          <button
            onClick={handlePrevImage}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 p-2 text-white transition-opacity hover:bg-black/60"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 p-2 text-white transition-opacity hover:bg-black/60"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

       {/* Comment section handle */}
       {!isCommentViewOpen && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-20 flex cursor-grab flex-col items-center p-4"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-center text-white/80">
            <ChevronUp size={20} className="mr-1" />
            <span className="text-sm">댓글 보기</span>
          </div>
          <div className="mt-1 flex items-center text-white">
            <MessageCircle size={20} className="mr-2" />
            <span>{totalComments}</span>
          </div>
        </motion.div>
      )}

      {/* Comments View */}
      <AnimatePresence>
        {isCommentViewOpen && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-30 flex h-[85%] cursor-grab flex-col rounded-t-2xl bg-white shadow-lg dark:bg-gray-800"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleCommentViewDragEnd}
          >
            <div
              className="flex-shrink-0 cursor-pointer border-b border-gray-200 p-4 text-center dark:border-gray-700"
              onClick={() => setIsCommentViewOpen(false)}
            >
              <span className="inline-block h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto p-4 no-scrollbar">
              {/* Diary Content */}
              <div className="flex items-start">
                <img
                  src={diary.avatar || DEFAULT_AVATAR}
                  alt={diary.nickname}
                  width={32}
                  height={32}
                  className="mr-3 mt-1 rounded-full"
                  onError={handleAvatarError}
                />
                <div>
                  <p className="whitespace-pre-wrap text-sm dark:text-white">
                    <span className="font-bold">{diary.nickname}</span>{' '}
                    {diary.content}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {formatTimeAgo(diary.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Comments */}
              {isLoadingComments && <div className="py-2 text-center text-gray-500">댓글을 불러오는 중...</div>}
              {!isLoadingComments && hasMore && (
                <div className="py-2 text-center">
                  <button onClick={() => fetchComments()} className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                    이전 댓글 더 보기 ({totalComments})
                  </button>
                </div>
              )}
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  diaryId={diary.diaryId}
                  onSetReplyTo={handleSetReplyTo}
                  replies={commentReplies[comment.id]?.list || []}
                  replyState={commentReplies[comment.id]}
                  onToggleReplies={() => handleToggleReplies(comment)}
                  onFetchMoreReplies={() => handleFetchReplies(comment.id)}
                />
              ))}
              {comments.length === 0 && !isLoadingComments && (
                <div className="py-4 text-center text-gray-500">
                  아직 댓글이 없습니다.
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <CommentInput
                inputRef={inputRef as React.RefObject<HTMLInputElement>}
                onSubmit={handleCreateComment}
                placeholder={replyTo ? `@${replyTo.nickname}님에게 답글 남기기` : '댓글 달기...'}
                value={newComment}
                onChange={setNewComment}
                isSubmitting={isSubmitting}
                onCancelReply={replyTo ? cancelReply : undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DiaryStoryModal; 