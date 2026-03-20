import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileTabBar } from '@/components/layout/mobile-tab-bar';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Skip to content link for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-black focus:rounded-lg focus:font-medium focus:text-sm"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="pt-16 pb-28 md:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
