import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhubasia.vercel.app';

const meta: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Players',
    description:
      'Discover verified poker players on BackerHub. View ROI stats, reliability scores, and tournament history before backing.',
  },
  'zh-TW': {
    title: '選手',
    description:
      '在 BackerHub 探索經驗證的撲克選手。查看 ROI 統計、可靠性評分和錦標賽歷史。',
  },
  'zh-HK': {
    title: '選手',
    description:
      '在 BackerHub 探索經驗證的撲克選手。查看 ROI 統計、可靠性評分和錦標賽歷史。',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.en;

  return {
    title: m.title,
    description: m.description,
    openGraph: {
      type: 'website',
      title: `${m.title} | BackerHub - Asia's Poker Backing Platform`,
      description: m.description,
      url: `${SITE_URL}/${locale}/players`,
      siteName: 'BackerHub',
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "BackerHub - Asia's Poker Backing Platform",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${m.title} | BackerHub`,
      description: m.description,
      images: [`${SITE_URL}/opengraph-image`],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/players`,
      languages: {
        en: `${SITE_URL}/en/players`,
        'zh-TW': `${SITE_URL}/zh-TW/players`,
      },
    },
  };
}

export default async function PlayersLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const m = meta[locale] || meta.en;

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: 'Home', href: '' },
          { name: m.title, href: '/players' },
        ]}
      />
      {children}
    </>
  );
}
