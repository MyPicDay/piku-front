'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { logout } from '@/lib/api/auth';
import useAuthStore from '@/components/store/authStore';

interface GuestLoginModalProps {
  onClose: () => void;
}

const GuestLoginModal = ({ onClose }: GuestLoginModalProps) => {
  const { logout: logoutStore } = useAuthStore();
  
  const handleBack = () => {
    onClose();
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleLoginClick = async () => {
    try {
      // 비회원 로그아웃 실행
      await logout();
      // 스토어도 로그아웃 상태로 변경
      logoutStore();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
    onClose();
  };

  const handleSignupClick = async () => {
    try {
      // 비회원 로그아웃 실행
      await logout();
      // 스토어도 로그아웃 상태로 변경
      logoutStore();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800 max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleBack}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          title="뒤로가기"
        >
          <X size={24} />
        </button>
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 flex items-center justify-center">
              <Image
                src="/android-chrome-192x192.png"
                alt="PikU"
                width={48}
                height={48}
                className="rounded-full"
              />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            로그인이 필요한 기능입니다
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            이 기능을 사용하려면 로그인하거나 회원가입이 필요합니다.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleLoginClick}
              className="w-full bg-black text-white py-3 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              로그인
            </button>
            <button 
              onClick={handleSignupClick}
              className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-full text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestLoginModal;
