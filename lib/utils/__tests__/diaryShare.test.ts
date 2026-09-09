import { describe, expect, it } from 'vitest';
import {
  createDiaryShareUrl,
  getDiaryShareOrigin,
} from '../diaryShare';

describe('getDiaryShareOrigin', () => {
  it.each([
    ['https://preview.example/path?token=x#y', 'https://preview.example'],
    ['http://localhost:3000/feed/', 'http://localhost:3000'],
  ])('%s의 HTTP(S) origin만 남긴다', (baseUrl, expected) => {
    expect(getDiaryShareOrigin(baseUrl)).toBe(expected);
  });

  it.each(['ftp://example.com', 'mailto:test@example.com', 'not-a-url']) (
    'HTTP(S)가 아닌 기준 주소 %s를 거절한다',
    baseUrl => {
      expect(getDiaryShareOrigin(baseUrl)).toBeNull();
    },
  );
});

describe('createDiaryShareUrl', () => {
  it('기준 주소의 경로, 쿼리, 해시를 버리고 일기 상세 URL을 만든다', () => {
    expect(
      createDiaryShareUrl(42, 'https://preview.example/path?token=x#y'),
    ).toBe('https://preview.example/diary/42');
  });

  it.each([0, -1, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    '유효하지 않은 일기 식별자 %s를 거절한다',
    diaryId => {
      expect(createDiaryShareUrl(diaryId, 'https://example.com')).toBeNull();
    },
  );

  it('기준 주소가 없으면 운영 사이트 주소를 사용한다', () => {
    expect(createDiaryShareUrl(42)).toBe('https://www.pikume.com/diary/42');
  });
});
