import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DiaryStoryModal from '../DiaryStoryModal';
import type { DiaryDetail } from '@/types/diary';
import { addLike } from '@/lib/api/like';

const mockPush = vi.fn();
const useSwipeableMock = vi.hoisted(() =>
  vi.fn((options: Record<string, unknown>) => {
    void options;
    return {};
  }),
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img {...props} />
  ),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({
        children,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        drag: _drag,
        dragConstraints: _dragConstraints,
        dragElastic: _dragElastic,
        onDragEnd: _onDragEnd,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
        <div {...props}>{children}</div>
      ),
    },
  };
});

vi.mock('react-swipeable', () => ({
  useSwipeable: useSwipeableMock,
}));

vi.mock('@/components/store/authStore', () => ({
  default: () => ({
    user: {
      id: 'user-1',
      email: 'user@example.com',
      nickname: 'tester',
      avatar: '',
    },
  }),
}));

vi.mock('@/lib/api/diary', () => ({
  deleteDiary: vi.fn(),
}));

vi.mock('@/lib/api/like', () => ({
  addLike: vi.fn(),
  removeLike: vi.fn(),
}));

vi.mock('../StoryCommentModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="story-comment-modal">
      <button onClick={onClose}>댓글 닫기</button>
    </div>
  ),
}));

const diary: DiaryDetail = {
  diaryId: 1,
  content: '테스트 일기',
  date: '2026-04-05',
  status: 'PUBLIC',
  createdAt: '2026-04-05T10:00:00',
  updatedAt: '2026-04-05T10:00:00',
  isLiked: false,
  likeCount: 0,
  commentCount: 3,
  imgUrls: ['https://example.com/image.png'],
  nickname: 'tester',
  avatar: '',
  userId: 'user-1',
  isOwner: true,
  comments: [],
};

describe('DiaryStoryModal history navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('좋아요와 댓글을 우측 하단 세로 액션 레일에 표시한다', () => {
    render(<DiaryStoryModal diary={diary} onClose={vi.fn()} />);

    const actionRail = screen.getByTestId('story-action-rail');
    expect(actionRail).toHaveClass('right-4', 'bottom-8', 'flex-col');
    expect(within(actionRail).getAllByRole('button')).toHaveLength(3);
    expect(within(actionRail).getByRole('button', { name: '좋아요 0개' })).toBeInTheDocument();
    expect(within(actionRail).getByRole('button', { name: '댓글 3개 보기' })).toBeInTheDocument();
    expect(within(actionRail).getByRole('button', { name: '일기 공유' })).toHaveTextContent('공유');
    expect(screen.queryByText('댓글 보기')).not.toBeInTheDocument();
  });

  it('댓글 화면에서는 공유를 포함한 액션 레일을 숨긴다', async () => {
    render(<DiaryStoryModal diary={diary} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '댓글 3개 보기' }));

    expect(await screen.findByTestId('story-comment-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('story-action-rail')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '일기 공유' })).not.toBeInTheDocument();
  });

  it('PRIVATE 일기에는 공유 액션을 표시하지 않는다', () => {
    render(<DiaryStoryModal diary={{ ...diary, status: 'PRIVATE' }} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '일기 공유' })).not.toBeInTheDocument();
  });

  it('위로 스와이프해서 댓글을 여는 핸들러는 등록하지 않는다', () => {
    render(<DiaryStoryModal diary={diary} onClose={vi.fn()} />);

    expect(useSwipeableMock).toHaveBeenCalled();
    expect(useSwipeableMock.mock.calls.at(-1)?.[0]).not.toHaveProperty('onSwipedUp');
  });

  it('댓글 화면에서 뒤로가기를 하면 댓글만 닫고 일기 상세를 유지한다', async () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    render(<DiaryStoryModal diary={diary} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '댓글 3개 보기' }));

    expect(await screen.findByTestId('story-comment-modal')).toBeInTheDocument();
    expect(pushStateSpy).toHaveBeenCalledWith({ modal: 'diary-comment' }, '');

    fireEvent.popState(window);

    await waitFor(() => {
      expect(screen.queryByTestId('story-comment-modal')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '댓글 3개 보기' })).toBeInTheDocument();
  });

  it('댓글 화면을 수동으로 닫으면 댓글 히스토리 엔트리를 되돌린다', async () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});

    render(<DiaryStoryModal diary={diary} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '댓글 3개 보기' }));

    expect(await screen.findByTestId('story-comment-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('댓글 닫기'));

    await waitFor(() => {
      expect(screen.queryByTestId('story-comment-modal')).not.toBeInTheDocument();
    });
    expect(backSpy).toHaveBeenCalledOnce();
  });

  it('좋아요 성공 시 부모 피드에 변경된 좋아요 상태를 알린다', async () => {
    vi.mocked(addLike).mockResolvedValue({
      diaryId: 1,
      likeCount: 4,
      isLiked: true,
    });
    const onLikeChange = vi.fn();

    render(
      <DiaryStoryModal
        diary={{ ...diary, isLiked: false, likeCount: 3 }}
        onClose={vi.fn()}
        onLikeChange={onLikeChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '좋아요 3개' }));

    await waitFor(() => {
      expect(addLike).toHaveBeenCalledWith(1);
      expect(onLikeChange).toHaveBeenCalledWith(1, {
        likeCount: 4,
        isLiked: true,
      });
    });
  });

  it('owner can open the diary edit page from the story modal', async () => {
    const { container } = render(
      <DiaryStoryModal
        diary={diary}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(container.querySelectorAll('button')[0]);
    fireEvent.click(await screen.findByText('일기 수정'));

    expect(mockPush).toHaveBeenCalledWith('/diary/1/edit');
  });
});
