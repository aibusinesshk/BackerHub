import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhubasia.vercel.app';

const meta: Record<string, { title: string; description: string }> = {
  en: {
    title: 'Marketplace',
    description:
      'Browse poker tournament staking listings on BackerHub. Find verified players, compare markups, and invest in Asia poker tournaments.',
  },
  'zh-TW': {
    title: '市場',
    description:
      '瀏覽 BackerHub 撲克錦標賽質押列表。尋找經驗證的選手、比較加價，投資亞洲撲克錦標賽。',
  },
  'zh-HK': {
    title: '市場',
    description:
      '瀏覽 BackerHub 撲克錦標賽質押列表。尋找經驗證的選手、比較加價，投資亞洲撲克錦標賽。',
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
      url: `${SITE_URL}/${locale}/marketplace`,
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
      canonical: `${SITE_URL}/${locale}/marketplace`,
      languages: {
        en: `${SITE_URL}/en/marketplace`,
        'zh-TW': `${SITE_URL}/zh-TW/marketplace`,
      },
    },
  };
}

export default async function MarketplaceLayout({
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
          { name: m.title, href: '/marketplace' },
        ]}
      />
      {children}
    </>
  );
}
