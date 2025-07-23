export interface Friend {
  userId: string;
  nickname: string;
  avatar: string;
}

export interface PaginatedFriendsResponse {
  friends: Friend[];
  hasNext: boolean;
  totalElements: number;
}

export interface PaginatedFriendRequestsResponse {
  requests: FriendRequest[];
  hasNext: boolean;
  totalElements: number;
}

export type FriendRequest = Friend;

export enum FriendshipStatus {
  NONE = 'NONE',
  FRIEND = 'FRIENDS',
  SENT = 'REQUESTED',
  RECEIVED = 'RECEIVED',
}

export interface UserProfile {
  userId: string;
  nickname: string;
  avatar: string;
  diaryCount: number;
  friendCount: number;
  friendStatus: FriendshipStatus;
}

// 백엔드 API 요청/응답 타입들
export interface FriendRequestDto {
  toUserId: string;
}

export interface FriendRequestResponseDto {
  isAccepted: boolean;
  message: string;
} 