import { useCallback, useEffect, useRef, useState } from 'react';
import type { PrivacyStatus } from '@/types/diary';
import {
  createDiaryShareUrl,
  DIARY_SHARE_TEXT,
  DIARY_SHARE_TITLE,
} from '@/lib/utils/diaryShare';

export type DiaryShareFeedback = {
  kind: 'success' | 'manual' | 'error';
  message: string;
  url?: string;
};

const COPY_SUCCESS_MESSAGE = '링크를 복사했어요.';
const MANUAL_COPY_MESSAGE =
  '자동으로 복사하지 못했어요. 아래 링크를 직접 복사해 주세요.';
const INVALID_STATE_MESSAGE =
  '공유를 시작하지 못했어요. 화면으로 돌아온 뒤 다시 눌러 주세요.';

const getErrorName = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error
    ? String(error.name)
    : '';

const getClipboard = (): Clipboard | null => {
  try {
    return navigator.clipboard ?? null;
  } catch {
    return null;
  }
};

export const useDiaryShare = (diaryId: number, status: PrivacyStatus) => {
  const url = createDiaryShareUrl(diaryId);
  const hasValidDiaryId = Number.isSafeInteger(diaryId) && diaryId > 0;
  const visible = status !== 'PRIVATE' && hasValidDiaryId;
  const key = `${diaryId}:${status}:${url ?? ''}`;
  const currentKeyRef = useRef(key);
  currentKeyRef.current = key;

  const mountedRef = useRef(false);
  const lockRef = useRef(false);
  const requestRef = useRef(0);
  const dismissedRequestRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<DiaryShareFeedback | null>(null);
  const [canRetryCopy, setCanRetryCopy] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      dismissedRequestRef.current = null;
      lockRef.current = false;
    };
  }, []);

  useEffect(() => {
    requestRef.current += 1;
    dismissedRequestRef.current = null;
    lockRef.current = false;
    setPending(false);
    setFeedback(null);
    setCanRetryCopy(false);
  }, [key]);

  useEffect(() => {
    if (feedback?.kind !== 'success') return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const isCurrentRequest = useCallback(
    (requestId: number, requestKey: string) =>
      mountedRef.current &&
      requestRef.current === requestId &&
      currentKeyRef.current === requestKey,
    [],
  );

  const finish = useCallback(
    (
      requestId: number,
      requestKey: string,
      nextFeedback: DiaryShareFeedback | null,
      nextCanRetryCopy = false,
    ) => {
      if (!isCurrentRequest(requestId, requestKey)) return;
      lockRef.current = false;
      setPending(false);
      if (dismissedRequestRef.current === requestId) {
        dismissedRequestRef.current = null;
        setFeedback(null);
        setCanRetryCopy(false);
        return;
      }
      setFeedback(nextFeedback);
      setCanRetryCopy(nextCanRetryCopy);
    },
    [isCurrentRequest],
  );

  const copyUrl = useCallback(
    (targetUrl: string, requestId: number, requestKey: string) => {
      if (!isCurrentRequest(requestId, requestKey)) return;
      const clipboard = getClipboard();
      const writeText = clipboard?.writeText;
      if (typeof writeText !== 'function') {
        finish(requestId, requestKey, {
          kind: 'manual',
          message: MANUAL_COPY_MESSAGE,
          url: targetUrl,
        });
        return;
      }

      let copyResult: Promise<void>;
      try {
        copyResult = writeText.call(clipboard, targetUrl);
      } catch {
        finish(
          requestId,
          requestKey,
          {
            kind: 'manual',
            message: MANUAL_COPY_MESSAGE,
            url: targetUrl,
          },
          true,
        );
        return;
      }

      Promise.resolve(copyResult).then(
        () =>
          finish(requestId, requestKey, {
            kind: 'success',
            message: COPY_SUCCESS_MESSAGE,
          }),
        () =>
          finish(
            requestId,
            requestKey,
            {
              kind: 'manual',
              message: MANUAL_COPY_MESSAGE,
              url: targetUrl,
            },
            true,
          ),
      );
    },
    [finish, isCurrentRequest],
  );

  const handleShareFailure = useCallback(
    (
      error: unknown,
      targetUrl: string,
      requestId: number,
      requestKey: string,
    ) => {
      if (!isCurrentRequest(requestId, requestKey)) return;
      const errorName = getErrorName(error);
      if (errorName === 'AbortError') {
        finish(requestId, requestKey, null);
        return;
      }
      if (errorName === 'InvalidStateError') {
        finish(requestId, requestKey, {
          kind: 'error',
          message: INVALID_STATE_MESSAGE,
        });
        return;
      }
      copyUrl(targetUrl, requestId, requestKey);
    },
    [copyUrl, finish, isCurrentRequest],
  );

  const startRequest = useCallback((preserveFeedback = false) => {
    if (lockRef.current) return null;
    lockRef.current = true;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    dismissedRequestRef.current = null;
    setPending(true);
    if (!preserveFeedback) {
      setFeedback(null);
      setCanRetryCopy(false);
    }
    return { requestId, requestKey: currentKeyRef.current };
  }, []);

  const share = useCallback(
    (trigger?: HTMLElement | null) => {
      if (!visible) return;
      if (trigger) triggerRef.current = trigger;
      if (!url) {
        setFeedback({
          kind: 'error',
          message: '공유 링크를 만들 수 없어요.',
        });
        setCanRetryCopy(false);
        return;
      }
      const request = startRequest();
      if (!request) return;

      const payload: ShareData = {
        title: DIARY_SHARE_TITLE,
        text: DIARY_SHARE_TEXT,
        url,
      };
      const shareMethod = navigator.share;

      if (typeof shareMethod === 'function') {
        let canShare = true;
        if (typeof navigator.canShare === 'function') {
          try {
            canShare = navigator.canShare(payload);
          } catch {
            canShare = false;
          }
        }

        if (canShare) {
          let shareResult: Promise<void>;
          try {
            shareResult = shareMethod.call(navigator, payload);
          } catch (error) {
            handleShareFailure(
              error,
              url,
              request.requestId,
              request.requestKey,
            );
            return;
          }
          Promise.resolve(shareResult).then(
            () => finish(request.requestId, request.requestKey, null),
            error =>
              handleShareFailure(
                error,
                url,
                request.requestId,
                request.requestKey,
              ),
          );
          return;
        }
      }

      copyUrl(url, request.requestId, request.requestKey);
    },
    [copyUrl, finish, handleShareFailure, startRequest, url, visible],
  );

  const retryCopy = useCallback(() => {
    if (feedback?.kind !== 'manual' || !feedback.url) return;
    const request = startRequest(true);
    if (!request) return;
    copyUrl(feedback.url, request.requestId, request.requestKey);
  }, [copyUrl, feedback, startRequest]);

  const closeFeedback = useCallback(() => {
    if (lockRef.current) {
      dismissedRequestRef.current = requestRef.current;
    }
    setFeedback(null);
    setCanRetryCopy(false);
    triggerRef.current?.focus();
  }, []);

  return {
    visible,
    pending,
    feedback,
    canRetryCopy,
    share,
    retryCopy,
    closeFeedback,
  };
};
