'use client';

import { useState, useEffect } from 'react';
import { setYear, setMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearMonthPickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onClose: () => void;
}

const YearMonthPicker = ({
  currentDate,
  onDateChange,
  onClose,
}: YearMonthPickerProps) => {
  const [tempDate, setTempDate] = useState(currentDate);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // requestAnimationFrame을 사용하여 브라우저가 준비되었을 때 애니메이션을 시작합니다.
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // 300ms는 애니메이션 지속 시간과 일치해야 합니다.
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    handleClose();
  };

  const handleYearChange = (year: number) => {
    const newDate = setYear(tempDate, year);
    setTempDate(newDate);
  };

  const handleMonthSelect = (month: number) => {
    const newDate = setMonth(tempDate, month);
    setTempDate(newDate);
  };

  const pickerYear = tempDate.getFullYear();

  return (
    <div
      className={`fixed inset-0 bg-black z-40 flex justify-center items-end transition-opacity duration-300 ${
        isVisible ? 'bg-opacity-30' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg bg-white rounded-t-2xl p-4 z-50 transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <h2 className="text-lg font-bold text-center mb-6">날짜 선택</h2>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => handleYearChange(pickerYear - 1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">{pickerYear}년</span>
          <button
            onClick={() => handleYearChange(pickerYear + 1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {Array.from(Array(12).keys()).map(month => (
            <button
              key={month}
              onClick={() => handleMonthSelect(month)}
              className={`p-3 text-base rounded-lg font-semibold ${
                tempDate.getMonth() === month
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              {month + 1}월
            </button>
          ))}
        </div>
        <button
          onClick={handleConfirm}
          className="w-full mt-4 bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default YearMonthPicker; 