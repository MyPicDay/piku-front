'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import FeedCard from './FeedCard';
import { getFeed } from '@/api/feed';
import { getDiaryById } from '@/api/diary';
import { FeedDiary, DiaryDetail } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';
import DiaryDetailModal from '../diary/DiaryDetailModal';
import DiaryStoryModal from '../diary/DiaryStoryModal';

const FeedClient = () => {
  const [feed, setFeed] = useState<FeedDiary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const [isClient, setIsClient] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleContentClick = async (diaryId: number) => {
    if (isClient) {
      setIsLoadingDetail(true);
      try {
        const diaryDetail = await getDiaryById(diaryId);
        setSelectedDiary(diaryDetail);
      } catch (error) {
        console.error('Failed to fetch diary details', error);
        alert('일기 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedDiary(null);
  };

  const loadMore = useCallback(async () => {
    // 함수 시작점에서 즉시 체크하여 레이스 컨디션 방지
    if (loading || !hasMore) {
      return;
    }
    setLoading(true);
    try {
      const pageData = await getFeed(page, 10);
      setFeed(prevFeed => {
        const existingIds = new Set(prevFeed.map(p => p.diaryId));
        const uniqueNewPosts = pageData.content.filter(
          p => !existingIds.has(p.diaryId),
        );
        return [...prevFeed, ...uniqueNewPosts];
      });
      setHasMore(!pageData.last);
      setPage(prevPage => prevPage + 1);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]); // page를 의존성에 명시적으로 추가

  const lastPostElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore],
  );

  // 최초 로딩을 위한 useEffect
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFriendshipStatusChange = (
    diaryId: number,
    newStatus: FriendshipStatus,
  ) => {
    setFeed(prevFeed =>
      prevFeed.map(post =>
        post.diaryId === diaryId
          ? { ...post, friendStatus: newStatus }
          : post,
      ),
    );
  };

  // 초기 로딩 화면
  if (page === 0 && loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>피드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[600px] space-y-8 py-8">
      {feed.map((post, index) => (
        <div
          key={post.diaryId}
          ref={index === feed.length - 1 ? lastPostElementRef : null}
        >
          <FeedCard
            post={post}
            onFriendshipStatusChange={handleFriendshipStatusChange}
            onContentClick={() => handleContentClick(post.diaryId)}
          />
        </div>
      ))}
      {loading && !isLoadingDetail && (
        <div className="flex h-20 items-center justify-center">
          <p>피드를 더 불러오는 중...</p>
        </div>
      )}
      {isLoadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <p className="text-white">일기 정보를 불러오는 중...</p>
        </div>
      )}
      {!hasMore && feed.length > 0 && (
        <div className="py-8 text-center text-gray-500">
          <p>모든 피드를 다 봤어요!</p>
        </div>
      )}
      {selectedDiary &&
        (isDesktop ? (
          <DiaryDetailModal diary={selectedDiary} onClose={handleCloseModal} />
        ) : (
          <DiaryStoryModal diary={selectedDiary} onClose={handleCloseModal} />
        ))}
    </div>
  );
};

export default FeedClient; 