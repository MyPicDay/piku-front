import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FeedCard from '../FeedCard';
import { createComment } from '@/lib/api/comment';
import { cancelFriendRequest, sendFriendRequest } from '@/lib/api/friend';
import useAuthStore from '@/components/store/authStore';
import { FriendshipStatus } from '@/types/friend';
import type { FeedDiary } from '@/types/diary';
import type { ComponentProps } from 'react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => <img {...props} />,
}));

vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({}),
}));

vi.mock('@/lib/api/comment', () => ({
  createComment: vi.fn(),
}));

vi.mock('@/lib/api/friend', () => ({
  cancelFriendRequest: vi.fn(),
  deleteFriend: vi.fn(),
  sendFriendRequest: vi.fn(),
}));

const makePost = (overrides: Partial<FeedDiary> = {}): FeedDiary => ({
  diaryId: 1,
  status: 'PUBLIC',
  content: '피드 일기',
  imgUrls: ['https://example.com/image.png'],
  date: '2026-05-24',
  nickname: 'writer',
  avatar: '',
  userId: 'writer-id',
  createdAt: '2026-05-24T00:00:00',
  commentCount: 4,
  likeCount: 0,
  isLiked: false,
  friendStatus: FriendshipStatus.NONE,
  isOwner: false,
  ...overrides,
});

const renderFeedCard = (
  post: FeedDiary,
  overrides: Partial<ComponentProps<typeof FeedCard>> = {},
) => {
  const props: ComponentProps<typeof FeedCard> = {
    post,
    onFriendshipStatusChange: vi.fn(),
    onContentClick: vi.fn(),
    onCommentClick: vi.fn(),
    onLikeToggle: vi.fn(),
    isMobile: false,
    ...overrides,
  };

  return {
    ...render(<FeedCard {...props} />),
    props,
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FeedCard diary share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAuthStore.setState({
        authStatus: 'authenticated',
        isLoggedIn: true,
        user: null,
      });
    });
  });

  it.each(['PUBLIC', 'ANONYMOUS', 'FRIENDS'] as const)(
    '%s 일기는 사진 없이도 공유하고 카드 상세를 열지 않는다',
    status => {
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { share });
      const { props } = renderFeedCard(makePost({ status, imgUrls: [] }));

      fireEvent.click(screen.getByRole('button', { name: '일기 공유' }));
      expect(share).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: '일기 공유' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '더보기' }));

      expect(share).toHaveBeenCalledWith({
        title: 'PikUme 일기',
        text: 'PikUme에서 일기를 확인해 보세요.',
        url: 'https://www.pikume.com/diary/1',
      });
      expect(props.onContentClick).not.toHaveBeenCalled();
    },
  );

  it('PRIVATE 일기에는 공유 버튼을 표시하지 않는다', () => {
    renderFeedCard(makePost({ status: 'PRIVATE' }));
    expect(screen.queryByRole('button', { name: '일기 공유' })).not.toBeInTheDocument();
  });
});

describe('FeedCard comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAuthStore.setState({
        authStatus: 'authenticated',
        isLoggedIn: true,
        user: {
          id: 'viewer-id',
          email: 'viewer@example.com',
          nickname: 'viewer',
          avatar: '',
        },
      });
    });
  });

  it('직접 댓글 작성 성공 시 부모 피드에 댓글 생성을 알린다', async () => {
    const onCommentCreated = vi.fn();
    vi.mocked(createComment).mockResolvedValue({
      id: 10,
      content: '새 댓글',
      createdAt: '2026-05-24T10:00:00',
    });

    render(
      <FeedCard
        post={makePost()}
        onFriendshipStatusChange={vi.fn()}
        onContentClick={vi.fn()}
        onCommentClick={vi.fn()}
        onLikeToggle={vi.fn()}
        onCommentCreated={onCommentCreated}
        isMobile={false}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: '  새 댓글  ' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '게시' }));
    });

    await waitFor(() => {
      expect(createComment).toHaveBeenCalledWith({
        diaryId: 1,
        content: '새 댓글',
      });
      expect(onCommentCreated).toHaveBeenCalledWith(1);
    });
  });

  it('친구 추가 버튼을 반복 클릭해도 친구 요청은 한 번만 보낸다', () => {
    const onFriendshipStatusChange = vi.fn();
    vi.mocked(sendFriendRequest).mockReturnValue(new Promise(() => {}));

    render(
      <FeedCard
        post={makePost()}
        onFriendshipStatusChange={onFriendshipStatusChange}
        onContentClick={vi.fn()}
        onCommentClick={vi.fn()}
        onLikeToggle={vi.fn()}
        isMobile={false}
      />,
    );

    const addFriendButton = screen.getByRole('button', { name: '친구 추가' });

    fireEvent.click(addFriendButton);
    fireEvent.click(addFriendButton);

    expect(screen.getByLabelText('친구 요청 처리 중')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '요청 취소' }),
    ).not.toBeInTheDocument();
    expect(sendFriendRequest).toHaveBeenCalledTimes(1);
    expect(sendFriendRequest).toHaveBeenCalledWith('writer-id');
  });

  it('친구 요청 성공 시 부모 피드에 SENT 상태를 알린다', async () => {
    const onFriendshipStatusChange = vi.fn();
    vi.mocked(sendFriendRequest).mockResolvedValue({
      isAccepted: false,
      message: '친구 요청을 보냈습니다.',
    });

    render(
      <FeedCard
        post={makePost()}
        onFriendshipStatusChange={onFriendshipStatusChange}
        onContentClick={vi.fn()}
        onCommentClick={vi.fn()}
        onLikeToggle={vi.fn()}
        isMobile={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '친구 추가' }));

    await waitFor(() => {
      expect(onFriendshipStatusChange).toHaveBeenCalledWith(
        1,
        FriendshipStatus.SENT,
      );
    });
  });

  it('친구 요청 취소 처리 중에도 버튼의 접근 가능한 이름을 유지한다', () => {
    vi.mocked(cancelFriendRequest).mockReturnValue(new Promise(() => {}));

    render(
      <FeedCard
        post={makePost({ friendStatus: FriendshipStatus.SENT })}
        onFriendshipStatusChange={vi.fn()}
        onContentClick={vi.fn()}
        onCommentClick={vi.fn()}
        onLikeToggle={vi.fn()}
        isMobile={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '요청 취소' }));
    fireEvent.click(screen.getAllByRole('button', { name: '요청 취소' })[1]);

    expect(
      screen.getByLabelText('친구 요청 취소 처리 중'),
    ).toBeInTheDocument();
  });

  it('익명 일기는 작성자 프로필 링크와 친구 액션을 노출하지 않는다', () => {
    render(
      <FeedCard
        post={makePost({
          status: 'ANONYMOUS',
          nickname: '익명',
          avatar: null,
          userId: null,
          friendStatus: FriendshipStatus.ANONYMOUS,
          isOwner: false,
        })}
        onFriendshipStatusChange={vi.fn()}
        onContentClick={vi.fn()}
        onCommentClick={vi.fn()}
        onLikeToggle={vi.fn()}
        isMobile={false}
      />,
    );

    expect(screen.getAllByText('익명')).not.toHaveLength(0);
    expect(
      screen.getByRole('img', { name: '익명 프로필 아이콘' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '친구 추가' })).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/profile/null"]')).not.toBeInTheDocument();
  });
});

describe('FeedCard 사진 없는 일기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAuthStore.setState({
        authStatus: 'authenticated',
        isLoggedIn: true,
        user: {
          id: 'viewer-id',
          email: 'viewer@example.com',
          nickname: 'viewer',
          avatar: '',
        },
      });
    });
  });

  it('사진이 없으면 이미지 대신 텍스트 본문을 표시한다', () => {
    renderFeedCard(
      makePost({
        imgUrls: [],
        content: '사진 없이 남기는 오늘의 기록',
      }),
    );

    expect(
      screen.queryByRole('img', { name: 'Diary image' }),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('img[src="https://via.placeholder.com/600"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('오늘의 일기')).toBeInTheDocument();
    expect(
      screen.getByText('사진 없이 남기는 오늘의 기록'),
    ).toBeInTheDocument();
  });

  it('사진 없는 본문에서 일기 상세 보기를 선택할 수 있다', () => {
    const onContentClick = vi.fn();
    renderFeedCard(makePost({ imgUrls: [] }), { onContentClick });

    const detailButton = screen.getByRole('button', {
      name: '일기 상세 보기',
    });
    expect(detailButton).toHaveAccessibleDescription('피드 일기');

    fireEvent.click(detailButton);

    expect(onContentClick).toHaveBeenCalledTimes(1);
  });

  it('사진이 있으면 기존 이미지 카드를 유지한다', () => {
    renderFeedCard(
      makePost({ imgUrls: ['https://example.com/original.png'] }),
    );

    expect(screen.getByRole('img', { name: 'Diary image' })).toHaveAttribute(
      'src',
      'https://example.com/original.png',
    );
    expect(screen.queryByText('오늘의 일기')).not.toBeInTheDocument();
  });

  it('사진이 여러 장이면 기존 캐러셀로 다음 사진을 표시한다', () => {
    const { container } = renderFeedCard(
      makePost({
        imgUrls: [
          'https://example.com/first.png',
          'https://example.com/second.png',
        ],
      }),
    );

    expect(screen.getByRole('img', { name: 'Diary image' })).toHaveAttribute(
      'src',
      'https://example.com/first.png',
    );

    const nextImageButton = container.querySelector('button.right-2');
    expect(nextImageButton).toBeInstanceOf(HTMLButtonElement);
    fireEvent.click(nextImageButton as HTMLButtonElement);

    expect(screen.getByRole('img', { name: 'Diary image' })).toHaveAttribute(
      'src',
      'https://example.com/second.png',
    );
  });

  it('사진이 있는 일기는 기존처럼 30자를 넘으면 본문을 펼친다', () => {
    const content = '가'.repeat(31);
    renderFeedCard(makePost({ content }));

    fireEvent.click(screen.getByRole('button', { name: '더 보기' }));

    expect(
      screen.queryByRole('button', { name: '더 보기' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(content).closest('p')).toHaveClass(
      'whitespace-pre-wrap',
    );
  });

  it('100자를 넘는 본문을 더 보기로 카드 안에서 펼친다', () => {
    const longContent = '가'.repeat(101);
    const onContentClick = vi.fn();
    renderFeedCard(makePost({ imgUrls: [], content: longContent }), {
      onContentClick,
    });

    const content = screen.getByText(longContent);
    const detailButton = screen.getByRole('button', {
      name: '일기 상세 보기',
    });
    const moreButton = screen.getByRole('button', { name: '더 보기' });
    expect(content).toHaveClass('text-[15px]', 'line-clamp-5');
    expect(content).not.toHaveClass('block');
    expect(moreButton).toHaveAttribute(
      'aria-controls',
      'feed-text-content-1',
    );
    expect(moreButton).toHaveAttribute('aria-expanded', 'false');

    moreButton.focus();
    fireEvent.click(moreButton);

    expect(onContentClick).not.toHaveBeenCalled();
    expect(detailButton).toHaveFocus();
    expect(
      screen.queryByRole('button', { name: '더 보기' }),
    ).not.toBeInTheDocument();
    expect(content).not.toHaveClass('line-clamp-5');
    expect(content).toHaveClass('block');
    expect(
      screen.getByRole('status', {
        name: '일기 전체 내용이 펼쳐졌습니다.',
      }),
    ).toBeInTheDocument();
  });

  it('사진 없는 일기의 더 보기 버튼에 최소 터치 높이를 제공한다', () => {
    renderFeedCard(makePost({ imgUrls: [], content: '가'.repeat(101) }));

    expect(screen.getByRole('button', { name: '더 보기' })).toHaveClass(
      'min-h-8',
    );
  });

  it('100자 이하여도 개행으로 여섯 줄이면 더 보기를 표시한다', () => {
    const multilineContent = '첫째\n둘째\n셋째\n넷째\n다섯째\n여섯째';
    renderFeedCard(makePost({ imgUrls: [], content: multilineContent }));

    expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
  });

  it('100자 이하이고 다섯 줄 이하인 본문에는 더 보기를 표시하지 않는다', () => {
    const contentText = [
      '가'.repeat(20),
      '나'.repeat(19),
      '다'.repeat(19),
      '라'.repeat(19),
      '마'.repeat(19),
    ].join('\n');
    renderFeedCard(makePost({ imgUrls: [], content: contentText }));

    expect(
      screen.queryByRole('button', { name: '더 보기' }),
    ).not.toBeInTheDocument();
  });
});
