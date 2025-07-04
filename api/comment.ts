import api from './api';
import type {
  Comment,
  CommentCreateRequest,
  CommentUpdateRequest,
  CommentListResponse,
} from '@/types/comment';

// 특정 일기의 댓글 목록 조회
export const getComments = async (diaryId: number): Promise<Comment[]> => {
  try {
    const response = await api.get<CommentListResponse>(`/comments`, {
      params: { diaryId },
    });
    return response.data.comments || [];
  } catch (error) {
    console.error('댓글 조회 실패:', error);
    throw error;
  }
};

// 댓글 작성
export const createComment = async (
  data: CommentCreateRequest,
): Promise<Comment> => {
  try {
    const response = await api.post<Comment>('/comments', data);
    return response.data;
  } catch (error) {
    console.error('댓글 작성 실패:', error);
    throw error;
  }
};

// 댓글 수정
export const updateComment = async (
  commentId: number,
  data: CommentUpdateRequest,
): Promise<Comment> => {
  try {
    const response = await api.patch<Comment>(`/comments/${commentId}`, data);
    return response.data;
  } catch (error) {
    console.error('댓글 수정 실패:', error);
    throw error;
  }
};

// 댓글 삭제 (백엔드에 API가 없지만 향후 추가를 위해 준비)
export const deleteComment = async (commentId: number): Promise<void> => {
  try {
    await api.delete(`/comments/${commentId}`);
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    throw error;
  }
}; 