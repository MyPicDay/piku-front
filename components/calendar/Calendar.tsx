'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// Dummy data - replace with actual API call
const getDiariesForMonth = async (year: number, month: number) => {
    console.log(`Fetching diaries for ${year}-${month + 1}`);
    // In a real app, you would make an API call here.
    // Returning dummy data based on the provided image.
    return [
        { day: 2, imageUrl: 'https://i.imgur.com/8L3j2B5.png' }, // placeholder
        { day: 4, imageUrl: 'https://i.imgur.com/BAnEVlS.png' }, // placeholder
        { day: 6, imageUrl: 'https://i.imgur.com/xO4b2oE.png' }, // placeholder
        { day: 8, imageUrl: 'https://i.imgur.com/qEaCV8y.png' }, // placeholder
        { day: 9, imageUrl: 'https://i.imgur.com/e8Jv4zG.png' }, // placeholder
        { day: 10, imageUrl: 'https://i.imgur.com/3jL4JjU.png' }, // placeholder
        { day: 12, imageUrl: 'https://i.imgur.com/9C2d4Vv.png' }, // placeholder
        { day: 14, imageUrl: 'https://i.imgur.com/c5gO8fI.png' }, // placeholder
        { day: 16, imageUrl: 'https://i.imgur.com/rG7b8tC.png' }, // placeholder
    ];
};

interface Diary {
    day: number;
    imageUrl: string;
}

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 5)); // June 2025
    const [days, setDays] = useState<(Date | null)[]>([]);
    const [diaries, setDiaries] = useState<Diary[]>([]);
    const [selectedDate, setSelectedDate] = useState<number>(19); // Example selected date

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const fetchDiaries = async () => {
            const diaryData = await getDiariesForMonth(year, month);
            setDiaries(diaryData);
        };
        fetchDiaries();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth: (Date | null)[] = [];
        
        // Adjust for week starting on Monday
        let startingDay = firstDayOfMonth.getDay() - 1;
        if (startingDay < 0) startingDay = 6;

        for (let i = 0; i < startingDay; i++) {
            daysInMonth.push(null);
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            daysInMonth.push(new Date(year, month, i));
        }

        setDays(daysInMonth);
    }, [currentDate]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
    
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between items-center my-4">
                <button onClick={() => changeMonth(-1)} className="text-2xl">‹</button>
                <h2 className="font-bold text-lg">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </h2>
                <button onClick={() => changeMonth(1)} className="text-2xl">›</button>
            </div>

            <div className="grid grid-cols-7 text-center text-sm text-gray-500">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 mt-2">
                {days.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`}></div>;
                    const diary = diaries.find(d => d.day === day.getDate());
                    const isSelected = selectedDate === day.getDate();
                    const isToday = new Date().toDateString() === day.toDateString();
                    // Weekends based on original getDay()
                    const dayOfWeek = day.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    return (
                        <div 
                            key={index} 
                            className={`aspect-square flex flex-col items-center justify-start p-1 ${isSelected ? 'border-2 border-yellow-400 rounded-lg' : ''}`}
                            onClick={() => setSelectedDate(day.getDate())}
                        >
                            <span className={`text-sm ${isWeekend ? 'text-red-500' : 'text-black'}`}>
                                {day.getDate()}
                            </span>
                            {diary && (
                                <div className="relative w-full h-full mt-1">
                                    <img src={diary.imageUrl} alt={`Diary for ${day.getDate()}`} width={100} height={100} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar; 