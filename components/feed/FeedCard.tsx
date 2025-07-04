import { FeedDiary } from '@/types/diary';
import Image from 'next/image';
import { formatTimeAgo, formatYearMonthDayDots } from '@/lib/utils/date';
import {
  BookmarkIcon,
  CommentIcon,
  MoreIcon,
  ShareIcon,
  SmileyIcon,
} from '../icons/FeedIcons';
import Link from 'next/link';

interface FeedCardProps {
  post: FeedDiary;
}

const FeedCard = ({ post }: FeedCardProps) => {
  const photoUrl =
    post.imgUrls && post.imgUrls.length > 0
      ? post.imgUrls[0]
      : 'https://via.placeholder.com/600';
  const avatarUrl = post.avatar
    ? post.avatar
    : 'https://via.placeholder.com/32';

  return (
    <div className="w-full rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <Image
            src={avatarUrl}
            alt={post.nickname}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold">{post.nickname}</p>
            <p className="text-xs text-gray-500">
              {formatYearMonthDayDots(post.date)}
            </p>
          </div>
        </div>
        <button>
          <MoreIcon />
        </button>
      </div>

      <div className="relative aspect-square w-full">
        <Image
          src={photoUrl}
          alt="Diary image"
          layout="fill"
          objectFit="cover"
        />
      </div>

      <div className="p-3">
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <Link href={`/diary/${post.diaryId}`}>
              <CommentIcon />
            </Link>
            <button>
              <ShareIcon />
            </button>
          </div>
          <button>
            <BookmarkIcon />
          </button>
        </div>
      </div>

      <div className="px-3">
        <p className="truncate text-sm">
          <span className="mr-1 font-semibold">{post.nickname}</span>
          {post.content}
        </p>
      </div>

      <div className="px-3 pt-1">
        <Link href={`/diary/${post.diaryId}`}>
          <p className="cursor-pointer text-sm text-gray-500">
            View comments
          </p>
        </Link>
      </div>

      <div className="px-3 pt-1">
        <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <SmileyIcon />
          <input
            type="text"
            placeholder="Add a comment..."
            className="w-full border-none bg-transparent text-sm focus:outline-none"
          />
        </div>
        <button className="text-sm font-semibold text-blue-500">게시</button>
      </div>
    </div>
  );
};

export default FeedCard; 