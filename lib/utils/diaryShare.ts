export const DIARY_SHARE_TITLE = 'PikUme 일기';
export const DIARY_SHARE_TEXT = 'PikUme에서 일기를 확인해 보세요.';
const DEFAULT_DIARY_SHARE_BASE_URL = 'https://www.pikume.com';

export const getDiaryShareOrigin = (baseUrl?: string): string | null => {
  const configuredBaseUrl =
    baseUrl === undefined
      ? process.env.NEXT_PUBLIC_BASE_URL?.trim() || DEFAULT_DIARY_SHARE_BASE_URL
      : baseUrl.trim();

  try {
    const url = new URL(configuredBaseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
};

export const createDiaryShareUrl = (
  diaryId: number,
  baseUrl?: string,
): string | null => {
  if (!Number.isSafeInteger(diaryId) || diaryId <= 0) {
    return null;
  }

  const origin = getDiaryShareOrigin(baseUrl);
  return origin ? `${origin}/diary/${diaryId}` : null;
};
