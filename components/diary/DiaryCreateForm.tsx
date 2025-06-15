'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Globe, Lock, Users, Camera, Sparkles, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createDiary } from '@/api/diary';

const diarySchema = z.object({
  content: z.string().min(1, '내용을 입력해주세요.'),
});

type DiaryFormValues = z.infer<typeof diarySchema>;
type PrivacyStatus = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';

interface DiaryCreateFormProps {
  date: string;
}

// Mock data for user and AI photos for UI development
const MOCK_USER = { name: 'me', avatar: '/user-avatar.png' };

const DiaryCreateForm = ({ date }: DiaryCreateFormProps) => {
  const router = useRouter();
  const [userPhotos, setUserPhotos] = useState<File[]>([]);
  const [aiPhotos, setAiPhotos] = useState<{ id: string; url: string }[]>([]);
  const [allPhotos, setAllPhotos] = useState<(File | { id: string; url: string })[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyStatus>('PRIVATE');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diarySchema),
  });

  const handleCreateDiary = async (data: DiaryFormValues) => {
    setIsSubmitting(true);
    try {
      await createDiary({
        status: privacy,
        content: data.content,
        aiPhotos: aiPhotos.map(p => p.id),
        photos: userPhotos,
        date,
      });
      router.push('/calendar'); // Redirect to calendar on success
    } catch (error) {
      console.error('Failed to create diary:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // TODO: Add validation for photo counts
      const newUserPhotos = [...userPhotos, ...newFiles];
      setUserPhotos(newUserPhotos);
      setAllPhotos([...allPhotos, ...newFiles]);
    }
  };

  const removePhoto = (photoToRemove: File | { id: string; url: string }) => {
    setAllPhotos(allPhotos.filter(p => p !== photoToRemove));
    if ('id' in photoToRemove) {
      setAiPhotos(aiPhotos.filter(p => p.id !== photoToRemove.id));
    } else {
      setUserPhotos(userPhotos.filter(p => p !== photoToRemove));
    }
  };

  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const PrivacyIcon = { PUBLIC: <Globe size={16} />, FOLLOWERS_ONLY: <Users size={16} />, PRIVATE: <Lock size={16} /> }[privacy];
  const privacyText = { PUBLIC: '전체 공개', FOLLOWERS_ONLY: '팔로워 공개', PRIVATE: '나만 보기' }[privacy];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <button onClick={() => router.back()} className="cursor-pointer"><X size={24} /></button>
        <h1 className="text-lg font-semibold">일기</h1>
        <button onClick={handleSubmit(handleCreateDiary)} disabled={isSubmitting} className="font-semibold text-blue-500 disabled:text-gray-400 cursor-pointer">완료</button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {/* AI Photo Slot */}
          <button className="flex-shrink-0 w-24 h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer">
            <Sparkles size={24} />
            <span className="text-sm mt-1">AI 사진</span>
            <span className="text-xs">({aiPhotos.length}/3)</span>
          </button>
          
          {/* User Photo Slot */}
          <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-24 h-24 border-2 border-dashed rounded-md flex flex-col justify-center items-center text-gray-400 hover:bg-gray-100 cursor-pointer">
            <Camera size={24} />
            <span className="text-sm mt-1">사진 추가</span>
            <span className="text-xs">({userPhotos.length}/2)</span>
          </button>
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />

          {/* Selected Photos */}
          {allPhotos.map((photo, index) => {
            const photoUrl = photo instanceof File ? URL.createObjectURL(photo) : photo.url;
            const isCover = coverPhoto === photoUrl;
            return (
                <div key={index} className="relative flex-shrink-0 w-24 h-24 rounded-md overflow-hidden">
                    <Image src={photoUrl} alt="selected photo" layout="fill" objectFit="cover" />
                    <button onClick={() => removePhoto(photo)} className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full text-white">
                        <XCircle size={16} />
                    </button>
                    {!isCover && (
                      <button onClick={() => setCoverPhoto(photoUrl)} className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs bg-black bg-opacity-50 text-white px-2 py-0.5 rounded-full">
                        대표
                      </button>
                    )}
                    {isCover && <div className="absolute bottom-0 w-full bg-blue-500 text-white text-xs text-center py-0.5">대표 사진</div>}
                </div>
            );
          })}
        </div>

        <div className="flex items-center my-4">
            <Image src={MOCK_USER.avatar} alt="user avatar" width={32} height={32} className="rounded-full mr-2" />
            <span className="font-semibold">{MOCK_USER.name}</span>
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
          placeholder={`${MOCK_USER.name}님의 오늘은 어떤 하루였나요?`}
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