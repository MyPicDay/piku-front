import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필 - PikU',
  description: '사용자의 공개 프로필과 감정 기록',
};
import ProfilePageClient from '@/components/profile/ProfilePageClient';

const ProfilePage = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;

  return <ProfilePageClient userId={userId} />;
};

export default ProfilePage;