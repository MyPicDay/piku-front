'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X,
  MoreHorizontal,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  DotIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import type { DiaryDetail } from '@/types/diary';
import { formatYearMonthDayDots } from '@/lib/utils/date';
import { getPrivacyLabel, isAnonymousDiaryIdentity } from '@/lib/utils/privacy';
import { getServerURL } from '@/lib/utils/url';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import useAuthStore from '@/components/store/authStore';
import { deleteDiary } from '@/lib/api/diary';
import { addLike, removeLike, type LikeResponse } from '@/lib/api/like';
import StoryCommentModal from './StoryCommentModal';
import AnonymousProfileIcon from '@/components/common/AnonymousProfileIcon';
import { useDiaryShare } from '@/hooks/useDiaryShare';
import DiaryShareButton from './DiaryShareButton';
import DiaryShareDialog from './DiaryShareDialog';

interface DiaryStoryModalProps {
  diary: DiaryDetail;
  onClose: () => void;
  onCommentViewToggle?: (isOpen: boolean) => void;
  onDelete?: (diaryId: number) => void;
  onCommentCountChange?: (diaryId: number, count: number) => void;
  onLikeChange?: (
    diaryId: number,
    nextLike: Pick<LikeResponse, 'likeCount' | 'isLiked'>,
  ) => void;
}


const formatCount = (count: number): string => {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
};

interface StoryActionButtonProps {
  ariaLabel: string;
  icon: LucideIcon;
  countLabel: string;
  iconClassName?: string;
  onClick: () => void;
}

const StoryActionButton = ({
  ariaLabel,
  icon: Icon,
  countLabel,
  iconClassName = 'text-white',
  onClick,
}: StoryActionButtonProps) => (
  <button
    type="button"
    aria-label={ariaLabel}
    className="flex min-w-[44px] flex-col items-center text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] transition-opacity hover:opacity-80"
    onClick={onClick}
  >
    <Icon size={28} aria-hidden="true" className={iconClassName} />
    <span className="mt-1 text-xs font-semibold leading-none">
      {countLabel}
    </span>
  </button>
);

const DiaryStoryModal = ({
  diary,
  onClose,
  onCommentViewToggle,
  onDelete,
  onCommentCountChange,
  onLikeChange,
}: DiaryStoryModalProps) => {
  useBodyScrollLock(true);

  const currentDiary = diary;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalComments, setTotalComments] = useState(diary.commentCount);
  const [isLiked, setIsLiked] = useState(diary.isLiked);
  const [likeCount, setLikeCount] = useState(diary.likeCount);
  const [isCommentViewOpen, setIsCommentViewOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasCommentHistoryEntryRef = useRef(false);

  const { user } = useAuthStore();
  const serverUrl = getServerURL();
  const router = useRouter();
  const isAnonymousDiary = isAnonymousDiaryIdentity(currentDiary);
  const displayNickname = isAnonymousDiary ? '익명' : currentDiary.nickname;
  const isOwner = currentDiary.isOwner ?? user?.id === currentDiary.userId;
  const diaryShare = useDiaryShare(currentDiary.diaryId, currentDiary.status);

  useEffect(() => {
    setCurrentImageIndex(0);
    setTotalComments(diary.commentCount);
    setIsLiked(diary.isLiked);
    setLikeCount(diary.likeCount);
  }, [diary]);

  const handleProfileClick = () => {
    if (isAnonymousDiary || !currentDiary.userId) return;
    router.push(`/profile/${currentDiary.userId}`);
    onClose();
  };

  const handleUpdateCommentCount = (count: number) => {
    setTotalComments(count);
    onCommentCountChange?.(currentDiary.diaryId, count);
  };

  const handleCloseCommentModal = () => {
    if (hasCommentHistoryEntryRef.current) {
      hasCommentHistoryEntryRef.current = false;
      window.history.back();
    }
    setIsCommentViewOpen(false);
  };

  const openCommentView = () => {
    setIsCommentViewOpen(true);
  };

  useEffect(() => {
    onCommentViewToggle?.(isCommentViewOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommentViewOpen]);

  useEffect(() => {
    if (!isCommentViewOpen || hasCommentHistoryEntryRef.current) {
      return;
    }

    window.history.pushState({ modal: 'diary-comment' }, '');
    hasCommentHistoryEntryRef.current = true;
  }, [isCommentViewOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (!hasCommentHistoryEntryRef.current) {
        return;
      }

      hasCommentHistoryEntryRef.current = false;
      setIsCommentViewOpen(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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

  const handlePrevImage = () => {
    if (currentDiary.imgUrls && currentDiary.imgUrls.length > 0 && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  const handleNextImage = () => {
    if (currentDiary.imgUrls && currentDiary.imgUrls.length > 0 && currentImageIndex < currentDiary.imgUrls.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  // 위로 드래그해서 댓글을 여는 기능은 UX 변경으로 비활성화합니다.
  // const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
  //   if (info.offset.y < -50 && info.velocity.y < -200) {
  //     openCommentView();
  //   }
  // };

  const swipeHandlers = useSwipeable({
    // onSwipedUp: () => openCommentView(),
    onSwipedLeft: () => handleNextImage(),
    onSwipedRight: () => handlePrevImage(),
    trackMouse: true,
  });

  const DEFAULT_AVATAR = `${serverUrl}/globe.svg`;
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = DEFAULT_AVATAR;
  };

  const handleOpenEditPage = () => {
    setIsMenuOpen(false);
    router.push(`/diary/${currentDiary.diaryId}/edit`);
  };

  const displayImage = currentDiary.imgUrls?.[currentImageIndex] || '/vercel.svg';
  const storyActions = [
    {
      key: 'like',
      ariaLabel: isLiked ? `좋아요 취소 ${likeCount}개` : `좋아요 ${likeCount}개`,
      icon: Heart,
      countLabel: formatCount(likeCount),
      iconClassName: isLiked ? 'fill-red-500 text-red-500' : 'text-white',
      onClick: handleLikeToggle,
    },
    {
      key: 'comment',
      ariaLabel: `댓글 ${totalComments}개 보기`,
      icon: MessageCircle,
      countLabel: formatCount(totalComments),
      onClick: openCommentView,
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div
          className={`flex items-center ${isAnonymousDiary ? '' : 'cursor-pointer'}`}
          onClick={handleProfileClick}
        >
          {isAnonymousDiary ? (
            <AnonymousProfileIcon
              className="h-8 w-8"
              variant="overlay"
            />
          ) : (
            <Image
              src={currentDiary.avatar || DEFAULT_AVATAR}
              alt={displayNickname}
              width={32}
              height={32}
              className="rounded-full"
              onError={handleAvatarError}
            />
          )}
          <p className={`ml-3 text-sm font-bold text-white ${isAnonymousDiary ? '' : 'cursor-pointer'}`}>
            {displayNickname}
          </p>
          <DotIcon className='text-gray-300'/>
          <p className="text-xs uppercase text-gray-300">
            {formatYearMonthDayDots(currentDiary.date)}
          </p>
          {isOwner && (
            <>
              <DotIcon className='text-gray-300'/>
              <p className="text-xs text-gray-300">
                {getPrivacyLabel(currentDiary.status)}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-gray-300"
              >
                <MoreHorizontal size={28} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 z-30 mt-2 w-32 rounded-md border border-gray-600 bg-gray-900 shadow-lg">
                  <button
                    onClick={handleOpenEditPage}
                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-100 hover:bg-gray-700"
                  >
                    일기 수정
                  </button>
                  <button
                    onClick={handleDeleteDiary}
                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
                  >
                    일기 삭제
                  </button>
                </div>
              )}
            </div>
          )}
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Image Viewer */}
      <div {...swipeHandlers} className="relative h-full w-full">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentImageIndex}
            className="absolute inset-x-0 top-20 bottom-0"
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
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image Navigation */}
      {currentDiary.imgUrls && currentDiary.imgUrls.length > 1 && (
        <>
          {currentImageIndex > 0 && (
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 p-2 text-white transition-opacity hover:bg-black/60"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {currentImageIndex < currentDiary.imgUrls.length - 1 && (
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-full bg-black/30 p-2 text-white transition-opacity hover:bg-black/60"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </>
      )}

      {/* Story action rail */}
      {!isCommentViewOpen && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-black/50 to-transparent" />
          <div
            data-testid="story-action-rail"
            className="absolute right-4 bottom-8 z-20 flex flex-col items-center gap-5"
          >
            {storyActions.map(action => (
              <StoryActionButton
                key={action.key}
                ariaLabel={action.ariaLabel}
                icon={action.icon}
                countLabel={action.countLabel}
                iconClassName={action.iconClassName}
                onClick={action.onClick}
              />
            ))}
            {diaryShare.visible && (
              <DiaryShareButton
                status={currentDiary.status}
                pending={diaryShare.pending}
                onShare={diaryShare.open}
                variant="story"
              />
            )}
          </div>
          <DiaryShareDialog
            controller={diaryShare}
            status={currentDiary.status}
            variant="story"
          />
        </>
      )}

      {/* Comments View using StoryCommentModal */}
      <AnimatePresence>
        {isCommentViewOpen && (
          <StoryCommentModal
            diaryId={currentDiary.diaryId}
            initialCommentCount={totalComments}
            onClose={handleCloseCommentModal}
            onUpdateCommentCount={handleUpdateCommentCount}
            isAnonymousDiary={isAnonymousDiary}
            diaryContent={{
              nickname: displayNickname,
              avatar: currentDiary.avatar,
              content: currentDiary.content,
              userId: currentDiary.userId,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DiaryStoryModal; 
