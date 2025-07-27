'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PolicyModalProps {
  title: string;
  content: string;
  onClose: () => void;
  onAgree?: () => void;
}

const PolicyModal = ({ title, content, onClose, onAgree }: PolicyModalProps) => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white dark:bg-black rounded-lg shadow-2xl w-11/12 md:w-2/3 max-w-2xl max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
          <X size={24} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">{content}</pre>
      </div>
      <div className="p-4 border-t dark:border-gray-700 flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-md cursor-pointer hover:bg-black hover:text-white dark:hover:bg-gray-600"
        >
          닫기
        </button>
        {onAgree && (
          <button
            onClick={onAgree}
            className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600"
          >
            동의
          </button>
        )}
      </div>
    </div>
  </div>
);

export default PolicyModal; 