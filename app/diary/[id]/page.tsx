import DiaryDetailClient from '@/components/diary/DiaryDetailClient';

const DiaryDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const diaryId = Number(id);

  if (isNaN(diaryId)) {
    return <div>유효하지 않은 일기 ID입니다.</div>;
  }

  return <DiaryDetailClient diaryId={diaryId} />;
};

export default DiaryDetailPage; 