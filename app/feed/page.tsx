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