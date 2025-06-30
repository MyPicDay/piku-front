import DiaryDetailClient from '@/components/diary/DiaryDetailClient';

const DiaryDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const diaryId = Number(id);
  return <DiaryDetailClient diaryId={diaryId} />;
};

export default DiaryDetailPage; 