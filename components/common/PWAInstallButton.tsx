'use client';

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // PWA가 이미 설치되어 있는지 확인
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone ||
             document.referrer.includes('android-app://');
    };

    setIsStandalone(checkStandalone());

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 앱이 설치된 후 상태 업데이트
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsStandalone(true);
      // localStorage 정리
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // 프롬프트가 없는 경우 localStorage 클리어하고 페이지 새로고침
      localStorage.removeItem('pwa-install-dismissed');
      window.location.reload();
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('사용자가 PWA 설치를 수락했습니다');
        setCanInstall(false);
      } else {
        console.log('사용자가 PWA 설치를 거부했습니다');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA 설치 중 오류 발생:', error);
    }
  };

  const resetInstallPrompt = () => {
    localStorage.removeItem('pwa-install-dismissed');
    window.location.reload();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
          <Image src="/apple-touch-icon.png" alt="PikU App Icon" width={24} height={24} className="rounded-md" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">앱 설치</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            PikU를 앱으로 설치하여 더 편리하게 이용하세요
          </p>
        </div>
      </div>

      {isStandalone ? (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">이미 앱으로 설치되어 있습니다</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">앱 설치 혜택:</p>
            <ul className="space-y-1 text-xs">
              <li>• 홈 화면에서 바로 접근</li>
              <li>• 오프라인에서도 일부 기능 이용</li>
              <li>• 더 빠른 로딩 속도</li>
              <li>• 브라우저 UI 없는 네이티브 앱 경험</li>
            </ul>
          </div>
          
          <div className="flex space-x-2">
            {canInstall || deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Image src="/apple-touch-icon.png" alt="" width={16} height={16} className="mr-2 rounded-sm" />
                앱 설치하기
              </button>
            ) : (
              <button
                onClick={resetInstallPrompt}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                설치 프롬프트 다시 보기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 