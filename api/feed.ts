import { FeedDiary, Page } from '@/types/diary';
import api from './api';

export const getFeed = async (page: number, size: number): Promise<Page<FeedDiary>> => {
  const response = await api.get<Page<FeedDiary>>('/diary', {
    params: {
      page,
      size,
      sort: 'createdAt,desc',
    },
  });
  return response.data;
}; 