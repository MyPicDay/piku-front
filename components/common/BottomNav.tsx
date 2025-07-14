'use client';

import {
  Home,
  Compass,
  User,
  PlusSquare,
  Users,
  Menu,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '../store/authStore';
import { logout } from '@/api/auth';

const BottomNav = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayDate = `${year}-${month}-${day}`;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  const getLinkClass = (path: string, exact = true) => {
    const isActive = exact ? pathname === path : pathname.startsWith(path);
    return `flex flex-col items-center text-sm w-16 ${
      isActive ? '' : 'text-gray-400'
    }`;
  };

  return (
    <>
      <footer className="flex justify-around items-center p-2 border-t xl:hidden sticky bottom-0 bg-white z-10">
        <Link href="/" className={getLinkClass('/')}>
          <Home className="w-6 h-6" />
          <span className="text-xs">홈</span>
        </Link>
        <Link href="/feed" className={getLinkClass('/feed')}>
          <Compass className="w-6 h-6" />
          <span className="text-xs">피드</span>
        </Link>
        <Link
          href={`/diary/new/${todayDate}`}
          className={getLinkClass('/diary/new', false)}
        >
          <PlusSquare className="w-6 h-6" />
          <span className="text-xs">오늘의 일기</span>
        </Link>
        <Link href="/friends" className={getLinkClass('/friends')}>
          <Users className="w-6 h-6" />
          <span className="text-xs">친구</span>
        </Link>
        {/* <Link
          href="#"
          className="flex flex-col items-center text-sm text-gray-400 w-16 relative"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-4 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          <span className="text-xs">알림</span>
        </Link> */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center text-sm text-gray-400 w-16"
        >
          <Menu className="w-6 h-6" />
          <span className="text-xs">더보기</span>
        </button>
      </footer>
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
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
    </>
  );
};

export default BottomNav; 