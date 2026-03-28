import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhub.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'zh-TW', 'zh-HK'];

  const staticPages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }[] = [
    { path: '', changeFrequency: 'daily', priority: 1.0 },
    { path: '/marketplace', changeFrequency: 'hourly', priority: 0.9 },
    { path: '/players', changeFrequency: 'daily', priority: 0.85 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/why-backerhub', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'monthly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'monthly', priority: 0.3 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}${page.path}`])
          ),
        },
      });
    }
  }

  // Dynamic player profile pages
  try {
    const supabase = await createClient();
    const { data: players } = await (supabase.from('profiles') as any)
      .select('id, updated_at')
      .eq('role', 'player')
      .limit(500);

    if (players && players.length > 0) {
      for (const player of players) {
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/player/${player.id}`,
            lastModified: player.updated_at
              ? new Date(player.updated_at)
              : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
            alternates: {
              languages: Object.fromEntries(
                locales.map((l) => [
                  l,
                  `${BASE_URL}/${l}/player/${player.id}`,
                ])
              ),
            },
          });
        }
      }
    }
  } catch {
    // If DB is unavailable, skip dynamic pages gracefully
  }

  return entries;
}
