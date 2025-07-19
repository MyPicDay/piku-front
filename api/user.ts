import { UserProfileResponseDTO } from '@/types/profile';
import api from './api';

export const getUserProfile = async (
  userId: string,
): Promise<UserProfileResponseDTO> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}; 