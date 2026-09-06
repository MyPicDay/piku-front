import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DiaryShareButton from '../DiaryShareButton';

describe('DiaryShareButton', () => {
  it('키보드 포커스 가능한 버튼에 공유 안내와 focus 표시를 제공한다', () => {
    render(
      <DiaryShareButton status="PUBLIC" pending={false} onShare={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: '일기 공유' });
    fireEvent.focus(button);

    expect(button).toHaveAccessibleDescription('공유하기');
    expect(screen.getByRole('tooltip')).toHaveTextContent('공유하기');
    expect(button).toHaveClass('focus-visible:ring-2');
  });

  it('친구 공개 일기의 열람 제한 안내를 접근 가능한 설명으로 연결한다', () => {
    render(
      <DiaryShareButton status="FRIENDS" pending={false} onShare={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '일기 공유' })).toHaveAccessibleDescription(
      '공유하기 작성자의 친구만 볼 수 있는 일기예요.',
    );
  });
});
