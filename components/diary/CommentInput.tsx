'use client';

import { XCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  placeholder?: string;
  isSubmitting: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  onCancelReply?: () => void;
}

const CommentInput = ({
  value,
  onChange,
  onSubmit,
  placeholder = '댓글을 입력하세요...',
  isSubmitting,
  inputRef,
  onCancelReply,
}: CommentInputProps) => {
  const { isLoggedIn } = useAuthStore();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || isSubmitting || !isLoggedIn) return;
    await onSubmit();
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center py-3">
        <p className="text-gray-400 text-sm">
          댓글을 작성하려면 로그인해주세요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm focus:outline-none"
        disabled={isSubmitting}
      />
      <button
        type="button"
        onClick={onCancelReply}
        className="mr-2 text-gray-500 hover:text-gray-700 transition-opacity duration-200"
        style={{ opacity: onCancelReply ? 1 : 0 }}
        disabled={!onCancelReply}
      >
        <XCircle size={18} />
      </button>
      <button
        type="submit"
        disabled={!value.trim() || isSubmitting}
        className="w-16 min-w-[64px] cursor-pointer text-sm font-bold text-blue-500 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400 text-center"
      >
        {isSubmitting ? '게시 중...' : '게시'}
      </button>
    </form>
  );
};

export default CommentInput; 