'use client';

import { useEffect, useId, useRef } from 'react';
import type { DiaryShareFeedback as Feedback } from '@/hooks/useDiaryShare';
import type { PrivacyStatus } from '@/types/diary';

interface DiaryShareFeedbackProps {
  feedback: Feedback | null;
  status: PrivacyStatus;
  canRetryCopy: boolean;
  pending: boolean;
  onRetryCopy: () => void;
  onClose: () => void;
  variant?: 'default' | 'story';
}

const DiaryShareFeedback = ({
  feedback,
  status,
  canRetryCopy,
  pending,
  onRetryCopy,
  onClose,
  variant = 'default',
}: DiaryShareFeedbackProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `diary-share-url-${useId()}`;

  useEffect(() => {
    if (feedback?.kind !== 'manual') return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [feedback?.kind]);

  if (!feedback) {
    if (status !== 'FRIENDS') return null;
    return (
      <p
        className={
          variant === 'story'
            ? 'absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-20 z-20 rounded bg-black/70 px-3 py-2 text-xs text-white'
            : 'mt-1 text-xs text-gray-500 dark:text-gray-400'
        }
      >
        작성자의 친구만 볼 수 있는 일기예요.
      </p>
    );
  }

  if (feedback.kind !== 'manual') {
    return (
      <p
        role={feedback.kind === 'error' ? 'alert' : 'status'}
        aria-live="polite"
        className={
          variant === 'story'
            ? 'absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-20 z-30 rounded-lg bg-black/80 p-3 text-sm text-white shadow-xl'
            : 'mt-2 text-sm text-gray-600 dark:text-gray-300'
        }
      >
        {feedback.message}
      </p>
    );
  }

  return (
    <div
      role="region"
      aria-label="공유 링크 직접 복사"
      onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      className={
        variant === 'story'
          ? 'absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-20 z-30 rounded-lg bg-white p-3 text-gray-900 shadow-xl'
          : 'mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900'
      }
    >
      <p
        className={`mb-2 text-sm text-gray-700 ${
          variant === 'story' ? '' : 'dark:text-gray-200'
        }`}
      >
        {feedback.message}
      </p>
      <label htmlFor={inputId} className="sr-only">
        공유 링크
      </label>
      <input
        ref={inputRef}
        id={inputId}
        aria-label="공유 링크"
        readOnly
        value={feedback.url ?? ''}
        onFocus={event => event.currentTarget.select()}
        className="w-full rounded border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900"
      />
      <div className="mt-2 flex justify-end gap-2">
        {canRetryCopy && (
          <button
            type="button"
            onClick={onRetryCopy}
            disabled={pending}
            className="min-h-11 rounded px-3 text-sm font-semibold text-blue-600 disabled:opacity-50"
          >
            링크 복사
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className={`min-h-11 rounded px-3 text-sm font-semibold text-gray-700 ${
            variant === 'story' ? '' : 'dark:text-gray-200'
          }`}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default DiaryShareFeedback;
