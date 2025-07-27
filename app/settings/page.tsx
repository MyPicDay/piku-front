import PWAInstallButton from '@/components/common/PWAInstallButton';

const SettingsPage = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">설정</h1>
        
        {/* PWA 설치 섹션 */}
        <div className="mb-6">
          <PWAInstallButton />
        </div>
        
        {/* 기타 설정 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p>추가 설정 옵션이 여기에 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 