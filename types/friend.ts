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
  REQUEST_SENT = 'REQUEST_SENT',
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
}

// 백엔드 API 요청/응답 타입들
export interface FriendRequestDto {
  toUserId: string;
}

export interface FriendRequestResponseDto {
  isAccepted: boolean;
  message: string;
} 