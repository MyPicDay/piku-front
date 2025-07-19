import api from './api';
import type {
  Comment,
  CommentCreateRequest,
  CommentCreateResponse,
  CommentUpdateRequest,
  CommentPage,
} from '@/types/comment';

// 특정 일기의 루트 댓글 목록 조회 (페이징)
export const getRootComments = async (
  diaryId: number,
  page: number,
  size: number,
): Promise<CommentPage> => {
  try {
    const response = await api.get<CommentPage>('/comments', {
      params: { diaryId, page, size },
    });
    return response.data;
  } catch (error) {
    console.error('루트 댓글 조회 실패:', error);
    throw error;
  }
};

// 특정 댓글의 대댓글 목록 조회 (페이징)
export const getReplies = async (
  commentId: number,
  page: number,
  size: number,
): Promise<CommentPage> => {
  try {
    const response = await api.get<CommentPage>(`/comments/${commentId}/replies`, {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    console.error('대댓글 조회 실패:', error);
    throw error;
  }
};

// 댓글 작성
export const createComment = async (
  data: CommentCreateRequest,
): Promise<CommentCreateResponse> => {
  try {
    const response = await api.post<CommentCreateResponse>('/comments', data);
    return response.data;
  } catch (error) {
    console.error('댓글 작성 실패:', error);
    throw error;
  }
};

// 댓글 수정
export const updateComment = async (
  commentId: number,
  content: string,
): Promise<Comment> => {
  const commentUpdateDto = { content };
  const response = await api.patch<Comment>(
    `/comments/${commentId}`,
    commentUpdateDto,
  );
  return response.data;
};

// 댓글 삭제 (백엔드에 API가 없지만 향후 추가를 위해 준비)
export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
}; 