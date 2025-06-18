'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Globe, Lock, Users, Camera, Sparkles, XCircle } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { createDiary, generateAiPhotos } from '@/api/diary';
import useAuthStore from '../store/authStore';

const diarySchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요.'),
});

type DiaryFormValues = z.infer<typeof diarySchema>;
type PrivacyStatus = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';

type UnifiedPhoto = {
  id: string;
  url: string;
  type: 'ai' | 'user';
  file?: File;
};

interface DiaryCreateFormProps {
  date: string;
}

const MAX_AI_PHOTOS = 3;
const MAX_TOTAL_PHOTOS = 5;

const DiaryCreateForm = ({ date }: DiaryCreateFormProps) => {
  const router = useRouter();
  const [allPhotos, setAllPhotos] = useState<UnifiedPhoto[]>([]);
  const [privacy, setPrivacy] = useState<PrivacyStatus>('PUBLIC');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
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
  });

  useEffect(() => {
    // 컴포넌트가 언마운트될 때 생성된 Object URL들을 정리하여 메모리 누수를 방지합니다.
    return () => {
      allPhotos.forEach(photo => {
        if (photo.type === 'user' && photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateDiary = async (data: DiaryFormValues) => {
    setIsSubmitting(true);

    const userPhotos = allPhotos.filter(p => p.type === 'user');
    const userPhotosForUpload = userPhotos
      .filter(p => p.file)
      .map(p => p.file as File);

    const aiPhotos = allPhotos.filter(p => p.type === 'ai');
    const aiPhotoIdsForUpload = aiPhotos.map(p => p.id);
    
    let coverPhotoType: 'AI_IMAGE' | 'USER_IMAGE' | undefined;
    let coverPhotoIndex: number | undefined;

    if (allPhotos.length > 0) {
      const coverPhoto = allPhotos[0];
      if (coverPhoto.type === 'ai') {
        coverPhotoType = 'AI_IMAGE';
        coverPhotoIndex = aiPhotos.findIndex(p => p.id === coverPhoto.id);
      } else { // 'user'
        coverPhotoType = 'USER_IMAGE';
        coverPhotoIndex = userPhotos.findIndex(p => p.id === coverPhoto.id);
      }
    }

    try {
      await createDiary({
        status: privacy,
        content: data.content,
        aiPhotos: aiPhotoIdsForUpload,
        photos: userPhotosForUpload,
        date,
        coverPhotoType,
        coverPhotoIndex,
      });
      router.push('/'); // Redirect to calendar on success
    } catch (error) {
      console.error('Failed to create diary:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAiPhotos = async () => {
    const totalPhotosCount = allPhotos.length;
    if (totalPhotosCount >= MAX_TOTAL_PHOTOS) {
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
    const totalPhotosCount = allPhotos.length;
    if (totalPhotosCount >= MAX_TOTAL_PHOTOS) {
      alert(`사진은 최대 ${MAX_TOTAL_PHOTOS}장까지 추가할 수 있습니다.`);
      // 파일 선택 창이 다시 열리는 것을 막기 위해 input value를 초기화합니다.
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const availableSlots = MAX_TOTAL_PHOTOS - totalPhotosCount;

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
     // 파일 선택 후, 동일한 파일을 다시 선택할 수 있도록 input value를 초기화합니다.
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
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

  const PrivacyIcon = { PUBLIC: <Globe size={16} />, FOLLOWERS_ONLY: <Users size={16} />, PRIVATE: <Lock size={16} /> }[privacy];
  const privacyText = { PUBLIC: '전체 공개', FOLLOWERS_ONLY: '팔로워 공개', PRIVATE: '나만 보기' }[privacy];

  const userPhotosCount = allPhotos.filter(p => p.type === 'user').length;
  const aiPhotosCount = allPhotos.filter(p => p.type === 'ai').length;
  const totalPhotosCount = allPhotos.length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <button onClick={() => router.back()} className="cursor-pointer"><X size={24} /></button>
        <h1 className="text-lg font-semibold">일기</h1>
        <button onClick={handleSubmit(handleCreateDiary)} 
        // disabled={isSubmitting} 
        className="font-semibold text-blue-500 disabled:text-gray-400 cursor-pointer">완료</button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {/* AI Photo Slot */}
          <button
            onClick={handleGenerateAiPhotos}
            disabled={isGeneratingAiPhotos || aiPhotosCount >= MAX_AI_PHOTOS || totalPhotosCount >= MAX_TOTAL_PHOTOS}
            className="flex-shrink-0 w-24 h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200"
          >
            {isGeneratingAiPhotos ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            ) : (
              <>
                <Sparkles size={24} />
                <span className="text-sm mt-1">AI 사진</span>
                <span className="text-xs">({aiPhotosCount}/{MAX_AI_PHOTOS})</span>
              </>
            )}
          </button>
          
          {/* User Photo Slot */}
          <button onClick={() => fileInputRef.current?.click()} disabled={totalPhotosCount >= MAX_TOTAL_PHOTOS} className="flex-shrink-0 w-24 h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200">
            <Camera size={24} />
            <span className="text-sm mt-1">사진 추가</span>
            <span className="text-xs">({userPhotosCount}장)</span>
          </button>
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />

          {/* Selected Photos */}
          <Reorder.Group as="div" axis="x" values={allPhotos} onReorder={setAllPhotos} className="flex space-x-2">
            {allPhotos.map((photo, index) => {
              const isCover = index === 0;
              return (
                  <Reorder.Item key={photo.id} value={photo} as="div" className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden cursor-grab active:cursor-grabbing">
                      <img src={photo.url} alt="selected photo" className="w-full h-full object-cover pointer-events-none" />
                      <button onClick={() => removePhoto(photo)} className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full text-white z-10 cursor-pointer">
                          <XCircle size={16} />
                      </button>
                      {isCover && <div className="absolute bottom-0 w-full bg-blue-500 text-white text-xs text-center py-0.5 pointer-events-none">대표 사진</div>}
                  </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        <div className="flex items-center my-4">
            <img src={user?.avatar || "/vercel.svg"} alt="user avatar" width={32} height={32} className="rounded-full mr-2 w-8 h-8" />
            <span className="font-semibold">{user?.nickname || 'me'}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>{formattedDate}</span>
            <button onClick={() => setIsPrivacyModalOpen(true)} className="flex items-center space-x-1 ml-2 p-1 rounded-md hover:bg-gray-200 cursor-pointer">
                {PrivacyIcon}
                <span>{privacyText}</span>
            </button>
        </div>

        <textarea
          {...register('content')}
          placeholder={`${user?.nickname || 'me'}님의 오늘은 어떤 하루였나요?`}
          className="w-full h-48 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
      </main>

      <AnimatePresence>
        {isPrivacyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50"
            onClick={() => setIsPrivacyModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-center font-semibold p-4 border-b">공개 설정</h3>
              <ul className="py-2">
                <li onClick={() => { setPrivacy('PUBLIC'); setIsPrivacyModalOpen(false); }} className="flex justify-between items-center p-4 hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Globe size={20} />
                    <div>
                      <p className="font-semibold">전체 공개</p>
                      <p className="text-xs text-gray-500">모든 사용자에게 공개</p>
                    </div>
                  </div>
                  {privacy === 'PUBLIC' && <div className="w-5 h-5 border-4 border-blue-500 rounded-full"/>}
                </li>
                <li onClick={() => { setPrivacy('FOLLOWERS_ONLY'); setIsPrivacyModalOpen(false); }} className="flex justify-between items-center p-4 hover:bg-gray-100 cursor-pointer">
                   <div className="flex items-center space-x-3">
                    <Users size={20} />
                    <div>
                      <p className="font-semibold">팔로워 공개</p>
                      <p className="text-xs text-gray-500">나를 팔로우하는 사람들에게만 공개</p>
                    </div>
                  </div>
                  {privacy === 'FOLLOWERS_ONLY' && <div className="w-5 h-5 border-4 border-blue-500 rounded-full"/>}
                </li>
                <li onClick={() => { setPrivacy('PRIVATE'); setIsPrivacyModalOpen(false); }} className="flex justify-between items-center p-4 hover:bg-gray-100 cursor-pointer">
                   <div className="flex items-center space-x-3">
                    <Lock size={20} />
                    <div>
                      <p className="font-semibold">나만 보기</p>
                      <p className="text-xs text-gray-500">나만 볼 수 있도록 비공개</p>
                    </div>
                  </div>
                  {privacy === 'PRIVATE' && <div className="w-5 h-5 border-4 border-blue-500 rounded-full"/>}
                </li>
              </ul>
               <div className="p-4"><button onClick={() => setIsPrivacyModalOpen(false)} className="w-full p-3 bg-gray-800 text-white rounded-lg font-semibold">확인</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiaryCreateForm; 