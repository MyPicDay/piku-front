'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { searchUsers } from '@/lib/api/search';
import { Friend } from '@/types/friend';

const SearchClient = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState<Friend[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLLIElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNext) {
          setPage(prevPage => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasNext]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setPage(0);
      setHasNext(true);
      return;
    }

    setPage(0);
    setHasNext(true);
    setLoading(true);
    setError(null);
    
    searchUsers(debouncedQuery, 0)
      .then(data => {
        setResults(data.content);
        setHasNext(!data.last);
      })
      .catch(err => {
        setError('검색 중 오류가 발생했습니다.');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [debouncedQuery]);

  useEffect(() => {
    if (page === 0) return;

    setLoading(true);
    setError(null);

    searchUsers(debouncedQuery, page)
      .then(data => {
        setResults(prevResults => [...prevResults, ...data.content]);
        setHasNext(!data.last);
      })
      .catch(err => {
        setError('검색 중 오류가 발생했습니다.');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page]);


  return (
    <div className="max-w-xl mx-auto p-4">
      <input
        type="text"
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setQuery(e.target.value)
        }
        placeholder="닉네임을 입력하세요..."
        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
      />

      {error && <p className="text-center mt-4 text-red-500">{error}</p>}

      {!loading && results.length === 0 && (
        <p className="text-center mt-4 text-gray-500">
          {query ? '검색 결과가 없습니다.' : '검색어를 입력해주세요.'}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {results.map((user, index) => {
          const isLastElement = index === results.length - 1;
          return (
            <li
              key={`${user.userId}-${index}`}
              ref={isLastElement ? lastElementRef : null}
            >
              <Link
                href={`/profile/${user.userId}`}
                className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Image
                  src={user.avatar || '/default-avatar.png'}
                  alt={`${user.nickname}'s avatar`}
                  width={40}
                  height={40}
                  className="rounded-full mr-3"
                />
                <span>{user.nickname}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      
      {loading && page > 0 && <p className="text-center mt-4">불러오는 중...</p>}
    </div>
  );
};

export default SearchClient;
