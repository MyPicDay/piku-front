import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDiaryShare } from '@/hooks/useDiaryShare';
import DiaryShareDialog from '../DiaryShareDialog';

const Harness = ({ onParentClick = () => {} }: { onParentClick?: () => void }) => {
  const controller = useDiaryShare(42, 'PUBLIC');
  return (
    <div onClick={onParentClick}>
      <button onClick={event => controller.open(event.currentTarget)}>일기 공유</button>
      <DiaryShareDialog controller={controller} status="PUBLIC" />
    </div>
  );
};

describe('DiaryShareDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('선택 전에는 API를 호출하지 않고 링크 복사와 더보기를 분리한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '일기 공유' }));
    const dialog = screen.getByRole('dialog', { name: '일기 공유' });
    expect(dialog).toHaveFocus();
    expect(share).not.toHaveBeenCalled();
    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: '링크 복사' }));
    expect(writeText).toHaveBeenCalledWith('https://www.pikume.com/diary/42');
    expect(share).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('링크를 복사했어요.');
    expect(screen.getByRole('button', { name: '일기 공유' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: '일기 공유' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const reopenedDialog = screen.getByRole('dialog');
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: '더보기' }));
    expect(share).toHaveBeenCalledOnce();
    await waitFor(() => expect(reopenedDialog).toHaveAttribute('aria-busy', 'false'));
  });

  it('복사 실패는 모달을 유지하고 재시도 성공 후에만 토스트를 표시한다', async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error('복사 거절')).mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '일기 공유' }));
    fireEvent.click(screen.getByRole('button', { name: '링크 복사' }));
    await screen.findByRole('textbox', { name: '공유 링크' });
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '링크 복사' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('링크를 복사했어요.');
  });

  it('키보드 포커스를 모달 안에 유지하고 Escape와 배경 클릭은 공유 모달만 닫는다', async () => {
    const onParentClick = vi.fn();
    render(<Harness onParentClick={onParentClick} />);
    const trigger = screen.getByRole('button', { name: '일기 공유' });
    fireEvent.click(trigger);
    onParentClick.mockClear();
    const dialog = screen.getByRole('dialog');
    const close = within(dialog).getByRole('button', { name: '공유 닫기' });
    const more = within(dialog).getByRole('button', { name: '더보기' });
    more.focus();
    fireEvent.keyDown(more, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(onParentClick).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    onParentClick.mockClear();
    fireEvent.click(screen.getByTestId('diary-share-overlay'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onParentClick).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('닫기 직후 history 이동 전 공유가 실패해도 복사하지 않고 뒤로가기를 중복 예약하지 않는다', async () => {
    let rejectShare!: (error: Error) => void;
    const share = vi.fn(() => new Promise<void>((_, reject) => { rejectShare = reject; }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });
    const { unmount } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '일기 공유' }));
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '공유 닫기' }));
      rejectShare(new TypeError('공유 실패'));
    });

    expect(writeText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '공유 닫기' }));
    unmount();
    expect(back).toHaveBeenCalledOnce();
    window.history.replaceState(null, '');
  });
});
