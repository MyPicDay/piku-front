import api from './api';

interface DiaryData {
  status: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  content: string;
  aiPhotos: string[];
  photos: File[];
  date: string;
}

export const createDiary = async (diaryData: DiaryData) => {
  const formData = new FormData();

  const diaryRequestDto = {
    status: diaryData.status,
    content: diaryData.content,
    date: diaryData.date,
    aiPhotos: diaryData.aiPhotos,
  };

  const diaryBlob = new Blob([JSON.stringify(diaryRequestDto)], {
    type: 'application/json',
  });

  formData.append('request', diaryBlob);

  diaryData.photos.forEach(photoFile => {
    formData.append('photos', photoFile);
  });

  // --- [개발용] 요청 데이터 콘솔 출력 ---
  console.log('========= 일기 생성 요청 데이터 =========');
  console.log('Request DTO:', diaryRequestDto);
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`FormData[${key}]:`, {
        name: value.name,
        size: value.size,
        type: value.type,
      });
    } else {
      console.log(`FormData[${key}]:`, value);
    }
  }
  console.log('=======================================');

  // const response = await api.post('/api/diaries', formData, {
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //   },
  // });
  // return response.data;

  // --- [개발용] 더미 응답 ---
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 딜레이
  return Promise.resolve({
    isSuccess: true,
    message: '더미 응답: 일기가 성공적으로 생성되었습니다.',
    diaryId: `dummy-${Date.now()}`,
  });
}; 