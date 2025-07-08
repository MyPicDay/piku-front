export interface Friend {
  userId: string;
  nickname: string;
  avatar: string;
}

export interface PaginatedFriendsResponse {
  friends: Friend[] | null;
  hasNext: boolean;
  totalElements: number;
}

export type FriendRequest = Friend;

export enum FriendshipStatus {
  NONE = 'NONE',
  FRIEND = 'FRIEND',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  SELF = 'SELF',
}

export interface UserProfile {
  nickname: string;
  avatar: string;
  diaryCount: number;
  friendCount: number;
  friendshipStatus: FriendshipStatus;
}

// 백엔드 API 요청/응답 타입들
export interface FriendRequestDto {
  toUserId: string;
}

export interface FriendRequestResponseDto {
  isAccepted: boolean;
  message: string;
} 