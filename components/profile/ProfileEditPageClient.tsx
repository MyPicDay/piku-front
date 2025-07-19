'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import ProfileEditClient from '@/components/profile/ProfileEditClient';
import { UserProfileData } from '@/types/profile';

interface ProfileEditPageClientProps {
  profileData: UserProfileData;
  onSave: (formData: any) => void;
}

const ProfileEditPageClient = ({
  profileData,
  onSave,
}: ProfileEditPageClientProps) => {
  const router = useRouter();

  const Header = () => (
    <header className="sticky top-0 z-10 flex items-center justify-center p-4 border-b bg-white xl:hidden">
      <button onClick={() => router.back()} className="absolute left-4">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="text-lg font-semibold">프로필 편집</h1>
    </header>
  );

  return (
    <>
      <Header />
      <ProfileEditClient profileData={profileData} onSave={onSave} />
    </>
  );
};

export default ProfileEditPageClient; 