import CalendarClient from '@/components/profile/CalendarClient';

const CalendarPage = async ({ params }: { params: Promise<{ userId: string }>}) => {
  const { userId } = await params;

  return <CalendarClient userId={userId}/>;
};

export default CalendarPage;
