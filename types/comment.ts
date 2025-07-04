// 댓글 작성자 정보
export interface CommentMember {
  memberId: string;
  nickname: string;
  avatar?: string;
}

// 댓글 응답 타입
export interface Comment {
  commentId: number;
  member: CommentMember;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: number; // 대댓글인 경우 원댓글 ID
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

// 댓글 목록 응답 타입
export interface CommentListResponse {
  comments: Comment[];
  totalCount: number;
} 