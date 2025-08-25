'use client';

import {
  Home,
  Compass,
  Search,
  User,
  PlusSquare,
  Users,
  Menu,
  Settings,
  LogOut,
  X,
  HelpCircle,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '../store/authStore';
import { logout } from '@/lib/api/auth';
import InquiryModal from './InquiryModal';

const BottomNav = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${day}`;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isPWAiOS, setIsPWAiOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // iOS 기기 감지
    const detectiOS = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      return /ipad|iphone|ipod/.test(userAgent);
    };

    // PWA 환경 감지
    const detectPWA = () => {
      // PWA가 standalone 모드로 실행 중인지 확인
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // iOS Safari에서 홈 스크린에 추가된 PWA인지 확인 (iOS 전용)
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      return isStandalone || isIOSStandalone;
    };

    // PWA를 사용하는 iOS 기기인지 확인
    const detectPWAiOS = () => {
      return detectiOS() && detectPWA();
    };

    // 모바일 환경 감지
    const detectMobile = () => {
      return window.innerWidth <= 768 && 'ontouchstart' in window;
    };

    setIsPWAiOS(detectPWAiOS());
    const checkSmallScreen = () => {
      setIsSmallScreen(window.innerWidth < 500);
    };

    setIsMobile(detectMobile());
    checkSmallScreen();

    // 화면 크기 변경 감지
    const handleResize = () => {
      setIsMobile(detectMobile());
      checkSmallScreen();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getLinkClass = (path: string, exact = true) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    const baseClass = `flex flex-col items-center text-sm ${
      isActive ? '' : 'text-gray-400'
    }`;
    
    // PWA를 사용하는 iOS 모바일에서 크기 증가
    if (isPWAiOS && isMobile) {
      return `${baseClass} w-20 py-2`;
    }
    
    return `${baseClass} w-16`;
  };

  const getMoreLinkClass = () => {
    const isActive =
      pathname.startsWith('/profile') || pathname.startsWith('/settings');
    const baseClass = `flex flex-col items-center text-sm cursor-pointer ${
      isActive ? '' : 'text-gray-400'
    }`;
    
    // PWA를 사용하는 iOS 모바일에서 크기 증가
    if (isPWAiOS && isMobile) {
      return `${baseClass} w-20 py-2`;
    }
    
    return `${baseClass} w-16`;
  };

  // PWA를 사용하는 iOS 모바일에서 BottomNav 스타일 조정
  const getBottomNavClass = () => {
    let baseClass = "flex justify-around items-center border-t xl:hidden sticky bottom-0 bg-white z-10";
    
    if (isPWAiOS && isMobile) {
      // PWA를 사용하는 iOS에서 크기 증가 및 safe area 고려
      return `${baseClass} p-4 pb-6 min-h-[80px]`;
    }
    return `${baseClass} p-2`;
  };

  // PWA를 사용하는 iOS 모바일에서 아이콘 크기 조정
  const getIconSize = () => {
    if (isPWAiOS && isMobile) {
      return "w-7 h-7";
    }
    return "w-6 h-6";
  };

  // PWA를 사용하는 iOS 모바일에서 텍스트 크기 조정
  const getTextSize = () => {
    if (isPWAiOS && isMobile) {
      return "text-sm";
    }
    return "text-xs";
  };

  return (
    <>
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
      <footer className={getBottomNavClass()}>
        <Link href="/" className={getLinkClass('/')}>
          <Home className={getIconSize()} />
          <span className={getTextSize()}>홈</span>
        </Link>
        <Link href="/feed" className={getLinkClass('/feed')}>
          <Compass className={getIconSize()} />
          <span className={getTextSize()}>피드</span>
        </Link>
        <Link href="/search" className={getLinkClass('/search')}>
          <Search className={getIconSize()} />
          <span className={getTextSize()}>검색</span>
        </Link>
        <Link
          href={`/diary/new/${todayDate}`}
          className={getLinkClass('/diary/new', false)}
        >
          <PlusSquare className={getIconSize()} />
          <span className={getTextSize()}>{isSmallScreen ? '일기' : '오늘의 일기'}</span>
        </Link>
        <Link href="/friends" className={getLinkClass('/friends')}>
          <Users className={getIconSize()} />
          <span className={getTextSize()}>친구</span>
        </Link>
        <button onClick={() => setIsModalOpen(true)} className={getMoreLinkClass()}>
          <Menu className={getIconSize()} />
          <span className={getTextSize()}>더보기</span>
        </button>
      </footer>
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 shadow-lg animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <nav className="flex flex-col space-y-2">
              <Link
                href="/profile"
                onClick={() => setIsModalOpen(false)}
                className="flex items-center p-3 text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="w-6 h-6 mr-4" />
                <span>프로필</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsModalOpen(false)}
                className="flex items-center p-3 text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="w-6 h-6 mr-4" />
                <span>설정</span>
              </Link>
              <button
                onClick={() => {
                  setIsInquiryModalOpen(true);
                  setIsModalOpen(false);
                }}
                className="flex items-center p-3 text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left w-full"
              >
                <HelpCircle className="w-6 h-6 mr-4" />
                <span>피드백</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center p-3 text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left w-full"
              >
                <LogOut className="w-6 h-6 mr-4" />
                <span>로그아웃</span>
              </button>
            </nav>
          </div>
        </div>
      )}
      {isInquiryModalOpen && <InquiryModal onClose={() => setIsInquiryModalOpen(false)} />}
    </>
  );
};

export default BottomNav; 