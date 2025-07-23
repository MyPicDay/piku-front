'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { UserProfileResponseDTO } from '@/types/profile';
import { useRouter } from 'next/navigation';
import {
  checkNicknameAvailability,
  updateUserNickname,
} from '@/api/user';
import useAuthStore from '../store/authStore';

interface ProfileEditClientProps {
  profileData: UserProfileResponseDTO;
  onSave: (formData: { nickname: string; profileImage: File | null }) => void;
}

const ProfileEditClient = ({
  profileData,
}: ProfileEditClientProps) => {
  const router = useRouter();
  const { user, login: updateUserInStore } = useAuthStore();
  const [nickname, setNickname] = useState(profileData.nickname);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState<boolean | null>(
    null,
  );
  const [nicknameCheckMessage, setNicknameCheckMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(
    profileData.avatar,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const originalNickname = profileData.nickname;

  useEffect(() => {
    if (nickname === originalNickname) {
      setIsNicknameAvailable(true);
      setNicknameCheckMessage('');
    } else {
      setIsNicknameAvailable(null);
      setNicknameCheckMessage('');
    }
  }, [nickname, originalNickname]);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleCheckNickname = async () => {
    if (!nickname.trim() || nickname === originalNickname) return;
    try {
      const { success, message } = await checkNicknameAvailability(nickname);
      setIsNicknameAvailable(success);
      setNicknameCheckMessage(message);
    } catch (error: any) {
      setIsNicknameAvailable(false);
      setNicknameCheckMessage(
        error.response?.data?.message || '닉네임 확인 중 오류가 발생했습니다.',
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname !== originalNickname && isNicknameAvailable !== true) {
      alert('닉네임 중복 확인을 통과해야 합니다.');
      return;
    }
    
    if (nickname !== originalNickname) {
        try {
            const { success, message, newNickname } = await updateUserNickname(nickname);
            if (success && user) {
                const updatedUser = { ...user, nickname: newNickname || nickname };
                updateUserInStore(updatedUser);
                alert('닉네임이 성공적으로 변경되었습니다.');
                router.push(`/profile/${user.id}`);
            } else {
                alert(`닉네임 변경 실패: ${message}`);
            }
        } catch (error: any) {
            alert(`닉네임 변경 중 오류 발생: ${error.response?.data?.message || error.message}`);
        }
    }
    
    // TODO: 이미지 업로드 로직 추가
    console.log('이미지 파일:', imageFile);
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
            <div className="flex items-start">
              <div className="flex-grow">
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={handleNicknameChange}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 rounded-r-none"
                />
                {nicknameCheckMessage && (
                  <p
                    className={`mt-1 text-xs ${
                      isNicknameAvailable ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {nicknameCheckMessage}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCheckNickname}
                disabled={!nickname.trim() || nickname === originalNickname}
                className="px-4 py-3 bg-gray-100 text-sm font-semibold text-gray-700 border-t border-b border-r border-gray-300 rounded-r-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                style={{ height: '50px' }}
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
              value={user?.email || ''}
              readOnly
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100 cursor-not-allowed"
            />
          </div>
          {/* 
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
              // value={password}
              // onChange={e => setPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              id="confirm-password"
              placeholder="새 비밀번호 확인"
              // value={confirmPassword}
              // onChange={e => setConfirmPassword(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div> 
          */}
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