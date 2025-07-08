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
} from 'lucide-react';
import type { DiaryDetail } from '@/types/diary';
import type { Comment } from '@/types/comment';
import { createComment, getRootComments } from '@/api/comment';
import { formatTimeAgo, formatYearMonthDay } from '@/lib/utils/date';
import { getServerURL } from '@/lib/utils/url';
import useAuthStore from '@/components/store/authStore';

interface DiaryDetailModalProps {
  diary: DiaryDetail;
  onClose: () => void;
}

const DiaryDetailModal = ({
  diary,
  onClose,
}: DiaryDetailModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [totalComments, setTotalComments] = useState(diary.commentCount);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { isLoggedIn, user } = useAuthStore();
  const serverUrl = getServerURL();

  const fetchComments = async (isNewFetch: boolean = false) => {
    if (isLoadingComments || (!hasMore && !isNewFetch)) return;

    setIsLoadingComments(true);
    const pageToFetch = isNewFetch ? 0 : page;
    
    try {
      const data = await getRootComments(diary.diaryId, pageToFetch, 10);
      setComments(prev => (isNewFetch ? data.content : [...data.content, ...prev]));
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

  // 일기 데이터를 댓글 형태로 변환
  const diaryAsComment = {
    id: 0,
    nickname: diary.nickname || '알 수 없음',
    avatar: diary.avatar,
    content: diary.content || '작성된 내용이 없습니다.',
    createdAt: diary.createdAt,
  };

  // 댓글 작성 (낙관적 업데이트)
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();
    if (!trimmedComment || !diary.diaryId || isSubmittingComment || !isLoggedIn || !user)
      return;

    const tempId = Date.now();
    const optimisticComment: Comment = {
      id: tempId,
      diaryId: diary.diaryId,
      userId: String(user.id),
      nickname: user.nickname || '사용자',
      avatar: user.avatar || `${serverUrl}/globe.svg`,
      content: trimmedComment,
      parentId: null,
      createdAt: new Date().toISOString(),
      replyCount: 0,
    };

    setComments(prev => [...prev, optimisticComment]);
    setTotalComments(prev => prev + 1);
    setNewComment('');
    setIsSubmittingComment(true);

    try {
      const newCommentData = await createComment({
        diaryId: diary.diaryId,
        content: trimmedComment,
      });
      setComments(prev =>
        prev.map(comment =>
          comment.id === tempId
            ? {
                ...comment,
                id: newCommentData.id,
                content: newCommentData.content,
                createdAt: newCommentData.createdAt,
              }
            : comment,
        ),
      );
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      setComments(prev => prev.filter(comment => comment.id !== tempId));
      setTotalComments(prev => prev - 1);
      setNewComment(trimmedComment);
      alert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!diary) return null;

  const handleEditClick = () => {
    router.push(`/diary/edit/${diary.diaryId}`);
    onClose();
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
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <X size={32} />
      </button>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-9/10 h-[90vh] flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Left side: Image */}
        <div className="w-3/5 h-full relative bg-black">
          <Image
            src={displayImage}
            alt="Diary image"
            fill
            objectFit="contain"
            unoptimized
          />
          {diary.imgUrls && diary.imgUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-opacity z-10 cursor-pointer"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-opacity z-10 cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Right side: Content and Comments */}
        <div className="w-2/5 h-full flex flex-col bg-white">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center">
              {/* <Image
                src={diary.avatar}
                alt={diary.nickname}
                width={32}
                height={32}
                className="rounded-full"
              /> */}
              <img
                src={diary.avatar || DEFAULT_AVATAR}
                alt={diary.nickname}
                width={32}
                height={32}
                className="rounded-full"
                onError={handleAvatarError}
              />
              <p className="font-bold ml-3 text-sm">{diary.nickname}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:opacity-60 cursor-pointer"
              >
                <MoreHorizontal size={24} />
              </button>
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-20 border border-gray-200"
                >
                  <button
                    onClick={handleEditClick}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    일기 수정
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section (scrollable) */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {/* 일기 내용 (첫 번째 댓글로 표시) */}
            <div className="flex items-start">
              <img
                src={diaryAsComment.avatar || DEFAULT_AVATAR}
                alt={diaryAsComment.nickname}
                width={32}
                height={32}
                className="rounded-full mr-3 mt-1"
                onError={handleAvatarError}
              />
              <div>
                <p className="text-sm">
                  <span className="font-bold">{diaryAsComment.nickname}</span>{' '}
                  {diaryAsComment.content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimeAgo(diaryAsComment.createdAt)}
                </p>
              </div>
            </div>

            {/* 댓글 더보기 버튼 */}
            {isLoadingComments && (
              <div className="text-center text-gray-500 py-2">
                댓글을 불러오는 중...
              </div>
            )}
            {!isLoadingComments && hasMore && (
              <div className="text-center py-2">
                <button
                  onClick={() => fetchComments()}
                  className="text-sm text-gray-500 hover:text-gray-800 font-semibold"
                >
                  이전 댓글 더 보기 ({totalComments})
                </button>
              </div>
            )}

            {/* 실제 댓글 목록 */}
            {comments.length > 0 &&
              !isLoadingComments &&
              comments.map((comment: Comment) => (
                <div
                  key={comment.id}
                  className="flex items-start justify-between w-full"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={comment.avatar || DEFAULT_AVATAR}
                      alt={comment.nickname}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={handleAvatarError}
                    />
                    <div>
                      <p className="text-sm">
                        <span className="font-bold">{comment.nickname}</span>{' '}
                        {comment.content}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                        <button className="font-semibold hover:text-gray-700">
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
            {comments.length === 0 && !isLoadingComments && (
              <div className="text-center text-gray-500 py-4">
                아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button className="hover:opacity-60">
                  <Heart size={24} />
                </button>
                <button className="hover:opacity-60">
                  <MessageCircle size={24} />
                </button>
                <button className="hover:opacity-60">
                  <Send size={24} />
                </button>
              </div>
              <button className="hover:opacity-60">
                <Bookmark size={24} />
              </button>
            </div>
            <p className="font-bold text-sm mt-2">좋아요 {diary.likeCount}개</p>
            <p className="text-gray-500 text-xs mt-1 uppercase">{displayDate}</p>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-gray-200">
            {isLoggedIn ? (
              <form onSubmit={handleCreateComment} className="flex items-center">
                <input
                  type="text"
                  placeholder="댓글 달기..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-sm"
                  disabled={isSubmittingComment}
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="min-w-[40px] text-blue-500 font-bold hover:text-blue-700 text-sm cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? '전송 중...' : '게시'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center py-3">
                <p className="text-gray-400 text-sm">댓글을 작성하려면 로그인해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryDetailModal; 