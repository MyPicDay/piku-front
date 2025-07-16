'use client';

import { X } from 'lucide-react';

interface NotReadyModalProps {
  onClose: () => void;
}

const NotReadyModal = ({ onClose }: NotReadyModalProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
        >
          <X size={24} />
        </button>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🚧 개발 중인 기능입니다 🚧
          </h3>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            현재 준비 중인 기능입니다. <br />
            빠른 시일 내에 찾아뵐 수 있도록 노력하겠습니다!
          </p>
          <button
            onClick={onClose}
            className="mt-6 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotReadyModal; 