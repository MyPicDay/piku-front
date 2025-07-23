import { useState, useEffect } from 'react';
import { getMonthlyDiaries, getDiaryById } from '@/api/diary';
import type { MonthlyDiary, DiaryDetail } from '@/types/diary';
import type { Friend } from '@/types/friend';
import type { User } from '@/types/auth';

export const useDiaryData = (
  currentDate: Date, 
  user: User | null, 
  viewedUser?: Friend | null
) => {
  const [pikus, setPikus] = useState<{
    [key: string]: { id: number; imageUrl: string };
  }>({});
  const [selectedDiary, setSelectedDiary] = useState<DiaryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDiaries = async () => {
      const targetUser = viewedUser || user;
      if (!targetUser) return;

      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const diaries: MonthlyDiary[] = await getMonthlyDiaries(
          'userId' in targetUser ? targetUser.userId : targetUser.id,
          year,
          month,
        );
        const newPikus = diaries.reduce(
          (acc, diary) => {
            acc[diary.date] = {
              id: diary.diaryId,
              imageUrl: diary.coverPhotoUrl,
            };
            return acc;
          },
          {} as { [key: string]: { id: number; imageUrl: string } },
        );
        setPikus(newPikus);
      } catch (error) {
        console.error('Failed to fetch monthly diaries:', error);
        setPikus({});
      }
    };

    fetchDiaries();
  }, [currentDate, user, viewedUser]);

  const loadDiaryDetail = async (diaryId: number) => {
    setIsLoading(true);
    try {
      const diaryDetail = await getDiaryById(diaryId);
      setSelectedDiary(diaryDetail);
    } catch (error) {
      console.error('Failed to fetch diary details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeDiaryDetail = () => {
    setSelectedDiary(null);
  };

  return {
    pikus,
    selectedDiary,
    isLoading,
    loadDiaryDetail,
    closeDiaryDetail,
  };
}; 