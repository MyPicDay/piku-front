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
} 