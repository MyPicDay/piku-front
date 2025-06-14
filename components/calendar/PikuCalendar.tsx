'use client';

import Image from 'next/image';
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
} from 'date-fns';
import type { SwipeableHandlers } from 'react-swipeable';

interface PikuCalendarProps {
  currentDate: Date;
  pikus: { [key: string]: string };
  handlers: SwipeableHandlers;
  today: Date;
}

const PikuCalendar = ({
  currentDate,
  pikus,
  handlers,
  today,
}: PikuCalendarProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

  const getDayClassName = (day: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'text-gray-300';
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
          const pikuImage = pikus[dateKey];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isEqual(day, today);

          return (
            <div
              key={day.toString()}
              className={`relative flex justify-center items-center overflow-hidden rounded-md ${
                isCurrentDay ? 'border-yellow-400 border-2' : ''
              } ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}`}
            >
              {pikuImage && isCurrentMonth ? (
                <Image
                  src={pikuImage}
                  alt={`piku for ${dateKey}`}
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <span
                  className={`${getDayClassName(
                    day,
                    isCurrentMonth
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