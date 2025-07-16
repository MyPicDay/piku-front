'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import type { DiaryDetail } from '@/types/diary';
import type { Comment } from '@/types/comment';
import NotReadyModal from '@/components/common/NotReadyModal';
import {
  createComment,
  getRootComments,
  getReplies,
} from '@/api/comment';
import { formatTimeAgo, formatYearMonthDay } from '@/lib/utils/date';
import { getServerURL } from '@/lib/utils/url';
import useAuthStore from '@/components/store/authStore';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

interface DiaryDetailModalProps {
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

const DiaryDetailModal = ({ diary, onClose }: DiaryDetailModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  const [isNotReadyModalOpen, setIsNotReadyModalOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (scrollToCommentId) {
      const element = document.getElementById(`comment-${scrollToCommentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setScrollToCommentId(null);
    }
  }, [scrollToCommentId, comments, commentReplies]);

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
      // Fetch replies only if they haven't been loaded yet
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
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

    const originalNewComment = newComment;
    const originalReplyTo = replyTo;

    // 낙관적 업데이트
    setTotalComments(prev => prev + 1);

    if (isReply && parentId) {
      // 부모 댓글의 답글 수 업데이트
      setComments(prev =>
        prev.map(c =>
          c.id === parentId ? { ...c, replyCount: c.replyCount + 1 } : c,
        ),
      );
      // 답글 목록에 새 답글 추가
      const parentState = commentReplies[parentId] || {
        list: [],
        page: 0,
        hasMore: true,
        isLoading: false,
        isShown: true, // 답글을 다는 시점이니, 보여주는게 자연스러움
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
      // 새 루트 댓글 추가
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

      // 성공: 임시 댓글을 서버 응답으로 교체
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
      // 실패: 낙관적 업데이트 되돌리기
      setTotalComments(prev => prev - 1);
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

  if (!diary) return null;

  const handleEditClick = () => {
    router.push(`/diary/edit/${diary.diaryId}`);
    onClose();
  };

  const handleShareClick = () => {
    setIsMenuOpen(false);
    setIsNotReadyModalOpen(true);
  };

  const handleReportClick = () => {
    setIsMenuOpen(false);
    setIsNotReadyModalOpen(true);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (diary.imgUrls && diary.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === 0 ? diary.imgUrls.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (diary.imgUrls && diary.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === diary.imgUrls.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const DEFAULT_AVATAR = 'globe.svg';

  const handleAvatarError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = DEFAULT_AVATAR;
  };

  const displayImage = diary.imgUrls?.[currentImageIndex] || '/vercel.svg';

  const displayDate = formatYearMonthDay(diary.date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      {isNotReadyModalOpen && (
        <NotReadyModal onClose={() => setIsNotReadyModalOpen(false)} />
      )}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-white hover:text-gray-300"
      >
        <X size={32} />
      </button>
      <div
        className="flex h-[90vh] w-full max-w-9/10 overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Left side: Image */}
        <div className="relative h-full w-3/5 bg-black">
          <Image
            src={displayImage}
            alt="Diary image"
            fill
            style={{ objectFit: 'contain' }}
            unoptimized
          />
          {diary.imgUrls && diary.imgUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:bg-black/80"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:bg-black/80"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Right side: Content and Comments */}
        <div className="flex h-full w-2/5 flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center">
              <img
                src={diary.avatar || DEFAULT_AVATAR}
                alt={diary.nickname}
                width={32}
                height={32}
                className="rounded-full"
                onError={handleAvatarError}
              />
              <p className="ml-3 text-sm font-bold dark:text-white">
                {diary.nickname}
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="cursor-pointer hover:opacity-60 dark:text-white"
              >
                <MoreHorizontal size={24} />
              </button>
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  {user?.id === diary.userId && (
                    <button
                      onClick={handleEditClick}
                      className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      일기 수정
                    </button>
                  )}
                  <button
                    onClick={handleShareClick}
                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    공유하기
                  </button>
                  <button
                    onClick={handleReportClick}
                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    신고
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section (scrollable) */}
          <div className="flex-grow space-y-4 overflow-y-auto p-4">
            {/* 일기 내용 (첫 번째 댓글로 표시) */}
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
                <p className="text-sm dark:text-white whitespace-pre-wrap">
                  <span className="font-bold">{diary.nickname}</span>{' '}
                  {diary.content}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {formatTimeAgo(diary.createdAt)}
                </p>
              </div>
            </div>

            {/* 댓글 더보기 버튼 */}
            {isLoadingComments && (
              <div className="py-2 text-center text-gray-500">
                댓글을 불러오는 중...
              </div>
            )}
            {!isLoadingComments && hasMore && (
              <div className="py-2 text-center">
                <button
                  onClick={() => fetchComments()}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  이전 댓글 더 보기 ({totalComments})
                </button>
              </div>
            )}

            {/* 실제 댓글 목록 */}
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
                아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <button className="hover:opacity-60 dark:text-white">
                  <Heart size={24} />
                </button>
                <button className="hover:opacity-60 dark:text-white">
                  <MessageCircle size={24} />
                </button>
                <button className="hover:opacity-60 dark:text-white">
                  <Send size={24} />
                </button>
              </div>
              <button className="hover:opacity-60 dark:text-white">
                <Bookmark size={24} />
              </button>
            </div>
            <p className="mt-2 text-sm font-bold dark:text-white">
              좋아요 {diary.likeCount}개
            </p>
            <p className="mt-1 text-xs uppercase text-gray-500 dark:text-gray-400">
              {displayDate}
            </p>
          </div>

          {/* Comment Input */}
          <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <CommentInput
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
              onSubmit={handleCreateComment}
              placeholder={
                replyTo
                  ? `@${replyTo.nickname}님에게 답글 남기기`
                  : '댓글 달기...'
              }
              value={newComment}
              onChange={setNewComment}
              isSubmitting={isSubmitting}
              onCancelReply={replyTo ? cancelReply : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryDetailModal; 