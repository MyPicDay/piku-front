'use client';

import Image from 'next/image';
import Link from 'next/link';

interface UserProfileProps {
  userId: string;
  nickname: string;
  avatar: string;
  imageSize?: number;
  containerClassName?: string;
  imageClassName?: string;
  nicknameClassName?: string;
  timestamp?: React.ReactNode;
  timestampClassName?: string;
}

const UserProfile = ({
  userId,
  nickname,
  avatar,
  imageSize = 32,
  containerClassName = '',
  imageClassName = '',
  nicknameClassName = '',
  timestamp,
  timestampClassName = '',
}: UserProfileProps) => {
  const avatarUrl = avatar || `https://via.placeholder.com/${imageSize}`;
  const profileUrl = `/profile/${userId}`;

  return (
    <Link
      href={profileUrl}
      className={`inline-flex items-start ${containerClassName}`}
    >
      <Image
        src={avatarUrl}
        alt={nickname}
        width={imageSize}
        height={imageSize}
        className={`flex-shrink-0 rounded-full object-cover ${imageClassName}`}
        unoptimized
      />
      <span className="ml-2">
        <span className={`text-sm font-semibold ${nicknameClassName}`}>
          {nickname}
        </span>
        {timestamp && (
          <span
            className={`mt-1 block text-xs text-gray-400 dark:text-gray-500 ${timestampClassName}`}
          >
            {timestamp}
          </span>
        )}
      </span>
    </Link>
  );
};

export default UserProfile; 