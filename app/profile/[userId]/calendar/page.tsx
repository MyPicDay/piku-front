import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필 캘린더 - PikU',
  description: '사용자의 감정 캘린더를 월별로 확인하세요',
};
import { Suspense } from 'react';
import CalendarClient from '@/components/profile/CalendarClient';
import { Loader2 } from 'lucide-react';

const CalendarPage = async ({
  params,
}: {
  params: Promise<{ userId: string }>;
}) => {
  const { userId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
      }
    >
      <CalendarClient userId={userId} />
    </Suspense>
  );
};

export default CalendarPage;
