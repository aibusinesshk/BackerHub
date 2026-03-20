import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';
import { PreLaunchBanner } from '@/components/landing/pre-launch-banner';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { StatsCounter } from '@/components/landing/stats-counter';
import { FeaturedPlayers } from '@/components/landing/featured-players';
import { Testimonials } from '@/components/landing/testimonials';
import { PaymentMethods } from '@/components/landing/payment-methods';
import { TrustBadges } from '@/components/landing/trust-badges';
import { CtaSection } from '@/components/landing/cta-section';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <PreLaunchBanner />
      <Header />
      <main className="pb-28 md:pb-0">
        <HeroSection />
        <FeaturedPlayers />
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
