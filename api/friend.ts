import { Friend, FriendRequest, FriendshipStatus, FriendRequestDto, FriendRequestResponseDto, PaginatedFriendsResponse } from '@/types/friend';
import api from '@/api/api';

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
export const getFriendRequests = async (): Promise<FriendRequest[]> => {
  try {
    const response = await api.get('/relation/requests');
    return response.data;
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
  console.log(`Deleting friend ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
};

// 특정 사용자와의 친구 상태를 가져오는 모의 함수
export const getFriendshipStatus = async (
  userId: string,
): Promise<FriendshipStatus> => {
  console.log(`Checking friendship status with user ${userId}`);
  const numericUserId = parseInt(userId, 10);
  // 실제 애플리케이션에서는 API 호출을 통해 상태를 가져옵니다.
  // 여기서는 userId에 따라 다른 상태를 반환하도록 간단히 구현합니다.
  if (numericUserId % 3 === 0) {
    return FriendshipStatus.FRIEND;
  }
  if (numericUserId % 3 === 1) {
    return FriendshipStatus.REQUEST_SENT;
  }
  return FriendshipStatus.NONE;
};

// 보낸 친구 요청 취소
export const cancelFriendRequest = async (userId: string): Promise<FriendRequestResponseDto> => {
  try {
    const response = await api.delete(`/relation/cancel/${userId}`);
    return response.data;
  } catch (error) {
    console.error('친구 요청 취소 오류:', error);
    throw error;
  }
}; 