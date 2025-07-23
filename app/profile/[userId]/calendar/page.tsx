import CalendarClient from '@/components/profile/CalendarClient';

interface CalendarPageProps {
  params: { userId: string };
  searchParams: { date?: string };
}

const CalendarPage = ({ params, searchParams }: CalendarPageProps) => {
  const { userId } = params;
  const { date } = searchParams;

  return <CalendarClient userId={userId} dateStr={date} />;
};

export default CalendarPage;
