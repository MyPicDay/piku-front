import { expect, test, type Page } from '@playwright/test';

type ShareHarness = {
  shareMode: 'deny' | 'abort' | 'success';
  copyMode: 'deny' | 'pending' | 'success';
  shares: ShareData[];
  copies: string[];
  settleCopy?: (succeed: boolean) => void;
};

declare global {
  interface Window {
    diaryShareHarness: ShareHarness;
  }
}

const diaryUrl = 'http://127.0.0.1:3000/diary/42';
const mockUser = {
  id: 'share-tester',
  email: 'share@example.test',
  nickname: '공유 테스트',
  avatar: '/globe.svg',
};

const prepareDiary = async (
  page: Page,
  status: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' = 'PUBLIC',
) => {
  await page.addInitScript(user => {
    localStorage.setItem('am', 'test-token');
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { isLoggedIn: true, user }, version: 0 }),
    );
    const harness: ShareHarness = {
      shareMode: 'deny', copyMode: 'deny', shares: [], copies: [],
    };
    window.diaryShareHarness = harness;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        harness.shares.push(data);
        if (harness.shareMode === 'success') return Promise.resolve();
        return Promise.reject(new DOMException(
          '공유 대역', harness.shareMode === 'abort' ? 'AbortError' : 'NotAllowedError',
        ));
      },
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (url: string) => {
          harness.copies.push(url);
          if (harness.copyMode === 'success') return Promise.resolve();
          if (harness.copyMode === 'pending') {
            return new Promise<void>((resolve, reject) => {
              harness.settleCopy = succeed => succeed
                ? resolve()
                : reject(new DOMException('복사 대역', 'NotAllowedError'));
            });
          }
          return Promise.reject(new DOMException('복사 대역', 'NotAllowedError'));
        },
      },
    });
  }, mockUser);

  const diary = {
    diaryId: 42, status, content: '공유할 일기의 본문',
    imgUrls: ['/globe.svg'], date: '2026-09-06',
    createdAt: '2026-09-06T09:00:00', nickname: mockUser.nickname,
    avatar: mockUser.avatar, userId: mockUser.id, commentCount: 0,
    likeCount: 3, isLiked: false, friendStatus: 'NONE', isOwner: true,
  };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const body = path === '/api/diary'
      ? { items: [diary], nextCursor: null, hasNext: false }
      : path === '/api/diary/42'
        ? diary
        : { content: [], items: [], last: true, hasNext: false, totalElements: 0 };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
};

const calls = (page: Page) => page.evaluate(() => ({
  shares: window.diaryShareHarness.shares,
  copies: window.diaryShareHarness.copies,
}));

test('직접 상세의 복사 패널은 재복사 중 포커스와 실행 잠금을 유지한다', async ({ page }) => {
  await prepareDiary(page);
  await page.goto('/diary/42?from=notification#detail');
  const share = page.getByRole('button', { name: '일기 공유', exact: true });
  await share.click();

  const panel = page.getByRole('region', { name: '공유 링크 직접 복사' });
  const field = panel.getByRole('textbox', { name: '공유 링크' });
  await expect(field).toHaveValue(diaryUrl);
  await expect(field).toBeFocused();
  expect(await field.evaluate((input: HTMLInputElement) => [input.selectionStart, input.selectionEnd]))
    .toEqual([0, diaryUrl.length]);
  expect(await calls(page)).toEqual({
    shares: [{ title: 'PikUme 일기', text: 'PikUme에서 일기를 확인해 보세요.', url: diaryUrl }],
    copies: [diaryUrl],
  });

  await page.evaluate(() => { window.diaryShareHarness.copyMode = 'pending'; });
  const retry = panel.getByRole('button', { name: '링크 복사', exact: true });
  await retry.click();
  await expect(panel).toBeVisible();
  await expect(retry).toBeDisabled();
  await expect(retry).toBeFocused();
  await page.keyboard.press('Enter');
  expect((await calls(page)).copies).toEqual([diaryUrl, diaryUrl]);
  await expect(page.getByText('링크를 복사했어요.', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(share).toBeFocused();
  await expect(share).toBeDisabled();
  await page.keyboard.press('Enter');
  expect((await calls(page)).copies).toEqual([diaryUrl, diaryUrl]);
  expect((await calls(page)).shares).toHaveLength(1);

  await page.evaluate(() => { window.diaryShareHarness.settleCopy?.(false); });
  await expect(share).toBeEnabled();
  await expect(panel).toHaveCount(0);
  await page.evaluate(() => { window.diaryShareHarness.copyMode = 'deny'; });
  await share.click();
  await expect(panel).toBeVisible();
  await page.evaluate(() => { window.diaryShareHarness.copyMode = 'pending'; });
  await retry.click();
  await page.evaluate(() => { window.diaryShareHarness.settleCopy?.(true); });
  await expect(page.getByText('링크를 복사했어요.', { exact: true })).toBeVisible();
  await expect(panel).toHaveCount(0);
});

test('시스템 공유 취소는 클립보드 쓰기나 수동 패널을 만들지 않는다', async ({ page }) => {
  await prepareDiary(page);
  await page.goto('/diary/42');
  await page.evaluate(() => { window.diaryShareHarness.shareMode = 'abort'; });
  const share = page.getByRole('button', { name: '일기 공유', exact: true });
  await share.click();
  await expect(share).toBeEnabled();
  expect((await calls(page)).shares).toHaveLength(1);
  expect((await calls(page)).copies).toEqual([]);
  await expect(page.getByRole('region', { name: '공유 링크 직접 복사' })).toHaveCount(0);
});

test('데스크톱 모달 메뉴는 같은 URL을 공유하고 아이콘으로 포커스를 돌린다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepareDiary(page);
  await page.goto('/feed');
  await page.getByTestId('feed-card').getByRole('img', { name: 'Diary image', exact: true }).click();
  await page.getByRole('button', { name: '일기 메뉴', exact: true }).click();
  await page.getByRole('button', { name: '공유하기', exact: true }).click();
  const panel = page.getByRole('region', { name: '공유 링크 직접 복사' });
  await expect(panel.getByRole('textbox', { name: '공유 링크' })).toHaveValue(diaryUrl);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('button', { name: '일기 공유', exact: true }).last()).toBeFocused();
  await expect(page.getByRole('button', { name: '일기 메뉴', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/feed$/);
});

test('360px 친구 공개 스토리는 공유 패널과 액션이 겹치지 않고 댓글에서 숨겨진다', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await prepareDiary(page, 'FRIENDS');
  await page.goto('/feed');
  await page.getByTestId('feed-card').getByRole('img', { name: 'Diary image', exact: true }).click();
  const rail = page.getByTestId('story-action-rail');
  const share = rail.getByRole('button', { name: '일기 공유', exact: true });
  await expect(share).toHaveAccessibleDescription('작성자의 친구만 볼 수 있는 일기예요.');
  await share.click();
  const panel = page.getByRole('region', { name: '공유 링크 직접 복사' });
  await expect(panel.getByRole('textbox', { name: '공유 링크' })).toHaveValue(diaryUrl);
  const panelBox = await panel.boundingBox();
  const railBox = await rail.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(railBox!.x);
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(784);
  await rail.getByRole('button', { name: '댓글' }).click();
  await expect(rail).toHaveCount(0);
  await expect(panel).toHaveCount(0);
});

test('작성자의 비공개 일기는 공유 버튼을 숨긴다', async ({ page }) => {
  await prepareDiary(page, 'PRIVATE');
  await page.goto('/diary/42');
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.getByRole('button', { name: '일기 공유', exact: true })).toHaveCount(0);
});
