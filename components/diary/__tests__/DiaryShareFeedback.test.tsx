import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DiaryShareFeedback from '../DiaryShareFeedback';

describe('DiaryShareFeedback', () => {
  it('수동 링크를 열면 전체 선택하고 Escape로 닫은 뒤 공유 버튼에 포커스를 돌린다', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    const onClose = vi.fn(() => trigger.focus());

    render(
      <DiaryShareFeedback
        feedback={{
          kind: 'manual',
          message: '자동으로 복사하지 못했어요. 아래 링크를 직접 복사해 주세요.',
          url: 'https://www.pikume.com/diary/42',
        }}
        status="PUBLIC"
        canRetryCopy
        pending={false}
        onRetryCopy={vi.fn()}
        onClose={onClose}
      />,
    );

    const input = screen.getByRole('textbox', { name: '공유 링크' }) as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    expect(input).toHaveClass('bg-white', 'text-gray-900');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('클립보드가 없으면 링크 복사 버튼을 표시하지 않는다', () => {
    render(
      <DiaryShareFeedback
        feedback={{ kind: 'manual', message: '직접 복사', url: 'https://example.com' }}
        status="PUBLIC"
        canRetryCopy={false}
        pending={false}
        onRetryCopy={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: '링크 복사' })).not.toBeInTheDocument();
  });

  it('재복사 처리와 실패로 수동 피드백 객체가 바뀌어도 재복사 버튼 포커스를 유지한다', () => {
    const onRetryCopy = vi.fn();
    const onClose = vi.fn();
    const manualFeedback = {
      kind: 'manual' as const,
      message: '직접 복사',
      url: 'https://example.com',
    };
    const { rerender } = render(
      <DiaryShareFeedback
        feedback={manualFeedback}
        status="PUBLIC"
        canRetryCopy
        pending={false}
        onRetryCopy={onRetryCopy}
        onClose={onClose}
      />,
    );
    const retryButton = screen.getByRole('button', { name: '링크 복사' });
    retryButton.focus();

    rerender(
      <DiaryShareFeedback
        feedback={{ ...manualFeedback }}
        status="PUBLIC"
        canRetryCopy
        pending
        onRetryCopy={onRetryCopy}
        onClose={onClose}
      />,
    );
    expect(retryButton).toHaveAttribute('aria-disabled', 'true');
    expect(retryButton).not.toBeDisabled();
    expect(retryButton).toHaveFocus();
    fireEvent.click(retryButton);
    expect(onRetryCopy).not.toHaveBeenCalled();
    fireEvent.keyDown(retryButton, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    rerender(
      <DiaryShareFeedback
        feedback={{ ...manualFeedback }}
        status="PUBLIC"
        canRetryCopy
        pending={false}
        onRetryCopy={onRetryCopy}
        onClose={onClose}
      />,
    );
    expect(retryButton).toHaveFocus();
    fireEvent.click(retryButton);
    expect(onRetryCopy).toHaveBeenCalledOnce();
  });

  it('스토리 성공 안내를 안전 영역의 고대비 패널에 표시한다', () => {
    render(
      <DiaryShareFeedback
        feedback={{ kind: 'success', message: '링크를 복사했어요.' }}
        status="PUBLIC"
        canRetryCopy
        pending={false}
        onRetryCopy={vi.fn()}
        onClose={vi.fn()}
        variant="story"
      />,
    );
    expect(screen.getByRole('status')).toHaveClass(
      'absolute',
      'bottom-[max(1rem,env(safe-area-inset-bottom))]',
      'text-white',
    );
  });

  it('스토리 수동 패널은 다크 모드에서도 흰 배경과 어두운 글자 대비를 유지한다', () => {
    render(
      <DiaryShareFeedback
        feedback={{ kind: 'manual', message: '직접 복사', url: 'https://example.com' }}
        status="PUBLIC"
        canRetryCopy={false}
        pending={false}
        onRetryCopy={vi.fn()}
        onClose={vi.fn()}
        variant="story"
      />,
    );
    expect(screen.getByText('직접 복사')).toHaveClass('text-gray-700');
    expect(screen.getByText('직접 복사')).not.toHaveClass('dark:text-gray-200');
    expect(screen.getByRole('button', { name: '닫기' })).toHaveClass('text-gray-700');
    expect(screen.getByRole('button', { name: '닫기' })).not.toHaveClass('dark:text-gray-200');
  });

  it('친구 공개 제한을 액션 인접 영역에 보이는 안내로 제공한다', () => {
    render(
      <DiaryShareFeedback
        feedback={null}
        status="FRIENDS"
        canRetryCopy={false}
        pending={false}
        onRetryCopy={vi.fn()}
        onClose={vi.fn()}
        variant="story"
      />,
    );
    expect(
      screen.getByText('작성자의 친구만 볼 수 있는 일기예요.'),
    ).toHaveClass('absolute', 'right-20');
  });
});
