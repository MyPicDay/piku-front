import {
  Friend,
  FriendRequest,
  FriendRequestDto,
  FriendRequestResponseDto,
  PaginatedFriendsResponse,
  PaginatedFriendRequestsResponse,
  UserProfile,
  FriendshipStatus,
} from '@/types/friend';
import api from '@/lib/api/api';

// 친구 목록
export const getFriends = async (page: number, size: number): Promise<PaginatedFriendsResponse> => {
  try {
    const response = await api.get('/relation', {
      params: { page, size },
    });
    // 백엔드 응답이 Page<Friend> 형태라고 가정
    return {
      friends: response.data.content,
      hasNext: !response.data.last,
      totalElements: response.data.totalElements,
    };
  } catch (error) {
    console.error('친구 목록 조회 오류:', error);
    throw error;
  }
};

// 친구 요청
export const sendFriendRequest = async (userId: string): Promise<FriendRequestResponseDto> => {
  try {
    const requestData: FriendRequestDto = { toUserId: userId };
    const response = await api.post('/relation', requestData);
    return response.data;
  } catch (error) {
    console.error('친구 요청 오류:', error);
    throw error;
  }
};

// 받은 친구 요청 목록 조회
export const getFriendRequests = async (
  page: number,
  size: number,
): Promise<PaginatedFriendRequestsResponse> => {
  try {
    const response = await api.get('/relation/requests', {
      params: { page, size },
    });
    return {
      requests: response.data.content,
      hasNext: !response.data.last,
      totalElements: response.data.totalElements,
    };
  } catch (error) {
    console.error('받은 친구 요청 목록 조회 오류:', error);
    throw error;
  }
};

// 친구 요청 수락
export const acceptFriendRequest = async (userId: string): Promise<FriendRequestResponseDto> => {
  try {
    const requestData: FriendRequestDto = { toUserId: userId };
    const response = await api.post('/relation', requestData);
    return response.data;
  } catch (error) {
    console.error('친구 요청 수락 오류:', error);
    throw error;
  }
  };

// 친구 요청 거절
export const rejectFriendRequest = async (userId: string): Promise<FriendRequestResponseDto> => {
  try {
    const response = await api.delete(`/relation/requests/${userId}`);
    return response.data;
  } catch (error) {
    console.error('친구 요청 거절 오류:', error);
    throw error;
  }
};

export const deleteFriend = async (userId: string): Promise<void> => {
  try {
    await api.delete(`/relation/${userId}`);
  } catch (error) {
    console.error('친구 삭제 오류:', error);
    throw error;
  }
};

// 보낸 친구 요청 취소
export const cancelFriendRequest = async (
  userId: string,
): Promise<FriendRequestResponseDto> => {
  try {
    const response = await api.delete(`/relation/cancel/${userId}`);
    return response.data;
  } catch (error) {
    console.error('친구 요청 취소 오류:', error);
    throw error;
  }
};

export const getProfileInfo = async (
  userId: string,
): Promise<UserProfile> => {
  const response = await api.get(`/users/${userId}/profile-preview`);
  return response.data;
}; 