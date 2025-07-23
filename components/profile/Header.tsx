'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Menu } from 'lucide-react';

interface HeaderProps {
  nickname: string;
  isOwner: boolean;
}

const Header = ({ nickname, isOwner }: HeaderProps) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-100 xl:hidden">
      <button onClick={() => router.back()}>
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="text-lg font-semibold">
        {isOwner ? 'Profile' : nickname}
      </h1>
      <button>
        {/* <Menu className="w-6 h-6" /> */}
      </button>
    </header>
  );
};

export default Header; 