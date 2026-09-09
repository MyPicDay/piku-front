import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeedSkeleton from '../FeedSkeleton';

describe('FeedSkeleton', () => {
  it('요청한 개수의 장식용 카드를 로딩 상태 안에 표시한다', () => {
    render(<FeedSkeleton count={2} />);

    const loadingStatus = screen.getByRole('status', {
      name: '피드를 불러오는 중',
    });
    const skeletonCards = within(loadingStatus).getAllByTestId(
      'feed-skeleton-card',
    );
    const assistiveLabel = within(loadingStatus).getByText(
      '피드를 불러오는 중',
    );

    expect(skeletonCards).toHaveLength(2);
    expect(assistiveLabel).toHaveClass('sr-only');
    expect(loadingStatus).not.toHaveAttribute('aria-busy');
    skeletonCards.forEach(card => {
      expect(card).toHaveAttribute('aria-hidden', 'true');
      const actionPlaceholders = card.querySelectorAll('[data-testid="feed-skeleton-action"]');
      expect(actionPlaceholders).toHaveLength(3);
      actionPlaceholders.forEach(action => expect(action).toHaveClass('h-11'));
    });
  });
});
