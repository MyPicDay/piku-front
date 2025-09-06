import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.piku.store';

  // 로그인이 필요없는 페이지
  const staticRoutes: string[] = [
    '',
    '/login',
    '/signup',
    '/password-reset',
  ];

  const now = new Date();

  return staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));
}



