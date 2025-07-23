import { FriendshipStatus as FriendStatus } from './friend';

export interface DiaryMonthCountDTO {
  year: number;
  month: number;
  count: number;
  daysInMonth: number; // 월의 총 일수 (프론트에서 계산해서 추가)
}

export interface UserProfileResponseDTO {
  id: string;
  userId: string; // userId 속성 추가
  nickname: string;
  avatar: string;
  friendCount: number;
  diaryCount: number;
  friendStatus: FriendStatus;
  isOwner: boolean;
  monthlyDiaryCount: DiaryMonthCountDTO[];
}

export interface NicknameAvailabilityResponseDTO {
  success: boolean;
  message: string;
}

export interface NicknameChangeResponseDTO {
  success: boolean;
  message: string;
  newNickname?: string;
} 