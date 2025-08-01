'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDiary, generateAiPhotos } from '@/api/diary';
import useAuthStore from '../store/authStore';
import imageCompression from 'browser-image-compression';
import TextareaAutosize from 'react-textarea-autosize';
import {
  diarySchema,
  DiaryFormValues,
  UnifiedPhoto,
  PrivacyStatus,
} from '@/types/diary';
import {
  X,
  Globe,
  Lock,
  Users,
  Camera,
  Sparkles,
  XCircle,
  LogIn,
  GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import ImagePreviewModal from '../common/ImagePreviewModal';

const MAX_AI_PHOTOS = 3;
const MAX_TOTAL_PHOTOS = 5;

// PhotoItem 컴포넌트 분리
const PhotoItem = ({
  photo,
  isCover,
  onRemove,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  photo: UnifiedPhoto;
  isCover: boolean;
  onRemove: (photo: UnifiedPhoto) => void;
  onClick: (url: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) => {
  const dragControls = useDragControls();
  const [isClicked, setIsClicked] = useState(false);

  return (
    <Reorder.Item
      key={photo.id}
      value={photo}
      as="div"
      className="relative group flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md overflow-hidden cursor-pointer touch-pan-x mr-4"
      dragListener={false}
      dragControls={dragControls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.05, zIndex: 1000, rotate: 2 }}
      onTap={(e: React.MouseEvent<HTMLDivElement>) => {
        // GripVertical이나 XCircle 버튼을 클릭한 경우 이미지 확대 안함
        const target = e.target as Element;
        const isControlButton = target.closest('[data-drag-handle]') || target.closest('[data-remove-button]');
        
        if (!isClicked && !isControlButton) {
          onClick(photo.url);
        }
        setIsClicked(false);
      }}
    >
      <img
        src={photo.url}
        alt="selected photo"
        className="w-full h-full object-cover"
      />

      <div
        data-drag-handle
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragControls.start(e, { snapToCursor: false });
        }}
        className="absolute bottom-1 left-1 p-2 bg-black/70 rounded-full text-white cursor-grab active:cursor-grabbing z-10 touch-manipulation select-none"
        style={{ touchAction: 'none' }}
      >
        <GripVertical size={14} />
      </div>

      <div
        data-remove-button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // setIsClicked(true);
          onRemove(photo);
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white z-20 cursor-pointer"
      >
        <XCircle size={16} />
      </div>
      {isCover && (
        <div className="absolute bottom-0 w-full bg-blue-500 text-white text-xs text-center py-0.5 pointer-events-none">
          대표 사진
        </div>
      )}
    </Reorder.Item>
  );
};

interface DiaryCreateFormProps {
  date: string;
}

const DiaryCreateForm = ({ date }: DiaryCreateFormProps) => {
  const router = useRouter();
  const [allPhotos, setAllPhotos] = useState<UnifiedPhoto[]>([]);
  const [privacy, setPrivacy] = useState<PrivacyStatus>('PUBLIC');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [tempPrivacy, setTempPrivacy] = useState<PrivacyStatus>(privacy);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAiPhotos, setIsGeneratingAiPhotos] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { user, isLoggedIn } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diarySchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (isPrivacyModalOpen) {
      setTempPrivacy(privacy);
    }
  }, [isPrivacyModalOpen, privacy]);

  useEffect(() => {
    // 컴포넌트가 언마운트될 때만 blob URL을 해제하도록 수정
    return () => {
      allPhotos.forEach(photo => {
        if (photo.type === 'user' && photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  // 자동 스크롤 기능
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollSpeed = 4;
      const edgeThreshold = 60;

      let clientX: number;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if ('clientX' in e) {
        clientX = e.clientX;
      } else {
        return;
      }

      // 왼쪽 경계 근처에서 왼쪽으로 스크롤
      if (clientX < rect.left + edgeThreshold && clientX > rect.left - 100) {
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft = Math.max(0, scrollContainerRef.current.scrollLeft - scrollSpeed);
            }
          }, 16);
        }
      }
      // 오른쪽 경계 근처에서 오른쪽으로 스크롤
      else if (clientX > rect.right - edgeThreshold && clientX < rect.right + 100) {
        if (!autoScrollIntervalRef.current) {
          autoScrollIntervalRef.current = setInterval(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft = Math.min(
                scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth,
                scrollContainerRef.current.scrollLeft + scrollSpeed
              );
            }
          }, 16);
        }
      }
      // 경계를 벗어나면 자동 스크롤 중지
      else {
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
      }
    };

    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('touchmove', handlePointerMove as any);
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('touchmove', handlePointerMove as any);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [isDragging]);

  if (!isLoggedIn || !user) {
    return (
      <div className="flex flex-col bg-white dark:bg-black">
        <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
          <button
            onClick={() => router.back()}
            className="cursor-pointer dark:text-white"
          >
            <X size={24} />
          </button>
          <h1 className="text-lg font-semibold dark:text-white">일기 작성</h1>
          <div className="w-6" />
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-6">
            <LogIn size={48} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            로그인이 필요합니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm">
            일기를 작성하려면 먼저 로그인해주세요.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            로그인하기
          </button>
        </main>
      </div>
    );
  }

  const onSubmit = async (data: DiaryFormValues) => {
    if (allPhotos.length === 0) {
      alert('사진을 1장 이상 등록해주세요.');
      return;
    }
    setIsSubmitting(true);

    const userPhotoFiles: File[] = [];
    const imageInfos: {
      type: 'AI_IMAGE' | 'USER_IMAGE';
      order: number;
      aiPhotoId?: number;
      photoIndex?: number;
    }[] = [];

    allPhotos.forEach((photo, index) => {
      if (photo.type === 'ai') {
        imageInfos.push({
          type: 'AI_IMAGE',
          order: index,
          aiPhotoId: Number(photo.id),
        });
      } else if (photo.type === 'user' && photo.file) {
        imageInfos.push({
          type: 'USER_IMAGE',
          order: index,
          photoIndex: userPhotoFiles.length,
        });
        userPhotoFiles.push(photo.file);
      }
    });

    try {
      await createDiary({
        diary: {
          status: privacy,
          content: data.content,
          date,
          imageInfos,
        },
        photos: userPhotoFiles,
      });
      router.push('/');
    } catch (error) {
      console.error('Failed to create diary:', error);
      alert('일기 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAiPhotos = async () => {
    if (allPhotos.length >= MAX_TOTAL_PHOTOS) {
      alert(`사진은 최대 ${MAX_TOTAL_PHOTOS}장까지 추가할 수 있습니다.`);
      return;
    }
    const currentAiPhotosCount = allPhotos.filter(p => p.type === 'ai').length;
    if (currentAiPhotosCount >= MAX_AI_PHOTOS) {
      alert(`AI 사진은 최대 ${MAX_AI_PHOTOS}장까지 생성할 수 있습니다.`);
      return;
    }
    setIsGeneratingAiPhotos(true);
    try {
      const content = getValues('content');
      if (!content || content.trim().length === 0) {
        alert('일기 내용을 먼저 입력해주세요.');
        return;
      }
      const newAiPhoto = await generateAiPhotos(content);
      if (newAiPhoto) {
        const unifiedPhoto: UnifiedPhoto = { ...newAiPhoto, type: 'ai' };
        setAllPhotos(prev => [...prev, unifiedPhoto]);
      }
    } catch (error) {
      console.error('Failed to generate AI photos:', error);
      alert('AI 사진 생성에 실패했습니다.');
    } finally {
      setIsGeneratingAiPhotos(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const availableSlots = MAX_TOTAL_PHOTOS - allPhotos.length;
    if (e.target.files && availableSlots > 0) {
      setIsUploading(true);
      try {
        const newFiles = Array.from(e.target.files).slice(0, availableSlots);

        const newUserPhotosPromises = newFiles.map(async file => {
          try {
            const options = {
              maxSizeMB: 1,
              useWebWorker: true,
            };
            const compressedBlob = await imageCompression(file, options);
            const compressedFile = new File([compressedBlob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            return {
              id: `${compressedFile.name}-${Date.now()}-${Math.random()}`,
              url: URL.createObjectURL(compressedFile),
              type: 'user' as const,
              file: compressedFile,
            };
          } catch (error) {
            console.error('Image compression failed:', error);
            // 압축 실패 시 원본 파일 사용
            return {
              id: `${file.name}-${file.lastModified}-${Math.random()}`,
              url: URL.createObjectURL(file),
              type: 'user' as const,
              file,
            };
          }
        });

        const newUserPhotos = await Promise.all(newUserPhotosPromises);

        setAllPhotos(prev => [...prev, ...newUserPhotos]);
      } finally {
        setIsUploading(false);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsPreviewModalOpen(true);
  };

  const removePhoto = (photoToRemove: UnifiedPhoto) => {
    if (photoToRemove.type === 'user' && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    setAllPhotos(allPhotos.filter(p => p.id !== photoToRemove.id));
  };
  
  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const PrivacyIcon =
    {
      PUBLIC: <Globe size={16} />,
      FRIENDS: <Users size={16} />,
      PRIVATE: <Lock size={16} />,
    }[privacy] || null;

  const privacyText =
    {
      PUBLIC: '전체 공개',
      FRIENDS: '친구 공개',
      PRIVATE: '나만 보기',
    }[privacy] || '';

  const userPhotosCount = allPhotos.filter(p => p.type === 'user').length;
  const aiPhotosCount = allPhotos.filter(p => p.type === 'ai').length;
  const totalPhotosCount = allPhotos.length;

  const handleConfirmPrivacy = () => {
    setPrivacy(tempPrivacy);
    setIsPrivacyModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black">
        <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
            <button
                onClick={() => router.back()}
                className="cursor-pointer dark:text-white"
            >
                <X size={24} />
            </button>
            <h1 className="text-lg font-semibold dark:text-white">
                {'일기 작성'}
            </h1>
            <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="font-semibold text-blue-500 disabled:text-gray-400 dark:disabled:text-gray-600 cursor-pointer"
            >
                {'완료'}
            </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto text-black dark:text-white flex flex-col">
            <div className="flex items-center space-x-3 pb-2">
                {/* 고정 버튼 영역 */}
                <button
                    onClick={handleGenerateAiPhotos}
                    disabled={
                        isGeneratingAiPhotos ||
                        aiPhotosCount >= MAX_AI_PHOTOS ||
                        totalPhotosCount >= MAX_TOTAL_PHOTOS
                    }
                    className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-800 dark:disabled:bg-gray-700 dark:border-gray-600"
                >
                    {isGeneratingAiPhotos ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-xs sm:text-sm mt-1">AI 사진</span>
                            <span className="text-[11px] sm:text-xs">
                                ({aiPhotosCount}/{MAX_AI_PHOTOS})
                            </span>
                        </>
                    )}
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalPhotosCount >= MAX_TOTAL_PHOTOS || isUploading}
                    className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-800 dark:disabled:bg-gray-700 dark:border-gray-600"
                >
                    {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    ) : (
                        <>
                            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-xs sm:text-sm mt-1">사진 추가</span>
                            <span className="text-[11px] sm:text-xs">({userPhotosCount}장)</span>
                        </>
                    )}
                </button>
                <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                />

                {/* 스크롤 가능한 사진 목록 */}
                <div className="overflow-x-auto flex-grow" ref={scrollContainerRef}>
                    <Reorder.Group
                        as="div"
                        axis="x"
                        values={allPhotos}
                        onReorder={setAllPhotos}
                        className="flex"
                    >
                        {allPhotos.map((photo, index) => {
                            const isCover = index === 0;

                            return (
                                <PhotoItem
                                    key={photo.id}
                                    photo={photo}
                                    isCover={isCover}
                                    onRemove={removePhoto}
                                    onClick={handleImageClick}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                />
                            );
                        })}
                    </Reorder.Group>
                </div>
            </div>

            <div className="flex items-center my-4">
                <img
                    src={user?.avatar || '/vercel.svg'}
                    alt="user avatar"
                    width={32}
                    height={32}
                    className="rounded-full mr-2 w-8 h-8"
                />
                <span className="font-semibold dark:text-white">
                    {user?.nickname || 'me'}
                </span>
                <div className="flex-grow" />
                <button
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                    {PrivacyIcon}
                    <span>{privacyText}</span>
                </button>
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>{formattedDate}</span>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 flex flex-col"
            >
                <TextareaAutosize
                    {...register('content')}
                    className="w-full p-2 border-none bg-transparent focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-black dark:text-white flex-grow rounded-md resize-none"
                    placeholder="오늘의 하루를 기록해보세요..."
                    minRows={5}
                />
                {errors.content && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.content.message}
                    </p>
                )}
            </form>
        </main>

        <AnimatePresence>
            {isPrivacyModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
                    onClick={() => setIsPrivacyModalOpen(false)}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl p-4 z-50"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-center mb-6 text-black dark:text-white">
                            공개 범위 설정
                        </h2>
                        <div className="space-y-3">
                            {(
                                ['PUBLIC', 'FRIENDS', 'PRIVATE'] as PrivacyStatus[]
                            ).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setTempPrivacy(status)}
                                    className={`w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-colors cursor-pointer ${
                                        tempPrivacy === status
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <div
                                        className={
                                            tempPrivacy === status
                                                ? 'text-white dark:text-black'
                                                : 'text-gray-800 dark:text-gray-200'
                                        }
                                    >
                                        {
                                            {
                                                PUBLIC: <Globe size={24} />,
                                                FRIENDS: <Users size={24}/>,
                                                PRIVATE: <Lock size={24}/>,
                                            }[status]
                                        }
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            {
                                                {
                                                    PUBLIC: '전체 공개',
                                                    FRIENDS: '친구 공개',
                                                    PRIVATE: '나만 보기',
                                                }[status]
                                            }
                                        </p>
                                        <p
                                            className={`text-sm ${
                                                tempPrivacy === status
                                                    ? 'text-gray-300 dark:text-gray-500'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            {
                                                {
                                                    PUBLIC: '모든 사용자가 볼 수 있습니다.',
                                                    FRIENDS:
                                                        '나를 팔로우하는 친구들만 볼 수 있습니다.',
                                                    PRIVATE: '나만 볼 수 있습니다.',
                                                }[status]
                                            }
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleConfirmPrivacy}
                            className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
                        >
                            확인
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        <ImagePreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            imageUrl={selectedImageUrl}
        />
    </div>
  );
};

export default DiaryCreateForm; 