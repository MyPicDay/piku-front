'use client';

import { useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { startOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/components/store/authStore';
import PikuCalendar from '@/components/calendar/PikuCalendar';
import HomeCalendarHeader from '@/components/home/HomeCalendarHeader';
import DiaryDetailModal from '@/components/diary/DiaryDetailModal';
import DiaryStoryModal from '@/components/diary/DiaryStoryModal';
import { useFriendManagement } from '@/hooks/useFriendManagement';
import { useDiaryData } from '@/hooks/useDiaryData';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import type { Friend } from '@/types/friend';

interface HomeCalendarProps {
  viewedUser?: Friend;
  initialDate?: Date;
}

const HomeCalendar = ({
  viewedUser: initialViewedUser,
  initialDate,
}: HomeCalendarProps) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const isDesktopOrLaptop = useMediaQuery({ query: '(min-width: 768px)' });
  const isMyCalendar =
    !initialViewedUser || user?.id === initialViewedUser.userId;
  
  // 친구 관리 훅
  const {
    viewedUser: selectedViewedUser,
    fetchFriendStatus,
    nextFriend,
    prevFriend,
  } = useFriendManagement(user?.id);

  // 실제로 표시할 유저 결정
  const viewedUser = selectedViewedUser || initialViewedUser;

  const isOwner = !viewedUser || viewedUser.userId === user?.id;

  // 빈 함수 추가
  const noop = () => {};

  // 캘린더 네비게이션 훅
  const {
    currentDate,
    setCurrentDate,
    isPickerOpen,
    setIsPickerOpen,
    direction,
    containerRef,
    swipeHandlers,
  } = useCalendarNavigation(
    isDesktopOrLaptop,
    isMyCalendar ? nextFriend : noop,
    isMyCalendar ? prevFriend : noop,
    initialDate,
  );

  // 다이어리 데이터 훅
  const {
    pikus,
    selectedDiary,
    isLoading,
    loadDiaryDetail,
    closeDiaryDetail,
  } = useDiaryData(currentDate, user, viewedUser);

  // 친구 상태 페치
  useEffect(() => {
    if (viewedUser && user) {
      fetchFriendStatus(viewedUser.userId);
    }
  }, [viewedUser, user, fetchFriendStatus]);

  const handleDayClick = async (diaryId: number) => {
    await loadDiaryDetail(diaryId);
  };

  const today = startOfDay(new Date());

  const slideVariants = {
    initial: (customDirection: 'up' | 'down') => ({
      y: customDirection === 'up' ? '-10vh' : '10vh',
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'tween' as const,
        ease: 'easeInOut' as const,
        duration: 0.4,
      },
    },
    exit: (customDirection: 'up' | 'down') => ({
      y: customDirection === 'up' ? '10vh' : '-10vh',
      opacity: 0,
      transition: {
        type: 'tween' as const,
        ease: 'easeInOut' as const,
        duration: 0.4,
      },
    }),
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>사용자 정보 로딩 중...</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden xl:pb-0 h-full"
      ref={containerRef}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={viewedUser ? viewedUser.userId : user.id}
          className="h-full flex flex-col"
          variants={slideVariants}
          custom={direction}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <HomeCalendarHeader
            user={user}
            viewedUser={viewedUser}
            currentDate={currentDate}
            isPickerOpen={isPickerOpen}
            onPickerToggle={() => setIsPickerOpen(!isPickerOpen)}
            onDateChange={setCurrentDate}
          />

          <PikuCalendar
            targetUser={viewedUser || undefined}
            currentDate={currentDate}
            pikus={pikus}
            handlers={swipeHandlers}
            today={today}
            onDayClick={handleDayClick}
            isMyCalendar={isOwner}
          />
        </motion.div>
      </AnimatePresence>

      {selectedDiary &&
        (isDesktopOrLaptop ? (
          <DiaryDetailModal diary={selectedDiary} onClose={closeDiaryDetail} />
        ) : (
          <DiaryStoryModal diary={selectedDiary} onClose={closeDiaryDetail} />
        ))}

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
          <p className="text-white">로딩 중...</p>
        </div>
      )}
    </div>
  );
};

export default HomeCalendar; 