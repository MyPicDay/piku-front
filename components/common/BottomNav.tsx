'use client';

import { Home, Compass, Bell, User, PlusSquare } from 'lucide-react';
import Link from 'next/link';

const BottomNav = () => {
  return (
    <footer className="flex justify-around items-center p-2 border-t md:hidden sticky bottom-0 bg-white z-10">
      <Link href="/" className="flex flex-col items-center text-sm w-16">
        <Home className="w-6 h-6" />
        <span className="text-xs">홈</span>
      </Link>
      {/* <Link href="/" className="flex flex-col items-center text-sm w-16">
        <Home className="w-6 h-6" />
        <span className="text-xs">피드</span>
      </Link> */}
      {/* <Link
        href="#"
        className="flex flex-col items-center text-sm text-gray-400 w-16"
      >
        <Compass className="w-6 h-6" />
        <span className="text-xs">둘러보기</span>
      </Link> */}
      <Link
        href="#"
        className="flex flex-col items-center text-sm text-gray-400 w-16"
      >
        <PlusSquare className="w-6 h-6" />
        <span className="text-xs">일기 작성</span>
      </Link>
      {/* <Link
        href="#"
        className="flex flex-col items-center text-sm text-gray-400 w-16 relative"
      >
        <Bell className="w-6 h-6" />
        <span className="absolute top-0 right-4 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        <span className="text-xs">알림</span>
      </Link> */}
      <Link
        href="#"
        className="flex flex-col items-center text-sm text-gray-400 w-16"
      >
        <User className="w-6 h-6" />
        <span className="text-xs">My</span>
      </Link>
    </footer>
  );
};

export default BottomNav; 