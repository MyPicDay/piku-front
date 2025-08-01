'use client';

import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/common/Sidebar';
import BottomNav from '@/components/common/BottomNav';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import useAuthStore from '../store/authStore';
import { useEffect, useState } from 'react';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, checkAuth } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const hideNavOnPaths = ['/login', '/signup', '/password-reset', '/password-reset/verify'];

  useEffect(() => {
    checkAuth();
    setIsClient(true);
  }, [checkAuth]);

  useEffect(() => {
    if (isClient && isLoggedIn && hideNavOnPaths.includes(pathname)) {
      router.replace('/');
    }
  }, [isClient, isLoggedIn, pathname, router]);

  if (!isClient) {
    return null;
  }

  const shouldHideNav =
    hideNavOnPaths.includes(pathname) || (pathname === '/' && !isLoggedIn);

  if (isLoggedIn && hideNavOnPaths.includes(pathname)) {
    return null; // 리다이렉트 중에는 아무것도 렌더링하지 않음
  }

  if (shouldHideNav) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <Sidebar />
        <main className="w-full xl:ml-64 transition-all duration-300 md:grid md:grid-cols-8 md:gap-4">
          <div className="md:col-span-4 md:col-start-3 h-full">{children}</div>
        </main>
      </div>
      <BottomNav />
      <PWAInstallPrompt />
    </div>
  );
};

export default LayoutWrapper; 