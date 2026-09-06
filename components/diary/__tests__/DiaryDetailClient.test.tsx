import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDiary, getDiaryById } from '@/lib/api/diary';
import type { DiaryDetail } from '@/types/diary';
import { sendFriendRequest } from '@/lib/api/friend';
import { FriendshipStatus } from '@/types/friend';
import DiaryDetailClient from '../DiaryDetailClient';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

vi.mock('react-responsive', () => ({
  useMediaQuery: () => false,
}));

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock('@/lib/api/diary', () => ({
  getDiaryById: vi.fn(),
  deleteDiary: vi.fn(),
}));

vi.mock('@/lib/api/comment', () => ({
  createComment: vi.fn(),
  getRootComments: vi.fn(),
}));

vi.mock('@/lib/api/friend', () => ({
  sendFriendRequest: vi.fn(),
}));

vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('swiper/modules', () => ({
  Pagination: {},
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('../DiaryDetailModal', () => ({
  default: () => null,
}));

vi.mock('../CommentModal', () => ({
  default: () => null,
}));

vi.mock('@/components/feed/ProfileHoverCard', () => ({
  default: ({ nickname }: { nickname: string }) => (
    <div data-testid="profile-hover-card">{nickname} 프로필 카드</div>
  ),
}));

let authState: { user: { id: string } | null; isLoggedIn: boolean } = {
  user: null,
  isLoggedIn: false,
};

vi.mock('../../store/authStore', () => ({
  default: () => authState,
}));

const diary: DiaryDetail = {
  diaryId: 42,
  content: '오늘의 일기',
  date: '2026-06-04',
  status: 'PUBLIC',
  createdAt: '2026-06-04T00:00:00',
  updatedAt: '2026-06-04T00:00:00',
  isLiked: false,
  likeCount: 3,
  commentCount: 2,
  imgUrls: ['https://example.com/diary.jpg'],
  nickname: '피쿠',
  avatar: '',
  userId: 'owner-id',
  isOwner: true,
  comments: [],
};

describe('DiaryDetailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { user: null, isLoggedIn: false };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('조회된 공개 일기를 카드 액션에서 공유한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    vi.mocked(getDiaryById).mockResolvedValue(diary);

    render(<DiaryDetailClient diaryId={42} />);
    fireEvent.click(await screen.findByRole('button', { name: '일기 공유' }));

    expect(share).toHaveBeenCalledWith({
      title: 'PikUme 일기',
      text: 'PikUme에서 일기를 확인해 보세요.',
      url: 'https://www.pikume.com/diary/42',
    });
  });

  it('요청 id가 바뀌면 이전에 조회한 일기의 공유 버튼을 즉시 숨긴다', async () => {
    vi.mocked(getDiaryById).mockResolvedValueOnce(diary).mockReturnValueOnce(new Promise(() => {}));
    const { rerender } = render(<DiaryDetailClient diaryId={42} />);
    expect(await screen.findByRole('button', { name: '일기 공유' })).toBeInTheDocument();

    rerender(<DiaryDetailClient diaryId={43} />);

    expect(screen.queryByRole('button', { name: '일기 공유' })).not.toBeInTheDocument();
  });

  it('PRIVATE 일기를 조회하면 공유 버튼을 표시하지 않는다', async () => {
    vi.mocked(getDiaryById).mockResolvedValue({ ...diary, status: 'PRIVATE' });
    render(<DiaryDetailClient diaryId={42} />);
    await screen.findByText('오늘의 일기');
    expect(screen.queryByRole('button', { name: '일기 공유' })).not.toBeInTheDocument();
  });

  it('일기 상세 조회 실패 시 404 이미지를 보여준다', async () => {
    vi.mocked(getDiaryById).mockRejectedValue({
      response: {
        data: {
          type: 'https://api.pikume.com/problems/diary/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: '이 일기를 볼 권한이 없습니다.',
          instance: '/api/diary/42',
        },
      },
    });

    render(<DiaryDetailClient diaryId={42} />);

    expect(
      await screen.findByRole('img', { name: '일기를 찾을 수 없습니다.' }),
    ).toHaveAttribute('src', '/404.png');
  });

  it('소유자는 더보기 메뉴에서 일기를 수정하고 삭제할 수 있다', async () => {
    authState = { user: { id: 'owner-id' }, isLoggedIn: true };
    vi.mocked(getDiaryById).mockResolvedValue(diary);
    vi.mocked(deleteDiary).mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<DiaryDetailClient diaryId={42} />);

    fireEvent.click(await screen.findByRole('button', { name: '일기 메뉴' }));

    fireEvent.click(screen.getByRole('button', { name: '일기 수정' }));
    expect(mockPush).toHaveBeenCalledWith('/diary/42/edit');

    fireEvent.click(screen.getByRole('button', { name: '일기 메뉴' }));
    fireEvent.click(screen.getByRole('button', { name: '일기 삭제' }));

    await waitFor(() => {
      expect(deleteDiary).toHaveBeenCalledWith(42);
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('소유자에게 공개범위를 보여준다', async () => {
    authState = { user: { id: 'owner-id' }, isLoggedIn: true };
    vi.mocked(getDiaryById).mockResolvedValue({ ...diary, status: 'FRIENDS' });

    render(<DiaryDetailClient diaryId={42} />);

    expect(await screen.findByText('친구 공개')).toBeInTheDocument();
  });

  it('친구관계가 아니면 친구추가 버튼으로 친구 요청을 보낸다', async () => {
    authState = { user: { id: 'viewer-id' }, isLoggedIn: true };
    vi.mocked(getDiaryById).mockResolvedValue({
      ...diary,
      userId: 'owner-id',
      friendStatus: FriendshipStatus.NONE,
      isOwner: false,
    });
    vi.mocked(sendFriendRequest).mockResolvedValue({
      isAccepted: false,
      message: '친구 요청을 보냈습니다.',
    });

    render(<DiaryDetailClient diaryId={42} />);

    const addFriendButton = await screen.findByRole('button', {
      name: '친구 추가',
    });
    fireEvent.click(addFriendButton);

    await waitFor(() => {
      expect(sendFriendRequest).toHaveBeenCalledWith('owner-id');
    });
    expect(
      screen.queryByRole('button', { name: '친구 추가' }),
    ).not.toBeInTheDocument();
  });

  it('친구 추가 버튼을 반복 클릭해도 친구 요청은 한 번만 보낸다', async () => {
    authState = { user: { id: 'viewer-id' }, isLoggedIn: true };
    vi.mocked(getDiaryById).mockResolvedValue({
      ...diary,
      userId: 'owner-id',
      friendStatus: FriendshipStatus.NONE,
      isOwner: false,
    });
    vi.mocked(sendFriendRequest).mockReturnValue(new Promise(() => {}));

    render(<DiaryDetailClient diaryId={42} />);

    const addFriendButton = await screen.findByRole('button', {
      name: '친구 추가',
    });

    fireEvent.click(addFriendButton);
    fireEvent.click(addFriendButton);

    expect(screen.getByLabelText('친구 요청 처리 중')).toBeInTheDocument();
    expect(sendFriendRequest).toHaveBeenCalledTimes(1);
    expect(sendFriendRequest).toHaveBeenCalledWith('owner-id');
  });

  it('프로필 영역을 피드처럼 가로 메타로 보여주고 hover 시 프로필 카드를 보여준다', async () => {
    authState = { user: { id: 'viewer-id' }, isLoggedIn: true };
    vi.mocked(getDiaryById).mockResolvedValue({
      ...diary,
      userId: 'owner-id',
      friendStatus: FriendshipStatus.FRIEND,
      isOwner: false,
    });

    render(<DiaryDetailClient diaryId={42} />);

    const authorMeta = await screen.findByTestId('diary-author-meta');
    expect(authorMeta).toHaveClass('flex');
    expect(authorMeta).toHaveTextContent('피쿠');
    expect(authorMeta).toHaveTextContent('2026.06.04');

    fireEvent.mouseEnter(screen.getByTestId('diary-author-profile'));

    expect(await screen.findByTestId('profile-hover-card')).toHaveTextContent(
      '피쿠 프로필 카드',
    );
  });

  it('익명 일기 상세는 isOwner로 작성자 메뉴를 판단하고 프로필 링크를 만들지 않는다', async () => {
    authState = { user: { id: 'owner-id' }, isLoggedIn: true };
    vi.mocked(getDiaryById).mockResolvedValue({
      ...diary,
      status: 'ANONYMOUS',
      nickname: '익명',
      avatar: null,
      userId: null,
      friendStatus: FriendshipStatus.ANONYMOUS,
      isOwner: true,
    } as DiaryDetail);

    render(<DiaryDetailClient diaryId={42} />);

    expect(await screen.findAllByText('익명')).not.toHaveLength(0);
    expect(
      screen.getByRole('img', { name: '익명 프로필 아이콘' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '일기 메뉴' })).toBeInTheDocument();
    expect(document.querySelector('a[href="/profile/null"]')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '친구 추가' })).not.toBeInTheDocument();
  });
});
