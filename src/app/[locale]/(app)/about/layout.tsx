import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FAQPageJsonLd } from '@/components/seo/json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhubasia.vercel.app';

const meta: Record<string, { title: string; description: string }> = {
  en: {
    title: 'About',
    description:
      "Learn about BackerHub, Asia's premier poker staking platform. Meet our team, our mission, and how we connect backers with players.",
  },
  'zh-TW': {
    title: '關於我們',
    description:
      '了解 BackerHub——亞洲首選撲克質押平台。認識我們的團隊、使命，以及如何連接贊助者與選手。',
  },
  'zh-HK': {
    title: '關於我們',
    description:
      '了解 BackerHub——亞洲首選撲克質押平台。認識我們的團隊、使命，以及如何連接贊助者與選手。',
  },
};

// Static FAQ data for JSON-LD (English for schema.org)
const faqItems = [
  {
    question: 'What is poker staking?',
    answer:
      'Poker staking is when a backer buys a percentage of a poker player\'s tournament entry. If the player wins, the backer receives their proportional share of the prize.',
  },
  {
    question: 'How do I start backing players?',
    answer:
      'Create a free account, verify your identity, deposit funds, then browse the marketplace for players and tournaments that match your criteria.',
  },
  {
    question: 'What is markup?',
    answer:
      'Markup is the premium a player charges above the base cost. A 1.10x markup means you pay 10% more than the base action price.',
  },
  {
    question: 'How are winnings distributed?',
    answer:
      'When a player cashes, BackerHub verifies results with official tournament organizers. Winnings are automatically distributed to backers proportionally within 10 business days.',
  },
  {
    question: 'Is my backing safe?',
    answer:
      'All players are identity-verified. Funds are held in escrow until tournament completion. We track performance history and verify results through official sources.',
  },
  {
    question: 'Is this gambling?',
    answer:
      'No. BackerHub is a player sponsorship platform for competitive mind sport events. Poker tournaments (MTT) are recognized as skill-based competitions.',
  },
  {
    question: 'Is poker staking legal in Taiwan?',
    answer:
      'Yes. Multi-table poker tournaments (MTT) are recognized as competitive mind sport events in Taiwan and are legally operated by registered associations.',
  },
];

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
      url: `${SITE_URL}/${locale}/about`,
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
      canonical: `${SITE_URL}/${locale}/about`,
      languages: {
        en: `${SITE_URL}/en/about`,
        'zh-TW': `${SITE_URL}/zh-TW/about`,
      },
    },
  };
}

export default async function AboutLayout({
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
          { name: m.title, href: '/about' },
        ]}
      />
      <FAQPageJsonLd items={faqItems} />
      {children}
    </>
  );
}
