'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { useMediaQuery } from 'react-responsive';
import { startOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '@/components/store/authStore';
import PikuCalendar, {
  type ImageRecoveryStatus,
} from '@/components/calendar/PikuCalendar';
import HomeCalendarHeader from '@/components/home/HomeCalendarHeader';
import DiaryDetailModal from '@/components/diary/DiaryDetailModal';
import DiaryStoryModal from '@/components/diary/DiaryStoryModal';
import { useFriendManagement } from '@/hooks/useFriendManagement';
import { useDiaryData } from '@/hooks/useDiaryData';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { Friend } from '@/types/friend';

interface HomeCalendarProps {
  viewedUser?: Friend;
  initialDate?: Date;
  diaryId?: string | null;
}

const HomeCalendar = ({
  viewedUser: initialViewedUser,
  initialDate,
  diaryId,
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

  const [isCommentViewOpen, setIsCommentViewOpen] = useState(false);
  const calendarHistoryId = useId();
  const detailHistorySequenceRef = useRef(0);
  // 다이어리 데이터 훅
  const {
    pikus,
    selectedDiary,
    isLoading,
    refetchMonthlyDiaries,
    loadDiaryDetail,
    closeDiaryDetail,
    removeDiary,
  } = useDiaryData(currentDate, user, viewedUser);
  useBodyScrollLock(isLoading);

  const recoveryScopeKey = `${
    viewedUser?.userId ?? user?.id ?? 'none'
  }:${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
  const [imageRecoveryState, setImageRecoveryState] = useState<{
    scopeKey: string;
    status: ImageRecoveryStatus;
  }>({
    scopeKey: recoveryScopeKey,
    status: 'idle',
  });
  const recoveryAttemptRef = useRef({
    scopeKey: recoveryScopeKey,
    attempted: false,
  });
  const imageRecoveryStatus =
    imageRecoveryState.scopeKey === recoveryScopeKey
      ? imageRecoveryState.status
      : 'idle';

  useEffect(() => {
    recoveryAttemptRef.current = {
      scopeKey: recoveryScopeKey,
      attempted: false,
    };
    setImageRecoveryState({
      scopeKey: recoveryScopeKey,
      status: 'idle',
    });
  }, [recoveryScopeKey]);

  const handleImageError = useCallback(() => {
    if (recoveryAttemptRef.current.scopeKey !== recoveryScopeKey) {
      recoveryAttemptRef.current = {
        scopeKey: recoveryScopeKey,
        attempted: false,
      };
    }

    if (recoveryAttemptRef.current.attempted) return;

    recoveryAttemptRef.current.attempted = true;
    const requestScope = recoveryScopeKey;
    setImageRecoveryState({
      scopeKey: requestScope,
      status: 'recovering',
    });

    void refetchMonthlyDiaries()
      .catch(() => undefined)
      .then(() => {
        setImageRecoveryState(currentState =>
          currentState.scopeKey === requestScope
            ? {
                scopeKey: requestScope,
                status: 'exhausted',
              }
            : currentState,
        );
      });
  }, [recoveryScopeKey, refetchMonthlyDiaries]);

  useEffect(() => {
    if (!selectedDiary || isCommentViewOpen) return;

    const detailHistoryId = `${calendarHistoryId}:${++detailHistorySequenceRef.current}`;
    const handlePopState = (event: PopStateEvent) => {
      // 공유에서 현재 상세로 돌아온 경우만 유지하고 이전 상세 항목과는 구분한다.
      if (event.state?.calendarDiaryDetail === detailHistoryId) return;
      closeDiaryDetail();
    };

    window.history.pushState({ modal: 'open', calendarDiaryDetail: detailHistoryId }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedDiary, closeDiaryDetail, isCommentViewOpen, calendarHistoryId]);

  useEffect(() => {
    if (diaryId) {
      loadDiaryDetail(Number(diaryId));
    }
  }, [diaryId, loadDiaryDetail]);

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
      className="flex flex-col h-full overflow-hidden"
      ref={containerRef}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={viewedUser ? viewedUser.userId : user.id}
          className="h-full flex flex-col overflow-hidden"
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
            onMonthChange={setCurrentDate}
            isMyCalendar={isOwner}
            imageRecoveryStatus={imageRecoveryStatus}
            onImageError={handleImageError}
          />
        </motion.div>
      </AnimatePresence>

      {selectedDiary &&
        (isDesktopOrLaptop ? (
          <DiaryDetailModal
            diary={selectedDiary}
            onClose={closeDiaryDetail}
            onDelete={removeDiary}
          />
        ) : (
          <DiaryStoryModal
            diary={selectedDiary}
            onClose={closeDiaryDetail}
            onCommentViewToggle={setIsCommentViewOpen}
            onDelete={removeDiary}
          />
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
