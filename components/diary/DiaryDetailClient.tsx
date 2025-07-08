'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import type { DiaryDetail } from '@/types/diary';
import { getDiaryById } from '@/api/diary';
import { createComment, getRootComments } from '@/api/comment';
import type { Comment } from '@/types/comment';
import { format } from 'date-fns';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/css';
import 'swiper/css/pagination';
import type { CSSProperties } from 'react';
import { getServerURL } from '@/lib/utils/url';
import Image from 'next/image';
import useAuthStore from '../store/authStore';
import DiaryDetailModal from './DiaryDetailModal';
import CommentModal from './CommentModal';

interface DiaryDetailClientProps {
  diaryId: number;
}

const DiaryDetailClient = ({ diaryId }: DiaryDetailClientProps) => {
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const { user, isLoggedIn } = useAuthStore();
  const serverUrl = getServerURL();
  const isDesktop = useMediaQuery({ query: '(min-width: 1024px)' });

  useEffect(() => {
    const fetchDiaryDetail = async () => {
      try {
        const diaryData = await getDiaryById(diaryId);
        setDiary(diaryData);
      } catch (error) {
        console.error('Failed to fetch diary details:', error);
        // TODO: Show error state to user
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiaryDetail();
  }, [diaryId]);

  const openCommentModal = () => {
    // 데스크탑이 아닐 때만 댓글 입력창 클릭으로 모달이 열리도록 처리
    // 또는 데스크탑일 경우 아이콘 클릭으로만 열리도록 처리
    setIsCommentModalOpen(true);
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
      <div className="flex justify-center items-center min-h-screen">
        <p>일기를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black min-h-screen font-sans">
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 shadow-sm flex flex-col min-h-screen">
        <header className="p-4 flex items-center space-x-3 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex-grow flex items-center space-x-3">
            <Image
              src={diary.avatar ? diary.avatar : '/globe.svg'}
              alt={diary.nickname}
              width={40}
              height={40}
              unoptimized
              className="rounded-full bg-gray-200"
            />
            <div>
              <p className="font-bold dark:text-white">{diary.nickname}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(diary.date), 'yyyy.MM.dd')}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-grow pb-20">
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
                  <div className="relative w-full" style={{ paddingTop: '100%' }}>
                    <Image
                      width={100}
                      height={100}
                      src={url}
                      alt={`Diary image ${index + 1}`}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          <div className="p-4 flex justify-end items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <Heart
                className={`w-7 h-7 ${
                  diary.isLiked ? 'text-red-500 fill-current' : ''
                }`}
              />
              <span className="text-sm font-semibold">{diary.likeCount}</span>
            </button>
            <button
              onClick={openCommentModal}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400"
            >
              <MessageCircle className="w-7 h-7" />
              <span className="text-sm font-semibold">{diary.commentCount}</span>
            </button>
          </div>

          <main className="px-4 py-3">
            <div className="space-y-3">
              <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed whitespace-pre-wrap">
                {getDisplayContent(diary.content)}
              </p>
              {shouldShowMoreButton(diary.content) && (
                <button
                  onClick={() => setIsContentExpanded(true)}
                  className="text-gray-500 dark:text-gray-400 text-sm hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  더 보기
                </button>
              )}
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isCommentModalOpen &&
          diary &&
          (isDesktop ? (
            <DiaryDetailModal
              diary={diary}
              onClose={() => setIsCommentModalOpen(false)}
            />
          ) : (
            <CommentModal
              diary={diary}
              onClose={() => setIsCommentModalOpen(false)}
            />
          ))}
      </AnimatePresence>

      {!isDesktop && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-neutral-900 p-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder={
                isLoggedIn ? '댓글 달기...' : '로그인 후 댓글을 남겨보세요'
              }
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:text-white"
              disabled={!isLoggedIn}
              onClick={openCommentModal}
            />
          </div>
        </div>
      )}

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