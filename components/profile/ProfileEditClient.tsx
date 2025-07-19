'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { ProfilePreviewDTO } from '@/types/profile';
import { useRouter } from 'next/navigation';

interface ProfileEditClientProps {
  profileData: ProfilePreviewDTO;
  onSave: (formData: any) => void;
}

const ProfileEditClient = ({
  profileData,
  onSave,
}: ProfileEditClientProps) => {
  const router = useRouter();
  const [nickname, setNickname] = useState(profileData.nickname);
  const [email, setEmail] = useState('user@example.com'); // TODO: 실제 이메일로 교체
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(
    profileData.avatar,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 비밀번호 확인 로직 추가
    const formData = {
      nickname,
      email,
      password,
      profileImage: imageFile,
    };
    onSave(formData);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <form onSubmit={handleSubmit}>
        <div className="relative w-32 h-32 mx-auto mb-8">
          <Image
            src={profileImage || '/default-avatar.png'}
            alt="Profile Picture"
            width={128}
            height={128}
            className="rounded-full object-cover border"
          />
          <label
            htmlFor="profile-image-upload"
            className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer border shadow-sm"
          >
            <Camera className="w-5 h-5" />
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              닉네임
            </label>
            <div className="flex">
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="flex-grow block w-full px-4 py-3 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-sm font-semibold text-gray-700 border-t border-b border-r border-gray-300 rounded-r-md hover:bg-gray-200"
              >
                중복확인
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              disabled // 이메일은 변경 불가
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              placeholder="새 비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              id="confirm-password"
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-3 bg-gray-200 text-black rounded-lg font-semibold hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditClient; 