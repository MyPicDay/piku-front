import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiaryShare } from '../useDiaryShare';
import type { PrivacyStatus } from '@/types/diary';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const errorWithName = (name: string) => Object.assign(new Error(name), { name });

describe('useDiaryShare', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('선택 모달을 열 때 API를 호출하지 않고 링크 복사는 Clipboard만 즉시 호출한다', async () => {
    const share = vi.fn();
    const copyResult = deferred<void>();
    const writeText = vi.fn(() => copyResult.promise);
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    const { result } = renderHook(() => useDiaryShare(42, 'PUBLIC'));
    act(() => result.current.open(document.createElement('button')));
    expect(result.current.isOpen).toBe(true);
    expect(share).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();

    act(() => result.current.copy());
    expect(writeText).toHaveBeenCalledWith('https://www.pikume.com/diary/42');
    expect(share).not.toHaveBeenCalled();
    expect(result.current.feedback).toBeNull();
    await act(async () => copyResult.resolve());
    expect(result.current.feedback?.kind).toBe('success');
  });

  it('더보기 처리 중 모달을 닫으면 늦은 실패의 복사를 막고 요청이 끝나야 다시 연다', async () => {
    const shareResult = deferred<void>();
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { share: vi.fn(() => shareResult.promise), clipboard: { writeText } });
    const { result } = renderHook(() => useDiaryShare(42, 'PUBLIC'));
    act(() => result.current.open());
    act(() => result.current.share());
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(false);
    await act(async () => shareResult.reject(new TypeError('late failure')));
    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
    expect(result.current.feedback).toBeNull();
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it('일기나 공개 범위가 바뀌면 선택 모달을 닫는다', () => {
    const { result, rerender } = renderHook(
      ({ id, status }: { id: number; status: PrivacyStatus }) => useDiaryShare(id, status),
      { initialProps: { id: 42, status: 'PUBLIC' as PrivacyStatus } },
    );
    act(() => result.current.open());
    rerender({ id: 43, status: 'PRIVATE' });
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(false);
  });

  it('공유 payload를 동기적으로 한 번 전달하고 성공 안내는 만들지 않는다', async () => {
    const shareResult = deferred<void>();
    const share = vi.fn(() => shareResult.promise);
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    const { result } = renderHook(() => useDiaryShare(42, 'PUBLIC'));

    act(() => result.current.share(document.createElement('button')));

    expect(share).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledWith({
      title: 'PikUme 일기',
      text: 'PikUme에서 일기를 확인해 보세요.',
      url: 'https://www.pikume.com/diary/42',
    });
    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(true);

    await act(async () => shareResult.resolve());
    expect(result.current.pending).toBe(false);
    expect(result.current.feedback).toBeNull();
  });

  it('canShare가 없으면 share를 시도하고 false 또는 예외면 즉시 복사한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    const first = renderHook(() => useDiaryShare(1, 'PUBLIC'));
    act(() => first.result.current.share());
    expect(share).toHaveBeenCalledOnce();
    first.unmount();

    const canShare = vi.fn().mockReturnValue(false);
    vi.stubGlobal('navigator', { share, canShare, clipboard: { writeText } });
    const second = renderHook(() => useDiaryShare(2, 'PUBLIC'));
    act(() => second.result.current.share());
    expect(writeText).toHaveBeenCalledWith('https://www.pikume.com/diary/2');
    second.unmount();

    canShare.mockImplementation(() => { throw new Error('blocked'); });
    const third = renderHook(() => useDiaryShare(3, 'PUBLIC'));
    act(() => third.result.current.share());
    expect(writeText).toHaveBeenCalledWith('https://www.pikume.com/diary/3');
  });

  it('AbortError는 조용히 끝내고 InvalidStateError는 복사하지 않고 안내한다', async () => {
    const share = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    share.mockRejectedValueOnce(errorWithName('AbortError'));
    const { result } = renderHook(() => useDiaryShare(1, 'PUBLIC'));

    act(() => result.current.share());
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.feedback).toBeNull();

    share.mockRejectedValueOnce(errorWithName('InvalidStateError'));
    act(() => result.current.share());
    await waitFor(() => expect(result.current.feedback?.message).toBe(
      '공유를 시작하지 못했어요. 화면으로 돌아온 뒤 다시 눌러 주세요.',
    ));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('공유 오류 뒤 복사 성공만 성공으로 알리고 복사 실패는 수동 URL을 제공한다', async () => {
    const share = vi.fn().mockRejectedValue(new TypeError('share failed'));
    const writeText = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('clipboard denied'));
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    const { result } = renderHook(() => useDiaryShare(7, 'FRIENDS'));

    act(() => result.current.share());
    await waitFor(() => expect(result.current.feedback?.kind).toBe('success'));
    expect(result.current.feedback?.message).toBe('링크를 복사했어요.');

    act(() => result.current.share());
    await waitFor(() => expect(result.current.feedback?.kind).toBe('manual'));
    expect(result.current.feedback?.url).toBe('https://www.pikume.com/diary/7');
  });

  it('클립보드가 없으면 수동 URL을 제공하고 재복사 버튼은 비활성 계약을 알린다', async () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useDiaryShare(9, 'ANONYMOUS'));
    act(() => result.current.share());

    expect(result.current.feedback?.kind).toBe('manual');
    expect(result.current.canRetryCopy).toBe(false);
  });

  it('처리 중 반복 입력과 일기 변경 뒤 늦은 완료를 무시한다', async () => {
    const copyResult = deferred<void>();
    const writeText = vi.fn(() => copyResult.promise);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { result, rerender } = renderHook<
      ReturnType<typeof useDiaryShare>,
      { id: number; status: PrivacyStatus }
    >(
      ({ id, status }) => useDiaryShare(id, status),
      { initialProps: { id: 1, status: 'PUBLIC' } },
    );

    act(() => {
      result.current.share();
      result.current.share();
    });
    expect(writeText).toHaveBeenCalledOnce();

    rerender({ id: 2, status: 'PRIVATE' });
    await act(async () => copyResult.resolve());
    expect(result.current.visible).toBe(false);
    expect(result.current.feedback).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it('언마운트 뒤 완료된 복사 결과를 적용하지 않는다', async () => {
    const copyResult = deferred<void>();
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => copyResult.promise) },
    });
    const { result, unmount } = renderHook(() => useDiaryShare(11, 'PUBLIC'));
    act(() => result.current.share());
    unmount();

    await act(async () => copyResult.resolve());
  });

  it('재복사 처리 중 수동 패널을 유지하고 성공한 뒤에만 닫는다', async () => {
    const retryResult = deferred<void>();
    const writeText = vi.fn()
      .mockRejectedValueOnce(new Error('denied'))
      .mockReturnValueOnce(retryResult.promise);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { result } = renderHook(() => useDiaryShare(12, 'PUBLIC'));
    act(() => result.current.share());
    await waitFor(() => expect(result.current.feedback?.kind).toBe('manual'));

    act(() => result.current.retryCopy());

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(true);
    expect(result.current.feedback?.kind).toBe('manual');
    expect(result.current.canRetryCopy).toBe(true);

    await act(async () => retryResult.resolve());
    await waitFor(() => expect(result.current.feedback?.kind).toBe('success'));
  });

  it('재복사 중 패널을 닫아도 정착 전 중복 실행을 막고 정착 후 새 공유를 허용한다', async () => {
    const retryResult = deferred<void>();
    const writeText = vi.fn()
      .mockRejectedValueOnce(new Error('denied'))
      .mockReturnValueOnce(retryResult.promise)
      .mockResolvedValueOnce(undefined);
    const trigger = document.createElement('button');
    document.body.append(trigger);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { result } = renderHook(() => useDiaryShare(15, 'PUBLIC'));
    act(() => result.current.share(trigger));
    await waitFor(() => expect(result.current.feedback?.kind).toBe('manual'));

    act(() => result.current.retryCopy());
    act(() => result.current.closeFeedback());
    expect(result.current.pending).toBe(true);
    expect(result.current.feedback).toBeNull();
    expect(trigger).toHaveFocus();

    act(() => result.current.share());
    expect(writeText).toHaveBeenCalledTimes(2);

    await act(async () => retryResult.reject(new Error('still denied')));
    expect(result.current.pending).toBe(false);
    expect(result.current.feedback).toBeNull();

    act(() => result.current.share());
    expect(writeText).toHaveBeenCalledTimes(3);
    await waitFor(() => expect(result.current.feedback?.kind).toBe('success'));
    trigger.remove();
  });

  it('공유 Promise가 대상 변경 뒤 실패해도 이전 URL 복사를 시작하지 않는다', async () => {
    const shareResult = deferred<void>();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: vi.fn(() => shareResult.promise),
      clipboard: { writeText },
    });
    const { result, rerender } = renderHook<
      ReturnType<typeof useDiaryShare>,
      { id: number; status: PrivacyStatus }
    >(({ id, status }) => useDiaryShare(id, status), {
      initialProps: { id: 16, status: 'PUBLIC' },
    });
    act(() => result.current.share());

    rerender({ id: 17, status: 'PRIVATE' });
    await act(async () => shareResult.reject(new TypeError('late failure')));

    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.feedback).toBeNull();
  });

  it('공유 Promise가 언마운트 뒤 실패해도 fallback 복사를 시작하지 않는다', async () => {
    const shareResult = deferred<void>();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: vi.fn(() => shareResult.promise),
      clipboard: { writeText },
    });
    const { result, unmount } = renderHook(() => useDiaryShare(18, 'PUBLIC'));
    act(() => result.current.share());
    unmount();

    await act(async () => shareResult.reject(new TypeError('late failure')));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('렌더 중 Clipboard API를 읽지 않고 사용자 조작에서만 감지한다', () => {
    const clipboardGetter = vi.fn(() => undefined);
    const navigatorMock = {};
    Object.defineProperty(navigatorMock, 'clipboard', {
      configurable: true,
      get: clipboardGetter,
    });
    vi.stubGlobal('navigator', navigatorMock);

    const { result } = renderHook(() => useDiaryShare(13, 'PUBLIC'));
    expect(clipboardGetter).not.toHaveBeenCalled();

    act(() => result.current.share());
    expect(clipboardGetter).toHaveBeenCalledOnce();
  });

  it('기준 주소가 잘못되어도 유효한 공개 일기는 버튼을 노출하고 실행 불가를 알린다', () => {
    const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_BASE_URL = 'ftp://invalid.example';
    const { result, unmount } = renderHook(() => useDiaryShare(14, 'PUBLIC'));

    expect(result.current.visible).toBe(true);
    act(() => result.current.share());
    expect(result.current.feedback?.message).toBe('공유 링크를 만들 수 없어요.');

    unmount();
    process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
  });
});
