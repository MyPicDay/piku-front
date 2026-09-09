import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeCalendar from '../HomeCalendar';
import type { DiaryDetail } from '@/types/diary';

const loadDiaryDetailMock = vi.fn();
const closeDiaryDetailMock = vi.fn();
const refetchMonthlyDiariesMock = vi.fn();
let selectedDiaryMock: DiaryDetail | null = null;
let currentDateMock = new Date('2026-05-15T00:00:00');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
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

vi.mock('framer-motion', async () => {
  const React = await import('react');

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({
        children,
        variants: _variants,
        custom: _custom,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
        <div {...props}>{children}</div>
      ),
    },
  };
});

vi.mock('react-responsive', () => ({
  useMediaQuery: () => true,
}));

vi.mock('@/components/store/authStore', () => ({
  default: () => ({
    user: {
      id: 'user-1',
      email: 'user@example.com',
      nickname: '픽쿠야',
      avatar: '',
    },
  }),
}));

vi.mock('@/hooks/useFriendManagement', () => ({
  useFriendManagement: () => ({
    viewedUser: undefined,
    fetchFriendStatus: vi.fn(),
    nextFriend: vi.fn(),
    prevFriend: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCalendarNavigation', () => ({
  useCalendarNavigation: () => ({
    currentDate: currentDateMock,
    setCurrentDate: vi.fn(),
    isPickerOpen: false,
    setIsPickerOpen: vi.fn(),
    direction: 'up',
    containerRef: { current: null },
    swipeHandlers: {},
  }),
}));

vi.mock('@/hooks/useDiaryData', () => ({
  useDiaryData: () => ({
    pikus: {},
    selectedDiary: selectedDiaryMock,
    isLoading: false,
    refetchMonthlyDiaries: refetchMonthlyDiariesMock,
    loadDiaryDetail: loadDiaryDetailMock,
    closeDiaryDetail: closeDiaryDetailMock,
    removeDiary: vi.fn(),
  }),
}));

vi.mock('@/hooks/useBodyScrollLock', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('@/components/calendar/PikuCalendar', () => ({
  default: ({
    imageRecoveryStatus,
    onImageError,
  }: {
    imageRecoveryStatus: string;
    onImageError: () => void;
  }) => (
    <div
      data-testid="piku-calendar"
      data-recovery-status={imageRecoveryStatus}
    >
      calendar
      <button onClick={onImageError}>이미지 오류</button>
    </div>
  ),
}));

vi.mock('@/components/diary/DiaryDetailModal', () => ({
  default: () => <div data-testid="diary-detail-modal" />,
}));

vi.mock('@/components/diary/DiaryStoryModal', () => ({
  default: () => <div data-testid="diary-story-modal" />,
}));

const diary: DiaryDetail = {
  diaryId: 1,
  content: '테스트 일기',
  date: '2026-05-15',
  status: 'PUBLIC',
  createdAt: '2026-05-15T10:00:00',
  updatedAt: '2026-05-15T10:00:00',
  isLiked: false,
  likeCount: 0,
  commentCount: 0,
  imgUrls: [],
  nickname: '픽쿠야',
  avatar: '',
  userId: 'user-1',
  isOwner: true,
  comments: [],
};

describe('HomeCalendar view switch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectedDiaryMock = null;
    currentDateMock = new Date('2026-05-15T00:00:00');
    refetchMonthlyDiariesMock.mockResolvedValue(undefined);
  });

  it('홈 캘린더는 보기 전환 없이 달력만 보여준다', () => {
    render(<HomeCalendar />);

    expect(screen.getByTestId('piku-calendar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '26년 5월' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '달력' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모아보기' })).not.toBeInTheDocument();
  });

  it('다른 사용자 프로필을 보는 중에도 홈 캘린더에는 보기 전환을 표시하지 않는다', () => {
    render(
      <HomeCalendar
        viewedUser={{
          userId: 'friend-1',
          nickname: '친구',
          avatar: '',
        }}
      />,
    );

    expect(screen.getByTestId('piku-calendar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '달력' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모아보기' })).not.toBeInTheDocument();
  });

  it('선택한 일기가 있으면 캘린더 상세 모달을 보여준다', () => {
    selectedDiaryMock = diary;

    render(<HomeCalendar />);

    expect(screen.getByTestId('diary-detail-modal')).toBeInTheDocument();
  });

  it('공유 계층에서 상세 history로 복귀하면 상세를 유지하고 그 아래로 이동할 때만 닫는다', () => {
    selectedDiaryMock = diary;
    render(<HomeCalendar />);

    fireEvent.popState(window, { state: window.history.state });
    expect(closeDiaryDetailMock).not.toHaveBeenCalled();

    fireEvent.popState(window, { state: null });
    expect(closeDiaryDetailMock).toHaveBeenCalledOnce();
  });

  it('상세를 닫고 다시 연 뒤 이전 상세 history로 돌아가면 현재 상세를 닫는다', () => {
    selectedDiaryMock = diary;
    const { rerender } = render(<HomeCalendar />);
    const previousDetailState = window.history.state;
    selectedDiaryMock = null;
    rerender(<HomeCalendar />);
    selectedDiaryMock = diary;
    rerender(<HomeCalendar />);

    fireEvent.popState(window, { state: previousDetailState });
    expect(closeDiaryDetailMock).toHaveBeenCalledOnce();
  });

  it('같은 사용자와 연월의 여러 이미지 오류를 한 번의 재조회로 합친다', async () => {
    let resolveRefetch: (() => void) | undefined;
    refetchMonthlyDiariesMock.mockReturnValue(
      new Promise<void>(resolve => {
        resolveRefetch = resolve;
      }),
    );

    render(<HomeCalendar />);

    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));
    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));
    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));

    expect(refetchMonthlyDiariesMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
      'data-recovery-status',
      'recovering',
    );

    resolveRefetch?.();

    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'exhausted',
      );
    });
  });

  it('월별 재조회가 실패해도 복구 상태를 최종 실패로 수렴시킨다', async () => {
    refetchMonthlyDiariesMock.mockRejectedValue(
      new Error('monthly diary failure'),
    );

    render(<HomeCalendar />);

    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));

    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'exhausted',
      );
    });
    expect(refetchMonthlyDiariesMock).toHaveBeenCalledTimes(1);
  });

  it('표시 연월이 바뀌면 이미지 복구 기회를 다시 부여한다', async () => {
    const { rerender } = render(<HomeCalendar />);

    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));

    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'exhausted',
      );
    });

    currentDateMock = new Date('2026-06-15T00:00:00');
    rerender(<HomeCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'idle',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));

    expect(refetchMonthlyDiariesMock).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'exhausted',
      );
    });
  });

  it('조회 대상 사용자가 바뀌면 이미지 복구 기회를 다시 부여한다', async () => {
    const { rerender } = render(
      <HomeCalendar
        viewedUser={{
          userId: 'friend-1',
          nickname: '친구 1',
          avatar: '',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));

    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'exhausted',
      );
    });

    rerender(
      <HomeCalendar
        viewedUser={{
          userId: 'friend-2',
          nickname: '친구 2',
          avatar: '',
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'idle',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '이미지 오류' }));

    expect(refetchMonthlyDiariesMock).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.getByTestId('piku-calendar')).toHaveAttribute(
        'data-recovery-status',
        'exhausted',
      );
    });
  });
});
