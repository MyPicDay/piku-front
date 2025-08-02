'use client';

import {
  Home,
  Search,
  Compass,
  Clapperboard,
  Send,
  Bell,
  PlusSquare,
  User,
  Menu,
  Pocket,
  Users,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/components/store/authStore';
import { logout } from '@/api/auth';
import InquiryModal from './InquiryModal';

const Sidebar = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${day}`;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const storeLogout = useAuthStore(state => state.logout);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <aside className="hidden xl:flex flex-col border-r border-gray-300 dark:border-gray-700 fixed h-full bg-white w-64 transition-all duration-300">
        <div className="px-4 py-8">
          <Link
            href="/"
            className="flex items-center justify-start"
          >
            <h1 className="text-2xl font-semibold font-serif">
              PikU
            </h1>
          </Link>
        </div>
        <nav className="flex flex-col grow px-2">
          <Link
            href="/"
            className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
          >
            <Home className="w-6 h-6 mr-4" />
            <span className="inline">홈</span>
          </Link>
          <Link
            href="/search"
            className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
          >
            <Search className="w-6 h-6 mr-4" />
            <span className="inline">검색</span>
          </Link>
          <Link
            href="/feed"
            className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
          >
            <Compass className="w-6 h-6 mr-4" />
            <span className="inline">피드</span>
          </Link>
          {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
        >
          <Search className="w-6 h-6 mr-4" />
          <span className="inline">검색</span>
        </Link> */}
          {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
        >
          <Compass className="w-6 h-6 mr-4" />
          <span className="inline">탐색 탭</span>
        </Link> */}
          {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
        >
          <Clapperboard className="w-6 h-6 mr-4" />
          <span className="inline">릴스</span>
        </Link> */}
          {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
        >
          <Send className="w-6 h-6 mr-4" />
          <span className="inline">메시지</span>
        </Link> */}
          {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
        >
          <Bell className="w-6 h-6 mr-4" />
          <span className="inline">알림</span>
        </Link> */}
          <Link
            href={`/diary/new/${todayDate}`}
            className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
          >
            <PlusSquare className="w-6 h-6 mr-4" />
            <span className="inline">오늘의 일기</span>
          </Link>
          <Link
            href="/friends"
            className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
          >
            <Users className="w-6 h-6 mr-4" />
            <span className="inline">친구 목록</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center p-4 rounded-lg hover:bg-gray-100 justify-start"
          >
            <User className="w-6 h-6 mr-4" />
            <span className="inline">프로필</span>
          </Link>
        </nav>
        <div className="p-4 mt-auto relative" ref={menuRef}>
          {isMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
              <nav className="flex flex-col p-1">
                {/* <Link
                href="/profile"
                className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5 mr-3" />
                <span className="inline">프로필</span>
              </Link> */}
                <Link
                  href="/settings"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  <span className="inline">설정</span>
                </Link>
                <button
                  onClick={() => {
                    setIsInquiryModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <HelpCircle className="w-5 h-5 mr-3" />
                  <span className="inline">피드백</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="inline">로그아웃</span>
                </button>
              </nav>
            </div>
          )}
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center w-full p-4 rounded-lg cursor-pointer hover:bg-gray-100 justify-start"
          >
            <Menu className="w-6 h-6 mr-4" />
            <span className="inline">더 보기</span>
          </button>
        </div>
      </aside>
      {isInquiryModalOpen && <InquiryModal onClose={() => setIsInquiryModalOpen(false)} />}
    </>
  );
};

export default Sidebar; 