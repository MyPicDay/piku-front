'use client';

import { useState, useEffect } from 'react';
import type { DiaryDetail } from '@/types/diary';
import { getDiaryById } from '@/api/diary';
import { format } from 'date-fns';
import { Heart, MessageCircle, Send, X } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isContentExpanded, setIsContentExpanded] = useState(false);
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

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      // TODO: API 호출로 댓글 등록
      console.log('댓글 등록:', commentText);
      setCommentText('');
    }
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
            <button 
              onClick={() => setIsCommentModalOpen(true)}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400"
            >
              <MessageCircle className="w-7 h-7" />
              <span className="text-sm font-semibold">
                {diary.commentCount}
              </span>
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

      {/* 댓글 모달 */}
      <AnimatePresence>
        {isCommentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
            onClick={() => setIsCommentModalOpen(false)}
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
                  댓글 {diary.comments?.length ?? 0}개
                </h2>
                <button
                  onClick={() => setIsCommentModalOpen(false)}
                  className="p-2 text-gray-500 dark:text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
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
              </div>

                             <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                 <div className="flex items-center space-x-3">
                   <div className="flex-1 px-4 py-3  transition-colors">
                     <input
                       type="text"
                       value={commentText}
                       onChange={(e) => setCommentText(e.target.value)}
                       placeholder="댓글을 입력하세요..."
                       className="w-full bg-transparent focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                       onKeyPress={(e) => {
                         if (e.key === 'Enter') {
                           handleCommentSubmit();
                         }
                       }}
                     />
                   </div>
                   <button 
                     onClick={handleCommentSubmit}
                     disabled={!commentText.trim()}
                     className=" text-blue-500  hover:text-blue-700  disabled:text-gray-500 dark:disabled:text-gray-400 px-4 py-3  font-bold text-sm transition-colors min-w-[60px] cursor-pointer disabled:cursor-not-allowed"
                   >
                     게시
                   </button>
                 </div>
               </div>
            </motion.div>
          </motion.div>
        )}
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