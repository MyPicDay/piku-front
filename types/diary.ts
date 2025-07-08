import { z } from 'zod';
import { FriendshipStatus } from './friend';

export const diarySchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요.'),
});

export type DiaryFormValues = z.infer<typeof diarySchema>;

export type UnifiedPhoto = {
  id: string;
  url: string;
  type: 'ai' | 'user';
  file?: File;
};

export type PrivacyStatus = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
export type CoverPhotoType = 'AI_IMAGE' | 'USER_IMAGE';

export interface DiaryCreateRequest {
  status: PrivacyStatus;
  content: string;
  aiPhotos?: string[];
  photos?: File[];
  date: string;
  coverPhotoType?: CoverPhotoType;
  coverPhotoIndex?: number;
  deletedUrls?: string[];
}

export interface DiaryContent {
  content: string;
}

export interface Author {
  memberId: number;
  nickname: string;
  avatar: string;
}

export interface Diary {
  diaryId: number;
  content: string;
  date: string; // "YYYY-MM-DD"
  status: PrivacyStatus;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  imgUrls: string[];
  nickname: string;
  avatar: string;
}

export interface Comment {
  commentId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  member: Author;
}

export interface DiaryDetail extends Diary {
  comments: Comment[];
}

export interface FeedDiary {
  diaryId: number;
  status: PrivacyStatus;
  content: string;
  imgUrls: string[];
  date: string; // LocalDate -> "YYYY-MM-DD"
  nickname: string;
  avatar: string;
  userId: string;
  createdAt: string; // LocalDateTime -> ISO String
  friendshipStatus: FriendshipStatus;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface MonthlyDiary {
  diaryId: number;
  date: string;
  coverPhotoUrl: string;
}

export interface DiaryCreateForm {
  status: 'PUBLIC' | 'PRIVATE';
  content: string;
  aiPhotos?: string[];
  photos?: File[];
  date: string;
  coverPhotoType?: CoverPhotoType;
  coverPhotoIndex?: number;
} 