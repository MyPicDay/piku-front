import DiaryCreateForm from '@/components/diary/DiaryCreateForm';

const DiaryCreatePage = async ({ params }: { params: Promise<{ date: string }> }) => {
  const { date } = await params;

  return <DiaryCreateForm date={date} />;
};

export default DiaryCreatePage;
