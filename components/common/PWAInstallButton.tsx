'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Share, Plus, Download } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type BrowserType = 'chrome' | 'safari' | 'firefox' | 'samsung' | 'ios' | 'unknown';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [browserType, setBrowserType] = useState<BrowserType>('unknown');
  const [showManualInstructions, setShowManualInstructions] = useState(false);

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

  useEffect(() => {
    const browser = detectBrowser();
    setBrowserType(browser);
    
    // PWA가 이미 설치되어 있는지 확인
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone ||
             document.referrer.includes('android-app://');
    };

    setIsStandalone(checkStandalone());

    // localStorage 변경 감지 함수
    const checkDismissedStatus = () => {
      const wasPromptDismissed = localStorage.getItem('pwa-install-dismissed');
      if (['safari', 'ios', 'firefox'].includes(browser) && !checkStandalone() && !wasPromptDismissed) {
        setCanInstall(true);
      } else if (wasPromptDismissed) {
        setCanInstall(false);
      }
    };

    // 초기 상태 설정
    checkDismissedStatus();

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // storage 이벤트 리스너 (localStorage 변경 감지)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pwa-install-dismissed') {
        checkDismissedStatus();
      }
    };

    // 커스텀 이벤트 리스너 (같은 탭에서의 PWA 설치 거부 감지)
    const handlePwaInstallDismissed = () => {
      checkDismissedStatus();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pwa-install-dismissed', handlePwaInstallDismissed);

    // 앱이 설치된 후 상태 업데이트
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsStandalone(true);
      setShowManualInstructions(false);
      // localStorage 정리
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pwa-install-dismissed', handlePwaInstallDismissed);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chrome/Samsung 브라우저용 자동 설치
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setCanInstall(false);
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('PWA 설치 중 오류 발생:', error);
      }
    } else if (['safari', 'ios', 'firefox'].includes(browserType)) {
      // 수동 설치 안내 표시
      setShowManualInstructions(true);
    } else {
      // 프롬프트가 없는 경우 localStorage 클리어하고 페이지 새로고침
      localStorage.removeItem('pwa-install-dismissed');
      window.location.reload();
    }
  };

  const resetInstallPrompt = () => {
    localStorage.removeItem('pwa-install-dismissed');
    // 커스텀 이벤트 발생으로 다른 컴포넌트에 알림
    window.dispatchEvent(new CustomEvent('pwa-install-reset'));
    window.location.reload();
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

  const instructions = getInstallInstructions();

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
          
          {showManualInstructions && instructions ? (
            // 수동 설치 안내 표시
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
                onClick={() => setShowManualInstructions(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                확인했습니다
              </button>
            </div>
          ) : (
            // 설치 버튼
            <div className="flex space-x-2">
              {canInstall || deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Image src="/apple-touch-icon.png" alt="" width={16} height={16} className="mr-2 rounded-sm" />
                  {deferredPrompt ? '앱 설치하기' : '설치 방법 보기'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {['safari', 'ios', 'firefox'].includes(browserType) 
                      ? '설치 안내를 이전에 거부하셨습니다.' 
                      : 'PWA 설치 조건을 만족하지 않습니다.'}
                  </p>
                  <button
                    onClick={resetInstallPrompt}
                    className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {['safari', 'ios', 'firefox'].includes(browserType) 
                      ? '다시 설치 안내 보기' 
                      : '설치 프롬프트 다시 보기'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 