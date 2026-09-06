'use client';

import { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useRouter } from 'next/navigation';
import type { DiaryDetail } from '@/types/diary';
import { deleteDiary, getDiaryById } from '@/lib/api/diary';
import { format } from 'date-fns';
import { DotIcon, Heart, Loader2, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import useAuthStore from '../store/authStore';
import DiaryDetailModal from './DiaryDetailModal';
import CommentModal from './CommentModal';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { sendFriendRequest } from '@/lib/api/friend';
import { FriendshipStatus } from '@/types/friend';
import { getPrivacyLabel, isAnonymousDiaryIdentity } from '@/lib/utils/privacy';
import UserProfile from '@/components/common/UserProfile';
import ProfileHoverCard from '@/components/feed/ProfileHoverCard';
import AnonymousProfileIcon from '@/components/common/AnonymousProfileIcon';
import { useDiaryShare } from '@/hooks/useDiaryShare';
import DiaryShareButton from './DiaryShareButton';
import DiaryShareFeedback from './DiaryShareFeedback';

interface DiaryDetailClientProps {
  diaryId: number;
}

const DiaryDetailClient = ({ diaryId }: DiaryDetailClientProps) => {
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const [errorMessage, setErrorMessage] = useState('');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [isProfileHovering, setIsProfileHovering] = useState(false);
  const profileHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
  const hasCurrentDiary = diary?.diaryId === diaryId;
  const diaryShare = useDiaryShare(
    hasCurrentDiary ? diary.diaryId : 0,
    hasCurrentDiary ? diary.status : 'PRIVATE',
  );

  useEffect(() => {
    let isCurrentRequest = true;
    setDiary(null);
    setIsLoading(true);
    const fetchDiaryDetail = async () => {
      try {
        const diaryData = await getDiaryById(diaryId);
        if (isCurrentRequest) setDiary(diaryData);
      } catch (error) {
        // setErrorMessage(getApiErrorMessage(error, '일기를 찾을 수 없습니다.'));
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    fetchDiaryDetail();
    return () => {
      isCurrentRequest = false;
    };
  }, [diaryId]);

  const openCommentModal = () => {
    setIsCommentModalOpen(true);
  };

  const handleDiaryDeleted = () => {
    router.back();
  };

  const handleDeleteDiary = async () => {
    if (!diary || !confirm('정말 일기를 삭제하시겠습니까?')) return;

    setIsMenuOpen(false);
    try {
      await deleteDiary(diary.diaryId);
      handleDiaryDeleted();
    } catch (error) {
      alert(getApiErrorMessage(error, '일기 삭제에 실패했습니다.'));
    }
  };

  const handleAddFriend = async () => {
    if (
      !diary ||
      !user ||
      isFriendActionLoading ||
      isAnonymousDiaryIdentity(diary) ||
      !diary.userId
    ) {
      return;
    }

    const diaryUserId = diary.userId;

    setIsFriendActionLoading(true);
    try {
      await sendFriendRequest(diaryUserId);
      setDiary(prevDiary =>
        prevDiary
          ? { ...prevDiary, friendStatus: FriendshipStatus.SENT }
          : prevDiary,
      );
    } catch (error: any) {
      console.error('Friend action failed:', error);
      if (error?.response?.status !== 403) {
        alert('요청 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleProfileMouseEnter = () => {
    if (!diary || isAnonymousDiaryIdentity(diary)) return;
    if (profileHoverTimeoutRef.current) {
      clearTimeout(profileHoverTimeoutRef.current);
    }
    setIsProfileHovering(true);
  };

  const handleProfileMouseLeave = () => {
    profileHoverTimeoutRef.current = setTimeout(() => {
      setIsProfileHovering(false);
    }, 200);
  };

  const handleProfileStatusChange = () => {
    setDiary(prevDiary =>
      prevDiary
        ? { ...prevDiary, friendStatus: FriendshipStatus.SENT }
        : prevDiary,
    );
  };

  const getDisplayContent = (content: string) => {
    const maxLength = 100;
    if (content.length <= maxLength || isContentExpanded) {
      return content;
    }
    return content.slice(0, maxLength) + '...';
  };

  const shouldShowMoreButton = (content: string) => {
    return content.length > 100 && !isContentExpanded;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>일기를 불러오는 중...</p>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 dark:bg-black">
        <Image
          src="/404.png"
          alt="일기를 찾을 수 없습니다."
          width={1536}
          height={1024}
          className="h-auto w-full max-w-2xl"
        />
      </div>
    );
  }

  const isAnonymousDiary = isAnonymousDiaryIdentity(diary);
  const displayNickname = isAnonymousDiary ? '익명' : diary.nickname;
  const isOwner = diary.isOwner ?? user?.id === diary.userId;
  const shouldShowAddFriendButton =
    Boolean(user) &&
    !isAnonymousDiary &&
    Boolean(diary.userId) &&
    !isOwner &&
    (diary.friendStatus ?? FriendshipStatus.NONE) === FriendshipStatus.NONE;

  return (
    <div className="min-h-screen bg-white font-sans dark:bg-black">
      <div className="mx-auto max-w-[600px] px-4 py-6 xl:pt-6">
        <article className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <header className="flex items-center justify-between p-3">
            <div className="relative flex min-w-0 items-center space-x-3">
              <div
                data-testid="diary-author-profile"
                className={`flex min-w-0 items-center ${isAnonymousDiary ? '' : 'cursor-pointer'}`}
                onMouseEnter={handleProfileMouseEnter}
                onMouseLeave={handleProfileMouseLeave}
              >
                <div
                  data-testid="diary-author-meta"
                  className="flex min-w-0 items-center"
                >
                  {isAnonymousDiary || !diary.userId ? (
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <AnonymousProfileIcon className="h-10 w-10" iconSize={22} />
                      <span className="truncate text-sm font-semibold dark:text-white">
                        {displayNickname}
                      </span>
                    </span>
                  ) : (
                    <UserProfile
                      userId={diary.userId}
                      nickname={displayNickname}
                      avatar={diary.avatar || '/globe.svg'}
                      imageSize={40}
                      imageClassName="h-10 w-10 bg-gray-200 object-cover"
                      nicknameClassName="truncate dark:text-white"
                    />
                  )}
                  <DotIcon className="text-gray-500 dark:text-gray-400" />
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(diary.date), 'yyyy.MM.dd')}
                  </span>
                </div>
              </div>
              {isProfileHovering && !isAnonymousDiary && diary.userId && (
                <div
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  <ProfileHoverCard
                    userId={diary.userId}
                    nickname={displayNickname}
                    avatar={diary.avatar}
                    onStatusChange={handleProfileStatusChange}
                  />
                </div>
              )}
              {isOwner && (
                <p className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {getPrivacyLabel(diary.status)}
                </p>
              )}
              {shouldShowAddFriendButton && (
                <button
                  type="button"
                  onClick={handleAddFriend}
                  disabled={isFriendActionLoading}
                  aria-label={isFriendActionLoading ? '친구 요청 처리 중' : undefined}
                  className="inline-flex min-w-[52px] shrink-0 items-center justify-center text-xs font-semibold text-blue-500 hover:text-blue-600 disabled:text-gray-400"
                >
                  {isFriendActionLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    '친구 추가'
                  )}
                </button>
              )}
            </div>
            {isOwner && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="일기 메뉴"
                  className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  onClick={() => setIsMenuOpen(prev => !prev)}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <button
                      type="button"
                      className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push(`/diary/${diary.diaryId}/edit`);
                      }}
                    >
                      일기 수정
                    </button>
                    <button
                      type="button"
                      className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={handleDeleteDiary}
                    >
                      일기 삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </header>

          <div>
            {diary.imgUrls && diary.imgUrls.length > 0 && (
              <Swiper
                modules={[Pagination]}
                pagination={{ clickable: true }}
                className={`mySwiper ${diary.imgUrls.length === 1 ? 'single-image' : ''}`}
                style={
                  {
                    '--swiper-pagination-color': '#FFD600',
                    '--swiper-pagination-bullet-inactive-color': '#999999',
                    '--swiper-pagination-bullet-inactive-opacity': '1',
                  } as CSSProperties
                }
              >
                {diary.imgUrls.map((url, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative aspect-square w-full">
                      <Image
                        width={100}
                        height={100}
                        src={url}
                        alt={`Diary image ${index + 1}`}
                        className="absolute left-0 top-0 h-full w-full rounded object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}

            <div className="p-3">
              <div className="flex space-x-3">
                <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-200">
                  <Heart
                    className={`h-7 w-7 ${
                      diary.isLiked ? 'text-red-500 fill-current' : ''
                    }`}
                  />
                  <span className="font-bold">{diary.likeCount}</span>
                </button>
                <button
                  onClick={openCommentModal}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-200"
                >
                  <MessageCircle className="h-7 w-7" />
                  <span className="font-bold">{diary.commentCount}</span>
                </button>
                {diaryShare.visible && (
                  <DiaryShareButton
                    status={diary.status}
                    pending={diaryShare.pending}
                    onShare={diaryShare.share}
                  />
                )}
              </div>
              <DiaryShareFeedback
                feedback={diaryShare.feedback}
                status={diary.status}
                canRetryCopy={diaryShare.canRetryCopy}
                pending={diaryShare.pending}
                onRetryCopy={diaryShare.retryCopy}
                onClose={diaryShare.closeFeedback}
              />
            </div>

            <main className="px-3 pb-3">
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  <span className="mr-1 font-semibold">{displayNickname}</span>
                  {getDisplayContent(diary.content)}
                </p>
                {shouldShowMoreButton(diary.content) && (
                  <button
                    onClick={() => setIsContentExpanded(true)}
                    className="text-sm text-gray-500 transition-colors hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    더 보기
                  </button>
                )}
              </div>
            </main>
          </div>
        </article>
      </div>

      <AnimatePresence>
        {isCommentModalOpen &&
          diary &&
          (isDesktop ? (
            <DiaryDetailModal
              diary={diary}
              onClose={() => setIsCommentModalOpen(false)}
              onDelete={handleDiaryDeleted}
            />
          ) : (
            <CommentModal
              diaryId={diary.diaryId}
              initialCommentCount={diary.commentCount}
              onClose={() => setIsCommentModalOpen(false)}
              onUpdateCommentCount={newCount => {
                setDiary(prevDiary =>
                  prevDiary ? { ...prevDiary, commentCount: newCount } : null,
                );
              }}
              isAnonymousDiary={isAnonymousDiary}
            />
          ))}
      </AnimatePresence>

      <style jsx global>{`
        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
        }
        .swiper-container-horizontal > .swiper-pagination-bullets,
        .swiper-pagination-custom,
        .swiper-pagination-fraction {
          bottom: 15px;
        }
        .swiper:where(.swiper-pagination-bullets.swiper-pagination-horizontal) {
          bottom: 15px;
        }
        .swiper-wrapper {
          padding-bottom: 0;
        }
        .single-image .swiper-pagination {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default DiaryDetailClient; 
