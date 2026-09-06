'use client';

import { forwardRef, useId, type MouseEvent } from 'react';
import type { PrivacyStatus } from '@/types/diary';
import { ShareIcon } from '@/components/icons/FeedIcons';

interface DiaryShareButtonProps {
  status: PrivacyStatus;
  pending: boolean;
  onShare: (trigger: HTMLButtonElement) => void;
  variant?: 'default' | 'story';
  className?: string;
}

const DiaryShareButton = forwardRef<HTMLButtonElement, DiaryShareButtonProps>(
  (
    {
      status,
      pending,
      onShare,
      variant = 'default',
      className = '',
    },
    ref,
  ) => {
    const id = useId();
    const friendsDescriptionId = `diary-share-friends-${id}`;
    const tooltipId = `diary-share-tooltip-${id}`;
    const describedBy =
      [
        variant === 'default' ? tooltipId : null,
        status === 'FRIENDS' ? friendsDescriptionId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onShare(event.currentTarget);
    };

    return (
      <span className="group relative inline-flex">
        <button
          ref={ref}
          type="button"
          aria-label="일기 공유"
          aria-busy={pending}
          aria-describedby={describedBy}
          title={
            status === 'FRIENDS'
              ? '작성자의 친구만 볼 수 있는 일기예요.'
              : '공유하기'
          }
          disabled={pending}
          onClick={handleClick}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 disabled:opacity-50 ${
            variant === 'story'
              ? 'flex-col text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]'
              : 'text-gray-700 dark:text-gray-200'
          } ${className}`}
        >
          <ShareIcon className="h-7 w-7" />
          {variant === 'story' && (
            <span className="mt-1 text-xs font-semibold leading-none">
              공유
            </span>
          )}
        </button>
        {variant === 'default' && (
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          >
            공유하기
          </span>
        )}
        {status === 'FRIENDS' && (
          <span id={friendsDescriptionId} className="sr-only">
            작성자의 친구만 볼 수 있는 일기예요.
          </span>
        )}
      </span>
    );
  },
);

DiaryShareButton.displayName = 'DiaryShareButton';

export default DiaryShareButton;
