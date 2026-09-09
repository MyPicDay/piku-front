import { existsSync } from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DiaryDetailModal from '../DiaryDetailModal';
import type { DiaryDetail } from '@/types/diary';
import type { Comment, CommentPage } from '@/types/comment';
import { deleteComment, getRootComments } from '@/lib/api/comment';
import { addLike } from '@/lib/api/like';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/api/comment', () => ({
  createComment: vi.fn(),
  getRootComments: vi.fn().mockResolvedValue({
    content: [],
    totalPages: 0,
    totalElements: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
  }),
  getReplies: vi.fn(),
  deleteComment: vi.fn(),
  updateComment: vi.fn(),
}));

vi.mock('@/lib/api/diary', () => ({
  deleteDiary: vi.fn(),
}));

vi.mock('@/lib/api/like', () => ({
  addLike: vi.fn(),
  removeLike: vi.fn(),
}));

vi.mock('@/components/store/authStore', () => ({
  default: () => ({
    isLoggedIn: true,
    user: {
      id: 'user-1',
      email: 'user@example.com',
      nickname: 'tester',
      avatar: '',
    },
  }),
}));

vi.mock('@/components/feed/ProfileHoverCard', () => ({
  default: () => null,
}));

vi.mock('../CommentItem', () => ({
  default: ({
    comment,
    onDeleteComment,
  }: {
    comment: Comment;
    onDeleteComment: (commentId: number, parentId: number | null) => void;
  }) => (
    <button
      data-testid={`delete-comment-${comment.id}`}
      onClick={() => onDeleteComment(comment.id, comment.parentId)}
    >
      댓글 삭제
    </button>
  ),
}));

vi.mock('../CommentInput', () => ({
  default: () => null,
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
  commentCount: 0,
  imgUrls: ['https://example.com/image.png'],
  nickname: 'tester',
  avatar: '',
  userId: 'user-1',
  isOwner: true,
  comments: [],
};

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 10,
  diaryId: 1,
  userId: 'user-1',
  nickname: 'tester',
  avatar: '',
  content: '댓글',
  parentId: null,
  createdAt: '2026-04-05T10:10:00',
  updatedAt: '2026-04-05T10:10:00',
  replyCount: 0,
  ...overrides,
  canReply: overrides.canReply ?? true,
  canEdit: overrides.canEdit ?? true,
  canDelete: overrides.canDelete ?? true,
});

const makePage = (content: Comment[], totalElements: number): CommentPage => ({
  content,
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    sort: { empty: true, sorted: false, unsorted: true },
    offset: 0,
    paged: true,
    unpaged: false,
  },
  totalPages: 1,
  totalElements,
  size: 10,
  number: 0,
  sort: { empty: true, sorted: false, unsorted: true },
  first: true,
  last: true,
  numberOfElements: content.length,
  empty: content.length === 0,
});

describe('diary edit access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {});
  });

  it('하단 아이콘과 메뉴 공유가 같은 처리 잠금을 사용한다', async () => {
    const shareResult = new Promise<void>(() => {});
    const share = vi.fn(() => shareResult);
    vi.stubGlobal('navigator', { share });
    render(<DiaryDetailModal diary={diary} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '일기 공유' }));
    expect(share).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '더보기' }));
    fireEvent.click(screen.getByRole('button', { name: '공유 닫기' }));
    const menuButton = screen.getByRole('button', { name: '일기 메뉴' });
    fireEvent.click(menuButton);
    fireEvent.click(await screen.findByRole('button', { name: '공유하기' }));

    expect(share).toHaveBeenCalledOnce();
  });

  it('PRIVATE 일기는 아이콘과 메뉴에서 공유를 숨긴다', async () => {
    render(<DiaryDetailModal diary={{ ...diary, status: 'PRIVATE' }} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '일기 공유' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '일기 메뉴' }));
    expect(screen.queryByRole('button', { name: '공유하기' })).not.toBeInTheDocument();
  });

  it('exposes the diary edit page route file', () => {
    const routePath = path.resolve(
      process.cwd(),
      'app/diary/[id]/edit/page.tsx',
    );

    expect(existsSync(routePath)).toBe(true);
  });

  it('shows an edit action in the diary owner menu', async () => {
    const { container } = render(
      <DiaryDetailModal diary={diary} onClose={vi.fn()} />,
    );

    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText('일기 삭제')).toBeInTheDocument();
    });
    expect(screen.getByText('일기 수정')).toBeInTheDocument();
  });

  it('opens the diary edit page from the diary owner menu', async () => {
    const { container } = render(
      <DiaryDetailModal diary={diary} onClose={vi.fn()} />,
    );

    fireEvent.click(container.querySelectorAll('button')[1]);
    fireEvent.click(await screen.findByText('일기 수정'));

    expect(mockPush).toHaveBeenCalledWith('/diary/1/edit');
  });

  it('does not show an edit action to non-owners', async () => {
    const { container } = render(
      <DiaryDetailModal
        diary={{ ...diary, userId: 'another-user', isOwner: false }}
        onClose={vi.fn()}
      />,
    );

    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '공유하기' }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('일기 수정')).not.toBeInTheDocument();
    expect(screen.queryByText('일기 삭제')).not.toBeInTheDocument();
  });

  it('긴 일기 본문에서도 작성자 아바타가 flex 수축 대상이 되지 않는다', async () => {
    render(
      <DiaryDetailModal
        diary={{
          ...diary,
          content:
            '갑작스레 테스트로부터 저녁먹자는 연락이 왔다. '.repeat(20),
        }}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(getRootComments).toHaveBeenCalledWith(1, 0, 10);
    });

    const authorAvatars = screen.getAllByRole('img', { name: 'tester' });

    expect(authorAvatars.length).toBeGreaterThan(0);
    authorAvatars.forEach(avatar => {
      expect(avatar).toHaveClass('flex-shrink-0', 'h-8', 'w-8');
    });
  });

  it('초기 댓글 목록 조회의 루트 댓글 수로 부모 댓글 수를 덮어쓰지 않는다', async () => {
    vi.mocked(getRootComments).mockResolvedValueOnce(makePage([], 2));
    const onCommentCountChange = vi.fn();

    render(
      <DiaryDetailModal
        diary={{ ...diary, commentCount: 5 }}
        onClose={vi.fn()}
        onCommentCountChange={onCommentCountChange}
      />,
    );

    await waitFor(() => {
      expect(getRootComments).toHaveBeenCalledWith(1, 0, 10);
    });
    expect(onCommentCountChange).not.toHaveBeenCalled();
  });

  it('좋아요 성공 시 부모 피드에 변경된 좋아요 상태를 알린다', async () => {
    vi.mocked(addLike).mockResolvedValue({
      diaryId: 1,
      likeCount: 1,
      isLiked: true,
    });
    const onLikeChange = vi.fn();
    const { container } = render(
      <DiaryDetailModal
        diary={{ ...diary, userId: 'writer-id', isOwner: false }}
        onClose={vi.fn()}
        onLikeChange={onLikeChange}
      />,
    );

    fireEvent.click(container.querySelectorAll('button')[2]);

    await waitFor(() => {
      expect(addLike).toHaveBeenCalledWith(1);
      expect(onLikeChange).toHaveBeenCalledWith(1, {
        likeCount: 1,
        isLiked: true,
      });
    });
  });

  it('댓글 삭제 실패 시 부모 댓글 수를 원래 값으로 되돌린다', async () => {
    vi.mocked(getRootComments).mockResolvedValueOnce(
      makePage([makeComment()], 1),
    );
    vi.mocked(deleteComment).mockRejectedValueOnce(new Error('delete failed'));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onCommentCountChange = vi.fn();

    render(
      <DiaryDetailModal
        diary={{ ...diary, commentCount: 1 }}
        onClose={vi.fn()}
        onCommentCountChange={onCommentCountChange}
      />,
    );

    fireEvent.click(await screen.findByTestId('delete-comment-10'));

    await waitFor(() => {
      expect(deleteComment).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(onCommentCountChange).toHaveBeenLastCalledWith(1, 1);
    });
  });
});
