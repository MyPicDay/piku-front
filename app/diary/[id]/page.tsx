import DiaryDetailClient from '@/components/diary/DiaryDetailClient';
import { createPageMetadata } from '@/lib/metadata/createPageMetadata';
import {
  DIARY_SHARE_TEXT,
  DIARY_SHARE_TITLE,
  getDiaryShareOrigin,
} from '@/lib/utils/diaryShare';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type DiaryPageProps = { params: Promise<{ id: string }> };

const parseDiaryId = (id: string) => {
  const diaryId = Number(id);
  if (!Number.isSafeInteger(diaryId) || diaryId <= 0) {
    notFound();
  }
  return diaryId;
};

export const generateMetadata = async ({
  params,
}: DiaryPageProps): Promise<Metadata> => {
  const diaryId = parseDiaryId((await params).id);
  const origin = getDiaryShareOrigin();
  if (!origin) throw new Error('NEXT_PUBLIC_BASE_URL must be an HTTP(S) website URL.');

  return {
    ...createPageMetadata({
      title: DIARY_SHARE_TITLE,
      description: DIARY_SHARE_TEXT,
      path: `/diary/${diaryId}`,
    }),
    metadataBase: new URL(origin),
    title: { absolute: DIARY_SHARE_TITLE },
  };
};

const DiaryDetailPage = async ({ params }: DiaryPageProps) => {
  const diaryId = parseDiaryId((await params).id);

  return <DiaryDetailClient diaryId={diaryId} />;
};

export default DiaryDetailPage;
