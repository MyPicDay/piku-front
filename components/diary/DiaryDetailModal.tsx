import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { DiaryDetail } from '@/types/diary';

interface DiaryDetailModalProps {
  diary: DiaryDetail;
  onClose: () => void;
}

const DiaryDetailModal = ({ diary, onClose }: DiaryDetailModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!diary) return null;
	console.log(diary);

  const handleEditClick = () => {
    router.push(`/diary/edit/${diary.diaryId}`);
    onClose();
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (diary.imgUrls && diary.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === 0 ? diary.imgUrls.length - 1 : prev - 1,
      );
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (diary.imgUrls && diary.imgUrls.length > 0) {
      setCurrentImageIndex(prev =>
        prev === diary.imgUrls.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const DEFAULT_AVATAR = 'globe.svg';

  const handleAvatarError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    e.currentTarget.src = DEFAULT_AVATAR;
  };

  const dummyComments = [
    {
      commentId: 1,
      member: {
        memberId: 2,
        nickname: 'friend_1',
        avatar: '/next.svg',
      },
      content: '와 사진 정말 멋지다! ✨',
      createdAt: '2023-10-27T10:00:00Z',
      updatedAt: '2023-10-27T10:00:00Z',
    },
    {
      commentId: 2,
      member: {
        memberId: 3,
        nickname: 'user_123',
        avatar: '/globe.svg',
      },
      content: '여기 어디야? 나도 가보고 싶어!',
      createdAt: '2023-10-27T11:30:00Z',
      updatedAt: '2023-10-27T11:30:00Z',
    },
  ];

  const displayImage = diary.imgUrls?.[currentImageIndex] || '/vercel.svg';

  const displayDate = diary.createdAt
    ? new Date(diary.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '날짜 정보 없음';
  const displayContent = diary.content || '작성된 내용이 없습니다.';

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <X size={32} />
      </button>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-9/10 h-[90vh] flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Left side: Image */}
        <div className="w-3/5 h-full relative bg-black">
          <Image
            src={displayImage}
            alt="Diary image"
            layout="fill"
            objectFit="contain"
          />
          {diary.imgUrls && diary.imgUrls.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-opacity z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-opacity z-10"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Right side: Content and Comments */}
        <div className="w-2/5 h-full flex flex-col bg-white">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center">
              {/* <Image
                src={diary.avatar}
                alt={diary.nickname}
                width={32}
                height={32}
                className="rounded-full"
              /> */}
              <img
                src={diary.avatar || DEFAULT_AVATAR}
                alt={diary.nickname}
                width={32}
                height={32}
                className="rounded-full"
                onError={handleAvatarError}
              />
              <p className="font-bold ml-3 text-sm">{diary.nickname}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:opacity-60 cursor-pointer"
              >
                <MoreHorizontal size={24} />
              </button>
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-20 border border-gray-200"
                >
                  <button
                    onClick={handleEditClick}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    일기 수정
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section (scrollable) */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {/* Diary Content (as first comment) */}
            <div className="flex items-start">
              <img
                src={diary.avatar || DEFAULT_AVATAR}
                alt={diary.nickname}
                width={32}
                height={32}
                className="rounded-full mr-3 mt-1"
                onError={handleAvatarError}
              />
              {/* <Image
                src={diary.avatar}
                alt={diary.nickname}
                width={32}
                height={32}
                className="rounded-full mr-3 mt-1"
              /> */}
              <div>
                <p className="text-sm">
                  <span className="font-bold">{diary.nickname}</span>{' '}
                  {displayContent}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(diary.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Dummy Comments */}
            {dummyComments.map(comment => (
              <div key={comment.commentId} className="flex items-start">
                <img
                  src={comment.member.avatar || DEFAULT_AVATAR}
                  alt={comment.member.nickname}
                  width={32}
                  height={32}
                  className="rounded-full mr-3 mt-1"
                  onError={handleAvatarError}
                />
                <div>
                  <p className="text-sm">
                    <span className="font-bold">{comment.member.nickname}</span>{' '}
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button className="hover:opacity-60">
                  <Heart size={24} />
                </button>
                <button className="hover:opacity-60">
                  <MessageCircle size={24} />
                </button>
                <button className="hover:opacity-60">
                  <Send size={24} />
                </button>
              </div>
              <button className="hover:opacity-60">
                <Bookmark size={24} />
              </button>
            </div>
            <p className="font-bold text-sm mt-2">좋아요 1,234개</p>
            <p className="text-gray-500 text-xs mt-1 uppercase">{displayDate}</p>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="댓글 달기..."
                className="w-full bg-transparent focus:outline-none text-sm"
              />
              <button className="text-blue-500 font-bold hover:text-blue-700 text-sm">
                게시
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryDetailModal; 