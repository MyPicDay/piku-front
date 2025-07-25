'use client';

import { useState, useRef } from 'react';
import { X, Image, Send } from 'lucide-react';
import { submitInquiry } from '@/api/inquiry';

interface InquiryModalProps {
  onClose: () => void;
}

const InquiryModal = ({ onClose }: InquiryModalProps) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }

    try {
      await submitInquiry(formData);
      alert('문의가 성공적으로 제출되었습니다.');
      onClose();
    } catch (error) {
      console.error('Inquiry submission failed:', error);
      alert('문의 제출에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">피드백</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="inquiry-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              문의 내용
            </label>
            <textarea
              id="inquiry-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="문의하실 내용을 입력해주세요."
              className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              사진 첨부 (선택)
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Image size={18} className="mr-2" />
                사진 선택
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-md object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="flex items-center justify-center px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send size={18} className="mr-2"/>
              {isSubmitting ? '제출 중...' : '제출하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryModal; 