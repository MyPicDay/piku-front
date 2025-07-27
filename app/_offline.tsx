export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg 
            className="w-10 h-10 text-gray-400 dark:text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v20M2 12h20" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          인터넷 연결이 없습니다
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          현재 오프라인 상태입니다. 인터넷 연결을 확인하고 다시 시도해주세요.
          일부 기능은 오프라인에서도 이용 가능합니다.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          다시 시도
        </button>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>오프라인에서도 이용 가능한 기능:</p>
          <ul className="mt-2 space-y-1">
            <li>• 이전에 본 다이어리 내용</li>
            <li>• 캐시된 이미지</li>
            <li>• 기본 앱 기능</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 