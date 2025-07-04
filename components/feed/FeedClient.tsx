'use client';

import { useEffect, useState } from 'react';
import FeedCard from './FeedCard';
import { getFeed } from '@/api/feed';
import { FeedDiary } from '@/types/diary';

const FeedClient = () => {
  const [feed, setFeed] = useState<FeedDiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const pageData = await getFeed(0, 10);
        setFeed(pageData.content);
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-20">
        <p>피드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] space-y-8 py-8">
      {feed.map(post => (
        <FeedCard key={post.diaryId} post={post} />
      ))}
    </div>
  );
};

export default FeedClient; 