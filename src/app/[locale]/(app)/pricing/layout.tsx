import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhubasia.vercel.app';

const meta: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Pricing',
    description:
      'BackerHub pricing: 0% platform fee during pre-launch. Transparent cost breakdown for poker tournament staking in Asia.',
  },
  'zh-TW': {
    title: '定價',
    description:
      'BackerHub 定價：預啟動期間 0% 平台費用。亞洲撲克錦標賽質押的透明費用明細。',
  },
  'zh-HK': {
    title: '定價',
    description:
      'BackerHub 定價：預啟動期間 0% 平台費用。亞洲撲克錦標賽質押的透明費用明細。',
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
      url: `${SITE_URL}/${locale}/pricing`,
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
      canonical: `${SITE_URL}/${locale}/pricing`,
      languages: {
        en: `${SITE_URL}/en/pricing`,
        'zh-TW': `${SITE_URL}/zh-TW/pricing`,
      },
    },
  };
}

export default async function PricingLayout({
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
          { name: m.title, href: '/pricing' },
        ]}
      />
      {children}
    </>
  );
}
