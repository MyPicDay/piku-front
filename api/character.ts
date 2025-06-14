import api from '@/api/api';

export interface FixedCharacter {
  id: number;
  displayImageUrl: string;
  type: string;
}

export const getFixedCharacters = async () => {
  const response = await api.get<FixedCharacter[]>('/api/characters/fixed');
  return response.data;
}; 