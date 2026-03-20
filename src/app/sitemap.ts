import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhub.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'zh-TW'];
  const staticPages = [
    '',
    '/marketplace',
    '/players',
    '/about',
    '/how-it-works',
    '/pricing',
    '/why-backerhub',
    '/terms',
    '/contact',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : page === '/marketplace' ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
