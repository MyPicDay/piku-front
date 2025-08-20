import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '새 일기 작성 - PikU',
  description: '오늘의 감정을 기록해보세요',
};
import DiaryCreateForm from '@/components/diary/DiaryCreateForm';

const DiaryCreatePage = async ({ params }: { params: Promise<{ date: string }> }) => {
  const { date } = await params;
  return <DiaryCreateForm date={date} />;
};

export default DiaryCreatePage;
