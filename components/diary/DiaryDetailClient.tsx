'use client';

import { useState, useEffect } from 'react';
import type { DiaryDetail } from '@/types/diary';
import { getDiaryById } from '@/api/diary';
import { format } from 'date-fns';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import type { CSSProperties } from 'react';
import { getServerURL } from '@/lib/utils/url';

interface DiaryDetailClientProps {
  diaryId: number;
}

const DiaryDetailClient = ({ diaryId }: DiaryDetailClientProps) => {
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const serverUrl = getServerURL();

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
            <img
              src={diary.avatar ? `${serverUrl}/${diary.avatar}` : '/globe.svg'}
              alt={diary.nickname}
              width={40}
              height={40}
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

        <div className="flex-grow">
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
                    <img
                      src={url}
                      alt={`Diary image ${index + 1}`}
                      className="absolute top-0 left-0 w-full h-full object-cover"
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
            <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <MessageCircle className="w-7 h-7" />
              <span className="text-sm font-semibold">
                {diary.commentCount}
              </span>
            </button>
          </div>

          <main className="p-4 pt-0">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-2xl min-h-[120px]">
              <p className="whitespace-pre-wrap text-base leading-relaxed dark:text-gray-300">
                {diary.content}
              </p>
              <div className="mt-6 flex items-center space-x-2">
                <img
                  src={diary.avatar ? `${serverUrl}/${diary.avatar}` : '/globe.svg'}
                  alt={diary.nickname}
                  width={24}
                  height={24}
                  className="rounded-full bg-gray-200"
                />
                <p className="font-semibold text-sm dark:text-white">{diary.nickname}</p>
              </div>
            </div>
          </main>

          <section className="p-4">
            <h2 className="font-bold mb-4 text-gray-800 dark:text-gray-200">
              댓글 {diary.comments?.length ?? 0}개
            </h2>
            {diary.comments && diary.comments.length > 0 ? (
              <div className="space-y-4">
                {diary.comments.map(comment => (
                  <div
                    key={comment.commentId}
                    className="flex space-x-3 items-start"
                  >
                    <img
                      src={
                        comment.member.avatar
                          ? `${serverUrl}${comment.member.avatar}`
                          : '/globe.svg'
                      }
                      alt={comment.member.nickname}
                      width={32}
                      height={32}
                      className="rounded-full bg-gray-200 mt-1"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
                        <p className="font-semibold text-sm dark:text-white">
                          {comment.member.nickname}
                        </p>
                        <p className="text-sm dark:text-gray-300">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 pl-1">
                        {format(new Date(comment.createdAt), 'yy.MM.dd HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                <p>아직 댓글이 없습니다.</p>
                <p>가장 먼저 댓글을 남겨보세요!</p>
              </div>
            )}
          </section>
        </div>

        <footer className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t dark:border-gray-700 p-2">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="댓글을 입력하세요..."
              className="flex-grow bg-gray-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-none rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500"
            />
            <button className="ml-2 bg-yellow-400 hover:bg-yellow-500 text-white p-3 rounded-full flex-shrink-0 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>

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