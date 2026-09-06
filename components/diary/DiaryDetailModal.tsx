'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import {
  X,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  DotIcon,
} from 'lucide-react';
import type { DiaryDetail } from '@/types/diary';
import type { Comment } from '@/types/comment';
import NotReadyModal from '@/components/common/NotReadyModal';
import {
  createComment,
  getRootComments,
  getReplies,
  deleteComment,
  updateComment,
} from '@/lib/api/comment';
import { addLike, removeLike, type LikeResponse } from '@/lib/api/like';
import { HeartIcon } from '@/components/icons/FeedIcons';
import { deleteDiary } from '@/lib/api/diary';
import { formatYearMonthDay } from '@/lib/utils/date';
import { getPrivacyLabel, isAnonymousDiaryIdentity } from '@/lib/utils/privacy';
import { getServerURL } from '@/lib/utils/url';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import useAuthStore from '@/components/store/authStore';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import MotionProfileHoverCard from '@/components/feed/ProfileHoverCard';
import AnonymousProfileIcon from '@/components/common/AnonymousProfileIcon';
import { useDiaryShare } from '@/hooks/useDiaryShare';
import DiaryShareButton from './DiaryShareButton';
import DiaryShareFeedback from './DiaryShareFeedback';

interface DiaryDetailModalProps {
  diary: DiaryDetail;
  onClose: () => void;
  onDelete?: (diaryId: number) => void;
  onCommentCountChange?: (diaryId: number, count: number) => void;
  onLikeChange?: (
    diaryId: number,
    nextLike: Pick<LikeResponse, 'likeCount' | 'isLiked'>,
  ) => void;
}

interface CommentRepliesState {
  list: Comment[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isShown: boolean;
}

const DiaryDetailModal = ({
  diary,
  onClose,
  onDelete,
  onCommentCountChange,
  onLikeChange,
}: DiaryDetailModalProps) => {
  useBodyScrollLock(true);
  const router = useRouter();

  const currentDiary = diary;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(diary.isLiked);
  const [likeCount, setLikeCount] = useState(diary.likeCount);
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
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [scrollToCommentId, setScrollToCommentId] = useState<number | null>(
    null,
  );
  const [isNotReadyModalOpen, setIsNotReadyModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  const { isLoggedIn, user } = useAuthStore();
  const serverUrl = getServerURL();
  const isAnonymousDiary = isAnonymousDiaryIdentity(currentDiary);
  const displayNickname = isAnonymousDiary ? '익명' : currentDiary.nickname;
  const profileUrl =
    !isAnonymousDiary && currentDiary.userId
      ? `/profile/${currentDiary.userId}`
      : null;
  const isOwner = currentDiary.isOwner ?? user?.id === currentDiary.userId;
  const diaryShare = useDiaryShare(currentDiary.diaryId, currentDiary.status);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsLiked(diary.isLiked);
    setLikeCount(diary.likeCount);
    setTotalComments(diary.commentCount);
  }, [diary]);

  // Hover states and handlers
  const [isHeaderHovering, setIsHeaderHovering] = useState(false);
  const headerHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isContentHovering, setIsContentHovering] = useState(false);
  const contentHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHeaderMouseEnter = () => {
    if (headerHoverTimeoutRef.current) clearTimeout(headerHoverTimeoutRef.current);
    setIsHeaderHovering(true);
  };
  const handleHeaderMouseLeave = () => {
    headerHoverTimeoutRef.current = setTimeout(() => setIsHeaderHovering(false), 200);
  };
  const handleContentMouseEnter = () => {
    if (contentHoverTimeoutRef.current) clearTimeout(contentHoverTimeoutRef.current);
    setIsContentHovering(true);
  };
  const handleContentMouseLeave = () => {
    contentHoverTimeoutRef.current = setTimeout(() => setIsContentHovering(false), 200);
  };

  const fetchComments = async (isNewFetch: boolean = false) => {
    if (isLoadingComments || (!hasMore && !isNewFetch)) return;

    setIsLoadingComments(true);
    const pageToFetch = isNewFetch ? 0 : page;

    try {
      const data = await getRootComments(currentDiary.diaryId, pageToFetch, 10);
      setComments(prev =>
        isNewFetch ? data.content : [...prev, ...data.content],
      );
      setPage(pageToFetch + 1);
      setHasMore(!data.last);
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
      setCommentReplies(prev => {
        const currentReplies = prev[commentId]?.list || [];
        const existingReplyIds = new Set(currentReplies.map(c => c.id));
        const newUniqueReplies = data.content.filter(
          c => !existingReplyIds.has(c.id),
        );

        return {
          ...prev,
          [commentId]: {
            ...prev[commentId],
            list: [...currentReplies, ...newUniqueReplies],
            page: prev[commentId].page + 1,
            hasMore: !data.last,
            isLoading: false,
          },
        };
      });
    } catch (error) {
      console.error('답글을 불러오는데 실패했습니다:', error);
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: { ...prev[commentId], isLoading: false },
      }));
    }
  };

  useEffect(() => {
    if (currentDiary.diaryId) {
      fetchComments(true);
    }
  }, [currentDiary.diaryId]);

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

  const handleStartEdit = (comment: Comment) => {
    setEditingComment(comment);
    setReplyTo(null); // 답글 모드와 수정 모드는 동시에 될 수 없음
    setNewComment(comment.content);
    inputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setNewComment('');
  };

  const handleSubmitComment = async () => {
    if (editingComment) {
      // 수정 로직
      await handleUpdateComment(editingComment.id, newComment);
      setEditingComment(null);
      setNewComment('');
    } else {
      // 생성 로직
      await handleCreateComment();
    }
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
      diaryId: currentDiary.diaryId,
      userId: isAnonymousDiary ? null : String(user.id),
      nickname: isAnonymousDiary ? '익명' : user.nickname || '사용자',
      avatar: isAnonymousDiary ? null : user.avatar || `${serverUrl}/globe.svg`,
      content: contentToSend.trim(),
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replyCount: 0,
      canReply: !isReply && !isAnonymousDiary,
      canEdit: true,
      canDelete: true,
      isPending: true,
    };

    const originalNewComment = newComment;
    const originalReplyTo = replyTo;
    const originalTotalComments = totalComments;
    const optimisticTotalComments = originalTotalComments + 1;

    // 낙관적 업데이트
    setTotalComments(optimisticTotalComments);
    onCommentCountChange?.(currentDiary.diaryId, optimisticTotalComments);

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
          list: [...parentState.list, optimisticComment],
          isShown: true,
        },
      }));
    } else {
      // 새 루트 댓글 추가
      setComments(prev => [...prev, optimisticComment]);
    }

    setScrollToCommentId(tempId);

    cancelReply();

    try {
      const newCommentData = await createComment({
        diaryId: currentDiary.diaryId,
        content: contentToSend.trim(),
        parentId,
      });

      // 성공: 임시 댓글을 서버 응답으로 교체
      const finalComment = {
        ...optimisticComment,
        ...newCommentData,
        isPending: false,
      };

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
      setTotalComments(originalTotalComments);
      onCommentCountChange?.(currentDiary.diaryId, originalTotalComments);
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

  const handleDeleteComment = async (
    commentId: number,
    parentId: number | null,
  ) => {
    const originalComments = comments;
    const originalReplies = commentReplies;
    const originalTotalComments = totalComments;

    // Optimistic update
    if (parentId) {
      setCommentReplies(prev => ({
        ...prev,
        [parentId]: {
          ...prev[parentId],
          list: prev[parentId].list.filter(c => c.id !== commentId),
        },
      }));
      setComments(prev =>
        prev.map(c =>
          c.id === parentId ? { ...c, replyCount: c.replyCount - 1 } : c,
        ),
      );
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
    const nextTotalComments = totalComments - 1;
    setTotalComments(nextTotalComments);
    onCommentCountChange?.(currentDiary.diaryId, nextTotalComments);

    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
      setComments(originalComments);
      setCommentReplies(originalReplies);
      setTotalComments(originalTotalComments);
      onCommentCountChange?.(currentDiary.diaryId, originalTotalComments);
    }
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    if (!content.trim()) return;

    let originalComments = comments;
    let originalReplies = commentReplies;

    const updateInComments = (list: Comment[]): Comment[] =>
      list.map(c => (c.id === commentId ? { ...c, content } : c));

    setComments(prev => updateInComments(prev));

    setCommentReplies(prev => {
      const newReplies = { ...prev };
      for (const parentId in newReplies) {
        newReplies[parentId] = {
          ...newReplies[parentId],
          list: updateInComments(newReplies[parentId].list),
        };
      }
      return newReplies;
    });

    try {
      await updateComment(commentId, content);
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
      setComments(originalComments);
      setCommentReplies(originalReplies);
    }
  };

  if (!currentDiary) return null;

  const handleShareClick = (trigger: HTMLButtonElement) => {
    setIsMenuOpen(false);
    diaryShare.share(trigger);
  };

  const handleReportClick = () => {
    setIsMenuOpen(false);
    setIsNotReadyModalOpen(true);
  };

  const handleDeleteDiary = async () => {
    if (!confirm('정말 일기를 삭제하시겠습니까?')) return;
    setIsMenuOpen(false);
    try {
      await deleteDiary(currentDiary.diaryId);
      if (onDelete) {
        onDelete(currentDiary.diaryId);
      } else {
        onClose();
      }
    } catch (error) {
      alert(getApiErrorMessage(error, '일기 삭제에 실패했습니다.'));
    }
  };

  const handleLikeToggle = useCallback(async () => {
    const prevIsLiked = isLiked;
    const prevLikeCount = likeCount;

    // Optimistic update
    setIsLiked(!prevIsLiked);
    setLikeCount(prevIsLiked ? prevLikeCount - 1 : prevLikeCount + 1);

    try {
      const response = prevIsLiked
        ? await removeLike(currentDiary.diaryId)
        : await addLike(currentDiary.diaryId);
      setIsLiked(response.isLiked);
      setLikeCount(response.likeCount);
      onLikeChange?.(currentDiary.diaryId, {
        likeCount: response.likeCount,
        isLiked: response.isLiked,
      });
    } catch (error) {
      // Rollback
      setIsLiked(prevIsLiked);
      setLikeCount(prevLikeCount);
      console.error('좋아요 처리에 실패했습니다:', error);
    }
  }, [isLiked, likeCount, currentDiary.diaryId, onLikeChange]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentDiary.imgUrls && currentDiary.imgUrls.length > 0 && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentDiary.imgUrls && currentDiary.imgUrls.length > 0 && currentImageIndex < currentDiary.imgUrls.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const handleOpenEditPage = () => {
    setIsMenuOpen(false);
    router.push(`/diary/${currentDiary.diaryId}/edit`);
  };

  const DEFAULT_AVATAR = 'globe.svg';

  const handleAvatarError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = DEFAULT_AVATAR;
  };

  const displayImage = currentDiary.imgUrls?.[currentImageIndex] || '/vercel.svg';

  const displayDate = formatYearMonthDay(currentDiary.date);

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
        className="absolute right-4 top-4 text-white hover:text-gray-300 cursor-pointer"
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
          />
          {currentDiary.imgUrls && currentDiary.imgUrls.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:bg-black/80"
                >
                  <ChevronLeft size={24} className="cursor-pointer" />
                </button>
              )}
              {currentImageIndex < currentDiary.imgUrls.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-opacity hover:bg-black/80"
                >
                  <ChevronRight size={24} className="cursor-pointer" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Right side: Content and Comments */}
        <div className="flex h-full w-2/5 flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <div
              className="relative"
              onMouseEnter={handleHeaderMouseEnter}
              onMouseLeave={handleHeaderMouseLeave}
            >
              <div className="flex items-center">
                {profileUrl ? (
                  <>
                    <Link href={profileUrl}>
                      <Image
                        src={currentDiary.avatar || DEFAULT_AVATAR}
                        alt={displayNickname}
                        width={32}
                        height={32}
                        className="h-8 w-8 flex-shrink-0 rounded-full cursor-pointer"
                        onError={handleAvatarError}
                      />
                    </Link>
                    <Link href={profileUrl}>
                      <p className="ml-3 text-sm font-bold dark:text-white cursor-pointer">
                        {displayNickname}
                      </p>
                    </Link>
                  </>
                ) : (
                  <>
                    <AnonymousProfileIcon className="h-8 w-8" />
                    <p className="ml-3 text-sm font-bold dark:text-white">
                      {displayNickname}
                    </p>
                  </>
                )}
                <DotIcon className='text-gray-500 dark:text-gray-400'/>
                <p className="text-xs uppercase text-gray-400 dark:text-gray-300">
                  {displayDate}
                </p>
                {isOwner && (
                  <>
                    <DotIcon className='text-gray-500 dark:text-gray-400'/>
                    <p className="text-xs text-gray-400 dark:text-gray-300">
                      {getPrivacyLabel(currentDiary.status)}
                    </p>
                  </>
                )}
              </div>
              {isHeaderHovering && profileUrl && currentDiary.userId && (
                <MotionProfileHoverCard
                  userId={currentDiary.userId}
                  nickname={displayNickname}
                  avatar={currentDiary.avatar}
                  onStatusChange={() => {}}
                />
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label="일기 메뉴"
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
                  {isOwner && (
                    <>
                      <button
                        onClick={handleOpenEditPage}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        일기 수정
                      </button>
                      <button
                        onClick={handleDeleteDiary}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        일기 삭제
                      </button>
                    </>
                  )}
                  {diaryShare.visible && (
                    <button
                      type="button"
                      onClick={event =>
                        handleShareClick(
                          shareButtonRef.current ?? event.currentTarget,
                        )
                      }
                      disabled={diaryShare.pending}
                      className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      공유하기
                    </button>
                  )}
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
            <div className="relative">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {profileUrl ? (
                    <Link href={profileUrl}>
                      <Image
                        src={currentDiary.avatar || DEFAULT_AVATAR}
                        alt={displayNickname}
                        width={32}
                        height={32}
                        className="mr-3 mt-1 h-8 w-8 flex-shrink-0 rounded-full cursor-pointer"
                        onError={handleAvatarError}
                        onMouseEnter={handleContentMouseEnter}
                        onMouseLeave={handleContentMouseLeave}
                      />
                    </Link>
                  ) : (
                    <AnonymousProfileIcon className="mr-3 mt-1 h-8 w-8" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm dark:text-white whitespace-pre-wrap break-words">
                    <span
                      
                      className="inline-block"
                    >
                      {profileUrl ? (
                        <Link href={profileUrl}>
                          <span className="font-bold cursor-pointer"
                            onMouseEnter={handleContentMouseEnter}
                            onMouseLeave={handleContentMouseLeave}
                          >
                            {displayNickname}
                          </span>
                        </Link>
                      ) : (
                        <span className="font-bold">{displayNickname}</span>
                      )}
                    </span>
                    <span className="ml-2">{currentDiary.content}</span>
                  </p>
                </div>
              </div>
              {isContentHovering && profileUrl && currentDiary.userId && (
                <MotionProfileHoverCard
                  userId={currentDiary.userId}
                  nickname={displayNickname}
                  avatar={currentDiary.avatar}
                  onStatusChange={() => {}}
                />
              )}
            </div>

            {/* 실제 댓글 목록 */}
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                diaryId={currentDiary.diaryId}
                onSetReplyTo={handleSetReplyTo}
                replies={commentReplies[comment.id]?.list || []}
                replyState={commentReplies[comment.id]}
                onToggleReplies={() => handleToggleReplies(comment)}
                onFetchMoreReplies={() => handleFetchReplies(comment.id)}
                onDeleteComment={handleDeleteComment}
                onStartEdit={handleStartEdit}
              />
            ))}
            {comments.length === 0 && !isLoadingComments && (
              <div className="py-4 text-center text-gray-500">
                아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
              </div>
            )}

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
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                >
                  다음 댓글 더 보기
                </button>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  className="flex items-center space-x-1 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={handleLikeToggle}
                >
                  <HeartIcon filled={isLiked} />
                </button>
                {diaryShare.visible && (
                  <DiaryShareButton
                    ref={shareButtonRef}
                    status={currentDiary.status}
                    pending={diaryShare.pending}
                    onShare={diaryShare.share}
                  />
                )}
              </div>
            </div>
            <p className="mt-1 text-sm font-bold dark:text-white">
              좋아요 {likeCount}개
            </p>
            <DiaryShareFeedback
              feedback={diaryShare.feedback}
              status={currentDiary.status}
              canRetryCopy={diaryShare.canRetryCopy}
              pending={diaryShare.pending}
              onRetryCopy={diaryShare.retryCopy}
              onClose={diaryShare.closeFeedback}
            />
          </div>

          {/* Comment Input */}
          <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <CommentInput
              inputRef={inputRef as React.RefObject<HTMLInputElement>}
              onSubmit={handleSubmitComment}
              placeholder={
                editingComment
                  ? '댓글 수정...'
                  : replyTo
                    ? `@${replyTo.nickname}님에게 답글 남기기`
                    : '댓글 달기...'
              }
              value={newComment}
              onChange={setNewComment}
              isSubmitting={isSubmitting}
              onCancel={
                editingComment
                  ? handleCancelEdit
                  : replyTo
                    ? cancelReply
                    : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryDetailModal; 
