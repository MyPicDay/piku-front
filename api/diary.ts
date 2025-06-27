import api from './api';
import { DiaryCreateRequest, DiaryContent, DiaryDetail } from '@/types/diary';

export const createDiary = async (diaryData: DiaryCreateRequest) => {
  const formData = new FormData();

  console.log(diaryData);

  if (diaryData.photos) {
    diaryData.photos.forEach((photoFile: File) => {
      formData.append('photos', photoFile);
    });
  }
  
  if (diaryData.aiPhotos) {
    diaryData.aiPhotos.forEach((aiPhoto: string) => {
      formData.append('aiPhotos', aiPhoto);
    });
  }

  formData.append('status', diaryData.status);
  formData.append('content', diaryData.content);
  formData.append('date', diaryData.date);

  if (diaryData.coverPhotoType && diaryData.coverPhotoIndex !== undefined) {
    formData.append('coverPhotoType', diaryData.coverPhotoType);
    formData.append('coverPhotoIndex', String(diaryData.coverPhotoIndex));
  }

  const response = await api.post('/diary', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateDiary = async (diaryId: number, diaryData: DiaryCreateRequest) => {
  const formData = new FormData();

  if (diaryData.photos) {
    diaryData.photos.forEach(photoFile => {
      formData.append('photos', photoFile);
    });
  }

  if (diaryData.aiPhotos) {
    diaryData.aiPhotos.forEach(aiPhoto => {
      formData.append('aiPhotos', aiPhoto);
    });
  }
  
  if (diaryData.deletedUrls) {
    diaryData.deletedUrls.forEach(url => {
      formData.append('deletedUrls', url);
    });
  }

  formData.append('status', diaryData.status);
  formData.append('content', diaryData.content);

  // TODO: Let's consider whether to allow date changes
  // formData.append('date', diaryData.date); 
  
  if (diaryData.coverPhotoType && diaryData.coverPhotoIndex !== undefined) {
    formData.append('coverPhotoType', diaryData.coverPhotoType);
    formData.append('coverPhotoIndex', String(diaryData.coverPhotoIndex));
  }

  const response = await api.put(`/diary/${diaryId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export const generateAiPhotos = async (content: string) => {
   if (!content || content.trim().length === 0) {
    console.log('내용이 없어 null을 반환합니다.');
    return Promise.resolve(null);
  }

  const photo = await api.post('/diary/ai/generate', {
    content,
  });
  return photo.data;

};

export interface CalendarDiaryResponseDTO {
  diaryId: number;
  coverPhotoUrl: string;
  date: string; // 'yyyy-MM-dd'
}

export const getMonthlyDiaries = async (
  userId: number,
  year: number,
  month: number
): Promise<CalendarDiaryResponseDTO[]> => {
  try {
    const response = await api.get(
      `/diary/user/${userId}/monthly?year=${year}&month=${month}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly diaries:', error);
    throw error;
  }
};

export const getDiaryById = async (diaryId: number): Promise<DiaryDetail> => {
  try {
    const response = await api.get<DiaryDetail>(`/diary/${diaryId}`);
    return response.data;
  } catch (error) {
    console.error('일기 상세 조회 API 오류:', error);
    throw error;
  }
}; 