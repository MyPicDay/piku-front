import type { Metadata } from 'next';
import DiaryEditClient from '@/components/diary/DiaryEditClient';

export const metadata: Metadata = {
  title: '일기 수정 - PikU',
  description: '작성한 일기를 수정합니다',
};

const DiaryEditPage = () => {
  return <DiaryEditClient />;
};

export default DiaryEditPage; 