import { Friend } from '@/types/friend';
import { Page } from '@/types/api';
import api from './api';

export const searchUsers = async (
  keyword: string,
  page: number,
  size: number = 20
): Promise<Page<Friend>> => {
  if (!keyword.trim()) {
    return {
      content: [],
      last: true,
      totalPages: 0,
      totalElements: 0,
      size,
      number: page,
      first: page === 0,
      numberOfElements: 0,
      empty: true,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: page * size,
        paged: true,
        unpaged: false,
      },
      sort: { empty: true, sorted: false, unsorted: true },
    };
  }

  try {
    const response = await api.get<Page<Friend>>('/search', {
      params: { keyword, page, size },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};
