import { Friend, FriendRequest } from '@/types/friend';

// Mock data
const mockFriends: Friend[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  nickname: '테스트 계정',
  profileImageUrl: '/next.svg',
}));

const mockRequests: FriendRequest[] = Array.from({ length: 3 }, (_, i) => ({
  id: 100 + i + 1,
  nickname: '테스트 계정',
  profileImageUrl: '/next.svg',
}));

export const getFriends = async (): Promise<Friend[]> => {
  console.log('Fetching friends...');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockFriends;
};

export const getFriendRequests = async (): Promise<FriendRequest[]> => {
  console.log('Fetching friend requests...');
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRequests;
};

export const acceptFriendRequest = async (userId: number): Promise<void> => {
  console.log(`Accepting request from user ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const rejectFriendRequest = async (userId: number): Promise<void> => {
  console.log(`Rejecting request from user ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const deleteFriend = async (userId: number): Promise<void> => {
  console.log(`Deleting friend ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
}; 