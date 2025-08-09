import api from './api';
import { DiaryContent, DiaryDetail } from '@/types/diary';

interface DiaryImageInfo {
  type: 'AI_IMAGE' | 'USER_IMAGE';
  order: number;
  aiPhotoId?: number;
  photoIndex?: number;
}

interface DiaryDTO {
  status: string;
  content: string;
  imageInfos: DiaryImageInfo[];
  date: string;
}

export interface DiaryCreateRequest {
  diary: DiaryDTO;
  photos?: File[];
}

export const createDiary = async (diaryData: DiaryCreateRequest) => {
  const formData = new FormData();

  // DiaryDTO를 JSON 문자열로 변환하여 추가
  formData.append('diary', new Blob([JSON.stringify(diaryData.diary)], { type: 'application/json' }));

  // 사용자 사진 파일 추가
  if (diaryData.photos) {
    diaryData.photos.forEach(photoFile => {
      formData.append('photos', photoFile);
    });
  }

  const response = await api.post('/diary', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateDiary = async (
  diaryId: number,
  diaryData: any, // DiaryCreateRequest,
) => {
  const formData = new FormData();

  // if (diaryData.photos) {
  //   diaryData.photos.forEach(photoFile => {
  //     formData.append('photos', photoFile);
  //   });
  // }

  // if (diaryData.aiPhotos) {
  //   diaryData.aiPhotos.forEach(aiPhoto => {
  //     formData.append('aiPhotos', aiPhoto);
  //   });
  // }

  // if (diaryData.deletedUrls) {
  //   diaryData.deletedUrls.forEach(url => {
  //     formData.append('deletedUrls', url);
  //   });
  // }

  // formData.append('status', diaryData.status);
  // formData.append('content', diaryData.content);

  // // TODO: Let's consider whether to allow date changes
  // // formData.append('date', diaryData.date);

  // if (diaryData.coverPhotoType && diaryData.coverPhotoIndex !== undefined) {
  //   formData.append('coverPhotoType', diaryData.coverPhotoType);
  //   formData.append('coverPhotoIndex', String(diaryData.coverPhotoIndex));
  // }

  // const response = await api.put(`/diary/${diaryId}`, formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //   },
  // });
  // return response.data;
  return Promise.resolve(); // 임시 반환
};

export const generateAiPhotos = async (content: string) => {
   if (!content || content.trim().length === 0) {
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
  userId: string,
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