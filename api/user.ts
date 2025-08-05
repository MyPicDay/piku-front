import {
  UserProfileResponseDTO,
  NicknameAvailabilityResponseDTO,
  UpdateProfileResponseDTO,
  UpdateProfilePayload,
} from '@/types/profile';
import api from './api';

export const getUserProfile = async (
  userId: string,
): Promise<UserProfileResponseDTO> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const checkNicknameAvailability = async (
  nickname: string,
): Promise<NicknameAvailabilityResponseDTO> => {
  const response = await api.get(`/users/nickname/availability`, {
    params: { nickname },
  });
  return response.data;
};


export const updateUserProfile = async (
  data: UpdateProfilePayload,
): Promise<UpdateProfileResponseDTO> => {
  const response = await api.patch(`/users/profile`, data);
  return response.data;
};

// FCM 토큰을 서버에 등록하는 함수
export const registerFCMToken = async (userId: string, token: string, deviceId: string) => {
  try {
    const response = await api.post('/fcm', { userId, token, deviceId });
    return response.data;
  } catch (error) {
    console.error('Failed to register FCM token:', error);
    throw error;
  }
}; 