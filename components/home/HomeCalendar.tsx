'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useSwipeable } from 'react-swipeable';
import { format, addMonths, subMonths, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import { ChevronDown, Send } from 'lucide-react';
import useAuthStore from '@/components/store/authStore';
import PikuCalendar from '@/components/calendar/PikuCalendar';
import YearMonthPicker from '@/components/calendar/YearMonthPicker';
import { getMonthlyDiaries } from '@/api/diary';
import type { CalendarDiaryResponseDTO } from '@/api/diary';

const HomeCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pikus, setPikus] = useState<{ [key: string]: string }>({});
  const { user } = useAuthStore();
  const isDesktopOrLaptop = useMediaQuery({ query: '(min-width: 768px)' });

  useEffect(() => {
    const fetchDiaries = async () => {
      if (!user) return;

      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const diaries: CalendarDiaryResponseDTO[] = await getMonthlyDiaries(
          user.id,
          year,
          month
        );
        const newPikus = diaries.reduce(
          (acc, diary) => {
            acc[diary.date] = diary.coverPhotoUrl;
            return acc;
          },
          {} as { [key: string]: string }
        );
        setPikus(newPikus);
      } catch (error) {
        console.error('Failed to fetch monthly diaries:', error);
        setPikus({}); // 에러 발생 시 피쿠스 초기화
      }
    };

    fetchDiaries();
  }, [currentDate, user]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handlers = useSwipeable({
    onSwipedLeft: () => nextMonth(),
    onSwipedRight: () => prevMonth(),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const today = startOfDay(new Date());

  const view = () => (
    <div className="flex flex-col h-screen">
      <header className="p-4 space-y-4">
        <div className="flex justify-between items-center md:hidden">
          <h1 className="text-2xl font-bold">PikU</h1>
          <Send className="w-6 h-6" />
        </div>
        <div className="flex justify-between items-center space-x-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Image
              src={user?.avatar || "/vercel.svg"} // Placeholder
              alt="profile"
              width={40}
              height={40}
              className="rounded-full bg-gray-200 flex-shrink-0 h-full"
            />
            <div className="min-w-0">
              <p className="font-bold truncate">{user?.nickname || 'me'}</p>
              <p className="text-sm text-gray-500 truncate">
                프로필에 자기소개를 입력해보세요
              </p>
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="flex items-center space-x-1"
            >
              <span className="text-lg font-bold">
                {format(currentDate, 'yy년 M월', { locale: ko })}
              </span>
              <ChevronDown className="w-5 h-5" />
            </button>
            {isPickerOpen && (
              <YearMonthPicker
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onClose={() => setIsPickerOpen(false)}
              />
            )}
          </div>
        </div>
      </header>

      <PikuCalendar
        currentDate={currentDate}
        pikus={pikus}
        handlers={handlers}
        today={today}
      />
    </div>
  );
  
  return view();
};

export default HomeCalendar; 