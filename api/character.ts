import api from '@/api/api';

export interface FixedCharacter {
  id: number;
  displayImageUrl: string;
  type: string;
}

export const getFixedCharacters = async () => {
  const response = await api.get<FixedCharacter[]>('/characters/fixed');
  return response.data;
}; 