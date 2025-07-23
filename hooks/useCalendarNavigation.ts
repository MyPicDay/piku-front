import { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { addMonths, subMonths } from 'date-fns';

export const useCalendarNavigation = (
  isDesktopOrLaptop: boolean,
  onNextUser: () => void,
  onPrevUser: () => void,
  initialDate?: Date,
) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const containerRef = useRef<HTMLDivElement>(null);
  const isWheeling = useRef(false);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const nextUser = () => {
    setDirection('down');
    onNextUser();
  };

  const prevUser = () => {
    setDirection('up');
    onPrevUser();
  };

  // 휠 이벤트 처리
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!isDesktopOrLaptop || isWheeling.current) return;

      const throttleTime = 500;
      if (Math.abs(event.deltaY) > 5) {
        event.preventDefault();
        isWheeling.current = true;

        if (event.deltaY > 0) {
          nextUser();
        } else {
          prevUser();
        }

        setTimeout(() => {
          isWheeling.current = false;
        }, throttleTime);
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isDesktopOrLaptop, nextUser, prevUser]);

  // 스와이프 핸들러
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextMonth(),
    onSwipedRight: () => prevMonth(),
    onSwipedUp: () => nextUser(),
    onSwipedDown: () => prevUser(),
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return {
    currentDate,
    setCurrentDate,
    isPickerOpen,
    setIsPickerOpen,
    direction,
    containerRef,
    nextMonth,
    prevMonth,
    swipeHandlers,
  };
}; 