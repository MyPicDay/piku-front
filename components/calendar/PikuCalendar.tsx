'use client';

import { useRouter } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isEqual,
  getDay,
  differenceInCalendarDays,
} from 'date-fns';
import type { SwipeableHandlers } from 'react-swipeable';

interface PikuCalendarProps {
  currentDate: Date;
  pikus: { [key: string]: { id: number; imageUrl: string } };
  handlers: SwipeableHandlers;
  today: Date;
  onDayClick: (diaryId: number) => void;
}

const PikuCalendar = ({
  currentDate,
  pikus,
  handlers,
  today,
  onDayClick,
}: PikuCalendarProps) => {
  const router = useRouter();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

  const getDayClassName = (
    day: Date,
    isCurrentMonth: boolean,
    isFuture: boolean
  ) => {
    if (!isCurrentMonth || isFuture) return 'text-gray-300';
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0) return 'text-red-500'; // Sunday
    if (dayOfWeek === 6) return 'text-blue-500'; // Saturday
    return 'text-black';
  };

  return (
    <main {...handlers} className="flex-grow flex flex-col p-2">
      <div className="grid grid-cols-7 text-center text-sm text-gray-500">
        {dayNames.map(day => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-grow gap-1">
        {days.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const pikuData = pikus[dateKey];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isEqual(day, today);
          const isFutureDate = differenceInCalendarDays(day, today) > 0;

          const canView = pikuData && isCurrentMonth;
          const canCreate = !pikuData && isCurrentMonth && !isFutureDate;

          const handleClick = () => {
            if (canView) {
              onDayClick(pikuData.id);
            } else if (canCreate) {
              router.push(`/diary/new/${dateKey}`);
            }
          };

          return (
            <div
              key={day.toString()}
              onClick={handleClick}
              className={`relative flex justify-center items-center overflow-hidden rounded-md  ${
                isCurrentDay ? 'border-yellow-400 border-2' : ''
              } ${
                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${canCreate || canView ? 'cursor-pointer hover:bg-gray-100' : ''}`}
            >
              {pikuData && isCurrentMonth ? (
                <img
                  src={pikuData.imageUrl}
                  alt={`piku for ${dateKey}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className={`${getDayClassName(
                    day,
                    isCurrentMonth,
                    isFutureDate
                  )} font-medium`}
                >
                  {format(day, 'd')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default PikuCalendar; 