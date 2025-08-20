import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '검색 - PikU',
  description: '키워드로 친구와 일기를 검색하세요',
};
// app/search/page.tsx
import SearchClient from '@/components/search/SearchClient';

const SearchPage = () => {
  return <SearchClient />;
};

export default SearchPage;
