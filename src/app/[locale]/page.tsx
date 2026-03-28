import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StatsCounter } from '@/components/landing/stats-counter';
import { FeaturedPlayers } from '@/components/landing/featured-players';
import { Testimonials } from '@/components/landing/testimonials';
import { PaymentMethods } from '@/components/landing/payment-methods';
import { TrustBadges } from '@/components/landing/trust-badges';
import { AiVerification } from '@/components/landing/ai-verification';
import { CtaSection } from '@/components/landing/cta-section';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhubasia.vercel.app';

const metaByLocale: Record<string, { title: string; description: string }> = {
  en: {
    title: "BackerHub - Asia's Poker Backing Platform | Back Players. Share Victories.",
    description:
      "Asia's premier poker tournament staking platform. Invest in verified players, share tournament winnings. Escrow-protected, crypto-native.",
  },
  'zh-TW': {
    title: 'BackerHub - 亞洲撲克質押平台 | 贊助選手，共享勝利',
    description:
      '亞洲首選撲克錦標賽質押平台。投資經驗證的選手，分享錦標賽獎金。託管保護，加密貨幣原生。',
  },
  'zh-HK': {
    title: 'BackerHub - 亞洲撲克質押平台 | 贊助選手，共享勝利',
    description:
      '亞洲首選撲克錦標賽質押平台。投資經驗證的選手，分享錦標賽獎金。託管保護，加密貨幣原生。',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = metaByLocale[locale] || metaByLocale.en;

  return {
    title: m.title,
    description: m.description,
    openGraph: {
      type: 'website',
      title: m.title,
      description: m.description,
      url: `${SITE_URL}/${locale}`,
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
      title: m.title,
      description: m.description,
      images: [`${SITE_URL}/opengraph-image`],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        'zh-TW': `${SITE_URL}/zh-TW`,
        'zh-HK': `${SITE_URL}/zh-HK`,
      },
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <Header />
      <main className="pt-16 pb-28 md:pb-0 overflow-hidden">
        <HeroSection />
        <FeaturedPlayers />
        <AiVerification />
        <HowItWorks />
        <StatsCounter />
        <Testimonials />
        <PaymentMethods />
        <TrustBadges />
        <CtaSection />
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
