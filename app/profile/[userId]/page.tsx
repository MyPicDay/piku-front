import ProfilePageClient from '@/components/profile/ProfilePageClient';

const ProfilePage = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const { userId } = await params;

  return <ProfilePageClient userId={userId} />;
};

export default ProfilePage;