import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhubasia.vercel.app';

const meta: Record<string, { title: string; description: string }> = {
  en: {
    title: 'How It Works',
    description:
      'Step-by-step guide to poker staking on BackerHub. Learn the full flow from listing to escrow settlement for backers and players.',
  },
  'zh-TW': {
    title: '如何運作',
    description:
      'BackerHub 撲克質押逐步指南。了解從列表到託管結算的完整流程，適用於贊助者和選手。',
  },
  'zh-HK': {
    title: '如何運作',
    description:
      'BackerHub 撲克質押逐步指南。了解從列表到託管結算的完整流程，適用於贊助者和選手。',
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
      url: `${SITE_URL}/${locale}/how-it-works`,
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
      canonical: `${SITE_URL}/${locale}/how-it-works`,
      languages: {
        en: `${SITE_URL}/en/how-it-works`,
        'zh-TW': `${SITE_URL}/zh-TW/how-it-works`,
      },
    },
  };
}

export default async function HowItWorksLayout({
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
          { name: m.title, href: '/how-it-works' },
        ]}
      />
      {children}
    </>
  );
}
