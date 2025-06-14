'use client';

import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useSwipeable } from 'react-swipeable';
import { format, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import { ChevronDown, Send } from 'lucide-react';
import useAuthStore from '@/components/store/authStore';
import PikuCalendar from '@/components/calendar/PikuCalendar';
import YearMonthPicker from '@/components/calendar/YearMonthPicker';

const samplePikus: { [key: string]: string } = {
  '2025-06-02': '/next.svg',
  '2025-06-04': '/next.svg',
  '2025-06-06': '/next.svg',
  '2025-06-08': '/next.svg',
  '2025-06-10': '/next.svg',
  '2025-06-11': '/next.svg',
  '2025-06-12': '/next.svg',
  '2025-06-14': '/next.svg',
  '2025-06-16': '/next.svg',
  '2025-06-18': '/next.svg',
};

const MainClient = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-06-19T00:00:00'));
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { user } = useAuthStore();
  const isDesktopOrLaptop = useMediaQuery({ query: '(min-width: 768px)' });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handlers = useSwipeable({
    onSwipedLeft: () => nextMonth(),
    onSwipedRight: () => prevMonth(),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const today = new Date('2025-06-19T00:00:00');

  const renderMobileView = () => (
    <div className="flex flex-col h-screen">
      <header className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">PikU</h1>
          <Send className="w-6 h-6" />
        </div>
        <div className="flex justify-between items-center space-x-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Image
              src="/vercel.svg" // Placeholder
              alt="profile"
              width={40}
              height={40}
              className="rounded-full bg-gray-200 flex-shrink-0"
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
        pikus={samplePikus}
        handlers={handlers}
        today={today}
      />
    </div>
  );

  const renderDesktopView = () => (
    <div className="p-4">
      <h1 className="text-2xl">PC 화면은 현재 개발 중입니다.</h1>
      <p>창 크기를 줄여 모바일 화면을 확인해주세요.</p>
    </div>
  );

  // return isDesktopOrLaptop ? renderDesktopView() : renderMobileView();
  return renderMobileView();
};

export default MainClient; 