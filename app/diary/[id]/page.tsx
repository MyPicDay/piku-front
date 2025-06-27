import DiaryDetailClient from '@/components/diary/DiaryDetailClient';

interface DiaryDetailPageProps {
  params: {
    id: string;
  };
}

const DiaryDetailPage = async ({ params }: DiaryDetailPageProps) => {
  const { id } = await params;
  const diaryId = Number(id);
  return <DiaryDetailClient diaryId={diaryId} />;
};

export default DiaryDetailPage; 