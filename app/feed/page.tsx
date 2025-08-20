import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '피드 - PikU',
  description: '친구들의 감정과 일기를 한눈에 보는 피드',
};
import FeedClient from '@/components/feed/FeedClient';
import { Suspense } from 'react';

const FeedPage = () => {
  return (
    <div className="w-full">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center pt-20">
            피드를 불러오는 중...
          </div>
        }
      >
        <FeedClient />
      </Suspense>
    </div>
  );
};

export default FeedPage; 