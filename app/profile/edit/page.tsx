import ProfileEditPageClient from '@/components/profile/ProfileEditPageClient';

const mockMyProfileData = {
  nickname: '내 닉네임',
  characterImageUrl: 'https://placehold.co/128x128',
  friendCount: 125,
  diaryCount: 56,
  monthlyDiaryStatus: [],
};

export default function ProfileEditPage() {
  // TODO: 실제 API를 통해 현재 사용자 프로필 데이터 가져오기
  const profileData = mockMyProfileData;

  const handleSave = async (formData: any) => {
    'use server';
    // TODO: 프로필 업데이트 API 호출
    console.log('저장할 데이터:', formData);
    // 성공 시 프로필 페이지로 리다이렉트
  };

  return (
    <ProfileEditPageClient profileData={profileData} onSave={handleSave} />
  );
} 