import {
  UserProfileResponseDTO,
  NicknameAvailabilityResponseDTO,
  NicknameChangeResponseDTO,
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

interface UpdateProfilePayload {
  newNickname?: string;
  characterId?: number;
}

export const updateUserProfile = async (
  data: UpdateProfilePayload,
): Promise<UserProfileResponseDTO> => {
  const response = await api.patch(`/users/profile`, data);
  return response.data;
}; 