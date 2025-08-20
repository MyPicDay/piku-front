import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '일기 수정 - PikU',
  description: '작성한 일기를 수정합니다',
};
'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import DiaryEditForm from '@/components/diary/DiaryEditForm';
import { getDiaryById } from '@/api/diary';
import { DiaryDetail } from '@/types/diary';

const DiaryEditPage = () => {
  const params = useParams();
  const id = params.id as string;

  const [diaryData, setDiaryData] = useState<DiaryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const diaryId = parseInt(id, 10);
    if (isNaN(diaryId)) {
      setIsLoading(false);
      notFound();
      return;
    }

    const fetchDiary = async () => {
      setIsLoading(true);
      try {
        const data = await getDiaryById(diaryId);
        if (!data) {
          notFound();
        } else {
          setDiaryData(data);
        }
      } catch (error: any) {
        console.error(`Failed to fetch diary with id ${diaryId}:`, error);
        if (error.response?.status === 404 || error.response?.status === 403) {
          notFound();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiary();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!diaryData) {
    // notFound() should have been called, but as a safeguard.
    return null;
  }

  return <DiaryEditForm initialDiaryData={diaryData} />;
};

export default DiaryEditPage; 