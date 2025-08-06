'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus, Download } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type BrowserType = 'chrome' | 'safari' | 'firefox' | 'samsung' | 'ios' | 'unknown';

export default function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [browserType, setBrowserType] = useState<BrowserType>('unknown');
  const [canShowManualPrompt, setCanShowManualPrompt] = useState(false);

  // PWA 설치 버튼이 이미 있는 페이지에서는 팝업을 표시하지 않음
  const shouldHidePrompt = pathname === '/settings';

  // 브라우저 타입 감지
  const detectBrowser = (): BrowserType => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    
    if (isIOS) {
      if (userAgent.includes('crios')) return 'ios'; // iOS Chrome
      if (userAgent.includes('safari')) return 'safari';
    }
    
    if (userAgent.includes('samsung')) return 'samsung';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    
    return 'unknown';
  };

  // PWA 설치 가능 여부 확인
  const checkInstallability = () => {
    const browser = detectBrowser();
    setBrowserType(browser);
    
    // PWA가 이미 설치되어 있는지 확인
    const isAlreadyInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
    
    setIsStandalone(isAlreadyInstalled);
    
    if (isAlreadyInstalled) return false;
    
    // 사용자가 이전에 설치를 거부했는지 확인
    const wasPromptDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasPromptDismissed) return false;
    
    // 브라우저별로 설치 가능 여부 확인
    switch (browser) {
      case 'chrome':
      case 'samsung':
        // beforeinstallprompt 이벤트를 기다림
        return false; // 이벤트가 발생하면 별도로 처리
      case 'safari':
      case 'ios':
      case 'firefox':
        // 수동 설치 안내 표시
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    const canShow = checkInstallability();
    setCanShowManualPrompt(canShow);
    
    // beforeinstallprompt 이벤트 리스너 (Chrome, Samsung 등)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 사용자가 이전에 설치를 거부했는지 확인
      const wasPromptDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!wasPromptDismissed && !isStandalone) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 앱이 설치된 후 프롬프트 숨기기
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setCanShowManualPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // PWA 설치 프롬프트 재설정 이벤트 리스너
    const handlePwaInstallReset = () => {
      const canShow = checkInstallability();
      setCanShowManualPrompt(canShow);
    };

    window.addEventListener('pwa-install-reset', handlePwaInstallReset);

    // 수동 설치 안내를 위한 타이머 (Safari, Firefox 등)
    if (canShow) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // 3초 후 표시

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('pwa-install-reset', handlePwaInstallReset);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-install-reset', handlePwaInstallReset);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chrome/Samsung 브라우저용 자동 설치
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
        } else {
          localStorage.setItem('pwa-install-dismissed', 'true');
          // 커스텀 이벤트 발생으로 다른 컴포넌트에 알림
          window.dispatchEvent(new CustomEvent('pwa-install-dismissed'));
        }
        
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      } catch (error) {
        console.error('PWA 설치 중 오류 발생:', error);
      }
    } else {
      // 수동 설치 안내는 닫기만 함 (상세 안내는 이미 표시됨)
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    // 커스텀 이벤트 발생으로 다른 컴포넌트에 알림
    window.dispatchEvent(new CustomEvent('pwa-install-dismissed'));
  };

  // 브라우저별 설치 안내 메시지
  const getInstallInstructions = () => {
    switch (browserType) {
      case 'safari':
        return {
          title: 'Safari에서 앱 설치하기',
          steps: [
            { icon: <Share className="w-4 h-4" />, text: '하단의 공유 버튼을 탭하세요' },
            { icon: <Plus className="w-4 h-4" />, text: '"홈 화면에 추가"를 선택하세요' },
            { icon: <Download className="w-4 h-4" />, text: '"추가"를 탭하여 설치 완료' }
          ]
        };
      case 'ios':
        return {
          title: 'iOS에서 앱 설치하기',
          steps: [
            { icon: <Share className="w-4 h-4" />, text: 'Safari에서 이 페이지를 열어주세요' },
            { icon: <Share className="w-4 h-4" />, text: '공유 버튼을 탭하세요' },
            { icon: <Plus className="w-4 h-4" />, text: '"홈 화면에 추가"를 선택하세요' }
          ]
        };
      case 'firefox':
        return {
          title: 'Firefox에서 앱 설치하기',
          steps: [
            { icon: <Share className="w-4 h-4" />, text: '주소창 오른쪽의 메뉴를 탭하세요' },
            { icon: <Plus className="w-4 h-4" />, text: '"홈 화면에 추가"를 선택하세요' },
            { icon: <Download className="w-4 h-4" />, text: '"설치"를 탭하여 완료' }
          ]
        };
      default:
        return null;
    }
  };

  // PWA가 이미 설치되어 있거나 표시할 조건이 맞지 않는 경우
  if (isStandalone || shouldHidePrompt || (!showInstallPrompt && !canShowManualPrompt)) {
    return null;
  }

  // 표시하지 않는 경우
  if (!showInstallPrompt) {
    return null;
  }

  const instructions = getInstallInstructions();
  const hasAutoInstall = !!deferredPrompt;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
              <Image src="/apple-touch-icon.png" alt="PikU App Icon" width={24} height={24} className="rounded-md" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                PikU 앱 설치
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                더 빠르고 편리하게 이용하세요
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {hasAutoInstall ? (
          // Chrome/Samsung 브라우저용 자동 설치
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
            >
              설치하기
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              나중에
            </button>
          </div>
        ) : instructions ? (
          // Safari/Firefox 등 수동 설치 안내
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {instructions.title}
            </h4>
            <div className="space-y-2">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full mr-2 text-blue-600 dark:text-blue-400">
                    {step.icon}
                  </div>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-4 rounded-md transition-colors"
            >
              확인했습니다
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
} 