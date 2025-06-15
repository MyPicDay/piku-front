import DiaryCreateForm from '@/components/diary/DiaryCreateForm';

interface DiaryCreatePageProps {
  params: {
    date: string;
  };
}

const DiaryCreatePage = async ({ params }: DiaryCreatePageProps) => {
  const { date } = await params;

  return <DiaryCreateForm date={date} />;
};

export default DiaryCreatePage;
