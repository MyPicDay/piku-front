'use client';

import { useCallback, useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Ellipsis, Link, X } from 'lucide-react';
import type { PrivacyStatus } from '@/types/diary';
import type { useDiaryShare } from '@/hooks/useDiaryShare';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import DiaryShareFeedback from './DiaryShareFeedback';

interface DiaryShareDialogProps {
  controller: ReturnType<typeof useDiaryShare>;
  status: PrivacyStatus;
  variant?: 'default' | 'story';
}

const DiaryShareDialog = ({ controller, status, variant = 'default' }: DiaryShareDialogProps) => {
  const { isOpen, pending, feedback, copy, share, close, dismissPending, restoreFocus } = controller;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const hasHistoryEntryRef = useRef(false);
  const closingRef = useRef(false);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ ...window.history.state, diaryShareDialog: titleId }, '');
    hasHistoryEntryRef.current = true;
    closingRef.current = false;
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.diaryShareDialog === titleId) return;
      hasHistoryEntryRef.current = false;
      closingRef.current = false;
      close();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closingRef.current && hasHistoryEntryRef.current && window.history.state?.diaryShareDialog === titleId) {
        window.history.back();
      }
      hasHistoryEntryRef.current = false;
    };
  }, [close, isOpen, titleId]);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    // history 이동 전에 도착하는 공유 실패도 후속 복사를 실행하지 않게 한다.
    dismissPending();
    if (hasHistoryEntryRef.current && window.history.state?.diaryShareDialog === titleId) {
      closingRef.current = true;
      window.history.back();
    } else {
      close();
    }
  }, [close, dismissPending, titleId]);

  useEffect(() => {
    if (isOpen && feedback?.kind === 'success') handleClose();
  }, [feedback?.kind, handleClose, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    dialog?.focus();
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog?.contains(event.target)) dialog?.focus();
    };
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('focusin', containFocus);
      restoreFocus();
    };
  }, [isOpen, restoreFocus]);

  if (!isOpen) {
    return <DiaryShareFeedback feedback={feedback?.kind === 'success' ? feedback : null} status={status} pending={false}
      canRetryCopy={false} onRetryCopy={copy} onClose={close} variant={variant} />;
  }

  // 추가 공유 수단도 같은 항목 구조와 배치를 사용한다.
  const actions = [
    { id: 'copy', label: '링크 복사', icon: Link, onSelect: copy },
    { id: 'more', label: '더보기', icon: Ellipsis, onSelect: () => share() },
  ];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      handleClose();
    }
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      data-testid="diary-share-overlay"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={event => {
        event.stopPropagation();
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={status === 'FRIENDS' ? descriptionId : undefined}
        aria-busy={pending}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-white px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-gray-900 shadow-xl outline-none dark:bg-gray-900 dark:text-gray-100 sm:max-w-sm sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold">일기 공유</h2>
          <button type="button" aria-label="공유 닫기" onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-gray-800">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {status === 'FRIENDS' && <p id={descriptionId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          작성자의 친구만 볼 수 있는 일기예요.
        </p>}
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5">
          {actions.map(({ id, label, icon: Icon, onSelect }) => (
            <button key={id} type="button" aria-disabled={pending}
              onClick={() => { if (!pending && !closingRef.current) onSelect(); }}
              className="flex min-h-24 flex-col items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-500 aria-disabled:opacity-50 dark:hover:bg-gray-800">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Icon size={26} aria-hidden="true" />
              </span>
              {label}
            </button>
          ))}
        </div>
        {feedback && feedback.kind !== 'success' && <DiaryShareFeedback feedback={feedback} status={status} pending={pending}
          canRetryCopy={false} onRetryCopy={copy} onClose={handleClose} />}
      </div>
    </div>,
    document.body,
  );
};

export default DiaryShareDialog;
