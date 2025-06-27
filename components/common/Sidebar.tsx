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
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/components/store/authStore';
import { logout } from '@/api/auth';

const Sidebar = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${day}`;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <aside className="hidden md:flex flex-col border-r fixed h-full bg-white md:w-20 xl:w-64 transition-all duration-300">
      <div className="px-4 py-8">
        <Link
          href="/"
          className="flex items-center md:justify-center xl:justify-start"
        >
          <h1 className="text-2xl font-semibold font-serif md:hidden xl:block">
            PikU
          </h1>
          <Pocket className="w-8 h-8 hidden md:block xl:hidden" />
        </Link>
      </div>
      <nav className="flex flex-col grow px-2">
        <Link
          href="/"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Home className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">홈</span>
        </Link>
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Search className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">검색</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Compass className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">탐색 탭</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Clapperboard className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">릴스</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Send className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">메시지</span>
        </Link> */}
        {/* <Link
          href="#"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Bell className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">알림</span>
        </Link> */}
        <Link
          href={`/diary/new/${todayDate}`}
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <PlusSquare className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">일기 작성</span>
        </Link>
        <Link
          href="/friends"
          className="flex items-center p-4 rounded-lg hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Users className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">친구 목록</span>
        </Link>
      </nav>
      <div className="p-4 mt-auto relative" ref={menuRef}>
        {isMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10">
            <nav className="flex flex-col p-1">
              <Link
                href="/profile"
                className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5 xl:mr-3" />
                <span className="md:hidden xl:inline">프로필</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="w-5 h-5 xl:mr-3" />
                <span className="md:hidden xl:inline">설정</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                <LogOut className="w-5 h-5 xl:mr-3" />
                <span className="md:hidden xl:inline">로그아웃</span>
              </button>
            </nav>
          </div>
        )}
        <button
          onClick={() => setIsMenuOpen(prev => !prev)}
          className="flex items-center w-full p-4 rounded-lg cursor-pointer hover:bg-gray-100 md:justify-center xl:justify-start"
        >
          <Menu className="w-6 h-6 xl:mr-4" />
          <span className="md:hidden xl:inline">더 보기</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 