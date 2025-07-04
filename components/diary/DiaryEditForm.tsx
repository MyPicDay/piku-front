'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateDiary, generateAiPhotos } from '@/api/diary';
import useAuthStore from '../store/authStore';
import {
  diarySchema,
  DiaryFormValues,
  UnifiedPhoto,
  PrivacyStatus,
  DiaryDetail,
} from '@/types/diary';
import { X, Globe, Lock, Users, Camera, Sparkles, XCircle } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const MAX_AI_PHOTOS = 3;
const MAX_TOTAL_PHOTOS = 5;

interface DiaryEditFormProps {
  initialDiaryData: DiaryDetail;
}

const DiaryEditForm = ({ initialDiaryData }: DiaryEditFormProps) => {
  const router = useRouter();
  const [allPhotos, setAllPhotos] = useState<UnifiedPhoto[]>([]);
  const [deletedPhotoUrls, setDeletedPhotoUrls] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState<PrivacyStatus>('PUBLIC');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [tempPrivacy, setTempPrivacy] = useState<PrivacyStatus>(privacy);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAiPhotos, setIsGeneratingAiPhotos] = useState(false);
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diarySchema),
    mode: 'onChange',
    defaultValues: {
      content: initialDiaryData.content,
    },
  });

  useEffect(() => {
    if (isPrivacyModalOpen) {
      setTempPrivacy(privacy);
    }
  }, [isPrivacyModalOpen, privacy]);

  useEffect(() => {
    setPrivacy(initialDiaryData.status);
    const fetchedPhotos: UnifiedPhoto[] = initialDiaryData.imgUrls.map(
      (img, index) => ({
        id: `existing-${index}-${img}`,
        url: img,
        type: 'user', 
      }),
    );
    setAllPhotos(fetchedPhotos);
  }, [initialDiaryData]);

  useEffect(() => {
    return () => {
      allPhotos.forEach(photo => {
        if (photo.type === 'user' && photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [allPhotos]);

  const onSubmit = async (data: DiaryFormValues) => {
    setIsSubmitting(true);

    const userPhotos = allPhotos.filter(p => p.type === 'user' && p.file);
    const userPhotosForUpload = userPhotos.map(p => p.file as File);
    const aiPhotos = allPhotos.filter(p => p.type === 'ai');
    const aiPhotoIdsForUpload = aiPhotos.map(p => p.id);

    let coverPhotoType: 'AI_IMAGE' | 'USER_IMAGE' | undefined;
    let coverPhotoIndex: number | undefined;

    if (allPhotos.length > 0) {
      const coverPhoto = allPhotos[0];
      if (coverPhoto.type === 'ai') {
        coverPhotoType = 'AI_IMAGE';
        coverPhotoIndex = aiPhotos.findIndex(p => p.id === coverPhoto.id);
      } else {
        coverPhotoType = 'USER_IMAGE';
        coverPhotoIndex = userPhotos.findIndex(p => p.id === coverPhoto.id);
      }
    }

    try {
      await updateDiary(initialDiaryData.diaryId, {
        status: privacy,
        content: data.content,
        aiPhotos: aiPhotoIdsForUpload,
        photos: userPhotosForUpload,
        date: initialDiaryData.date,
        coverPhotoType,
        coverPhotoIndex,
        deletedUrls: deletedPhotoUrls,
      });
      router.push('/');
    } catch (error) {
      console.error('Failed to update diary:', error);
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const availableSlots = MAX_TOTAL_PHOTOS - allPhotos.length;
    if (e.target.files && availableSlots > 0) {
      const newFiles = Array.from(e.target.files).slice(0, availableSlots);
      const newUserPhotos: UnifiedPhoto[] = newFiles.map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        url: URL.createObjectURL(file),
        type: 'user',
        file,
      }));
      setAllPhotos(prev => [...prev, ...newUserPhotos]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (photoToRemove: UnifiedPhoto) => {
    if (!photoToRemove.file) {
      setDeletedPhotoUrls(prev => [...prev, photoToRemove.url]);
    }

    if (photoToRemove.type === 'user' && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    setAllPhotos(allPhotos.filter(p => p.id !== photoToRemove.id));
  };
  
  const handleConfirmPrivacy = () => {
    setPrivacy(tempPrivacy);
    setIsPrivacyModalOpen(false);
  };
  
    const formattedDate = new Date(initialDiaryData.date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });

    const PrivacyIcon =
        {
            PUBLIC: <Globe size={16} />,
            FOLLOWERS_ONLY: <Users size={16} />,
            PRIVATE: <Lock size={16} />,
        }[privacy] || null;

    const privacyText =
        {
            PUBLIC: '전체 공개',
            FOLLOWERS_ONLY: '친구 공개',
            PRIVATE: '나만 보기',
        }[privacy] || '';

    const userPhotosCount = allPhotos.filter(p => p.type === 'user').length;
    const aiPhotosCount = allPhotos.filter(p => p.type === 'ai').length;
    const totalPhotosCount = allPhotos.length;

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
                {'일기 수정'}
            </h1>
            <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="font-semibold text-blue-500 disabled:text-gray-400 dark:disabled:text-gray-600 cursor-pointer"
            >
                {'수정'}
            </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto text-black dark:text-white">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <button
                    onClick={handleGenerateAiPhotos}
                    disabled={
                        isGeneratingAiPhotos ||
                        aiPhotosCount >= MAX_AI_PHOTOS ||
                        totalPhotosCount >= MAX_TOTAL_PHOTOS
                    }
                    className="flex-shrink-0 w-24 h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-800 dark:disabled:bg-gray-700 dark:border-gray-600"
                >
                    {isGeneratingAiPhotos ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    ) : (
                        <>
                            <Sparkles size={24} />
                            <span className="text-sm mt-1">AI 사진</span>
                            <span className="text-xs">
                                ({aiPhotosCount}/{MAX_AI_PHOTOS})
                            </span>
                        </>
                    )}
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={totalPhotosCount >= MAX_TOTAL_PHOTOS}
                    className="flex-shrink-0 w-24 h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 dark:text-gray-500 dark:hover:bg-gray-800 dark:disabled:bg-gray-700 dark:border-gray-600"
                >
                    <Camera size={24} />
                    <span className="text-sm mt-1">사진 추가</span>
                    <span className="text-xs">({userPhotosCount}장)</span>
                </button>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                />

                <Reorder.Group
                    as="div"
                    axis="x"
                    values={allPhotos}
                    onReorder={setAllPhotos}
                    className="flex space-x-2"
                >
                    {allPhotos.map((photo, index) => {
                        const isCover = index === 0;
                        return (
                            <Reorder.Item
                                key={photo.id}
                                value={photo}
                                as="div"
                                className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden cursor-grab active:cursor-grabbing"
                            >
                                <img
                                    src={photo.url}
                                    alt="selected photo"
                                    className="w-full h-full object-cover pointer-events-none"
                                />
                                <button
                                    onClick={() => removePhoto(photo)}
                                    className="absolute top-1 right-1 bg-black/50 rounded-full text-white z-10 cursor-pointer"
                                >
                                    <XCircle size={16} />
                                </button>
                                {isCover && (
                                    <div className="absolute bottom-0 w-full bg-blue-500 text-white text-xs text-center py-0.5 pointer-events-none">
                                        대표 사진
                                    </div>
                                )}
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
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
                    className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400"
                >
                    {PrivacyIcon}
                    <span>{privacyText}</span>
                </button>
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>{formattedDate}</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <textarea
                    {...register('content')}
                    rows={10}
                    className="w-full p-2 border-none bg-transparent focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500 text-black dark:text-white"
                    placeholder="오늘의 하루를 기록해보세요..."
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
                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-center mb-6 text-black dark:text-white">
                            공개 범위 설정
                        </h2>
                        <div className="space-y-3">
                            {(
                                ['PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE'] as PrivacyStatus[]
                            ).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setTempPrivacy(status)}
                                    className={`w-full text-left p-4 rounded-lg flex items-center space-x-4 transition-colors ${
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
                                                FOLLOWERS_ONLY: <Users size={24}/>,
                                                PRIVATE: <Lock size={24}/>,
                                            }[status]
                                        }
                                    </div>
                                    <div>
                                        <p className="font-semibold">
                                            {
                                                {
                                                    PUBLIC: '전체 공개',
                                                    FOLLOWERS_ONLY: '친구 공개',
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
                                                    FOLLOWERS_ONLY:
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
                            className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            확인
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default DiaryEditForm; 