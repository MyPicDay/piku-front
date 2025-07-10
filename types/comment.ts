import type { Page } from './api';

// 댓글 작성자 정보
// 더 이상 RootComment에 포함되지 않으므로 주석 처리 또는 삭제 가능
/*
export interface CommentMember {
  memberId: string;
  nickname: string;
  avatar?: string;
}
*/

// 댓글 응답 타입
export interface Comment {
  id: number;
  diaryId: number;
  userId: string;
  nickname: string;
  avatar: string | null;
  content: string;
  parentId: number | null;
  createdAt: string;
  updatedAt?: string;
  replyCount: number;
}

// 댓글 작성 요청 타입
export interface CommentCreateRequest {
  diaryId: number;
  content: string;
  parentId?: number; // 대댓글인 경우
}

// 댓글 수정 요청 타입
export interface CommentUpdateRequest {
  content: string;
}

// 댓글 생성 응답 타입
export interface CommentCreateResponse {
  id: number;
  content: string;
  createdAt: string;
}

// 댓글 목록 응답 타입 - 삭제됨
/*
export interface CommentListResponse {
  comments: Comment[];
  totalCount: number;
}
*/

// 루트 댓글 페이지 응답 타입
export type CommentPage = Page<Comment>; 