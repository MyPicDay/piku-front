'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, Send } from 'lucide-react';
import type { Friend } from '@/types/friend';
import type { User } from '@/types/auth';
import YearMonthPicker from '@/components/calendar/YearMonthPicker';

interface HomeCalendarHeaderProps {
  user: User | null;
  viewedUser?: Friend | null;
  currentDate: Date;
  isPickerOpen: boolean;
  onPickerToggle: () => void;
  onDateChange: (date: Date) => void;
}

const HomeCalendarHeader = ({
  user,
  viewedUser,
  currentDate,
  isPickerOpen,
  onPickerToggle,
  onDateChange,
}: HomeCalendarHeaderProps) => {
  return (
    <header className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between md:hidden">
        <h1 className="text-2xl font-bold">PikU</h1>
        {/* <Send className="w-6 h-6" /> */}
      </div>
      
      <div className="flex items-center justify-between space-x-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={(viewedUser ? viewedUser.avatar : user?.avatar) || '/vercel.svg'}
            alt="profile"
            width={48}
            height={48}
            className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 md:h-12 md:w-12"
          />
          <div className="min-w-0">
            <p className="truncate font-bold md:text-lg">
              {(viewedUser ? viewedUser.nickname : user?.nickname) || 'User'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-shrink-0">
            <button
              onClick={onPickerToggle}
              className="flex cursor-pointer items-center space-x-1"
            >
              <span className="text-lg font-bold md:text-xl">
                {format(currentDate, 'yy년 M월', { locale: ko })}
              </span>
              <ChevronDown className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            {isPickerOpen && (
              <YearMonthPicker
                currentDate={currentDate}
                onDateChange={onDateChange}
                onClose={onPickerToggle}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeCalendarHeader; 