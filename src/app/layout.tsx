import type { Metadata } from 'next';
import { DM_Sans, Space_Grotesk, Noto_Sans_TC } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-tc',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhub.com';

export const metadata: Metadata = {
  title: {
    template: '%s | BackerHub',
    default: 'BackerHub - Back Players. Share Victories.',
  },
  icons: {
    icon: [
      { url: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/images/icon-192.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  description:
    'Invest in poker players or sell your tournament action. The first poker staking platform built for the Asian market.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    siteName: 'BackerHub',
    title: 'BackerHub - Back Players. Share Victories.',
    description:
      "Asia's premier poker tournament staking platform. Back skilled players, share in their victories.",
    url: siteUrl,
    locale: 'en',
    alternateLocale: 'zh-TW',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BackerHub - Back Players. Share Victories.',
    description:
      "Asia's premier poker tournament staking platform. Back skilled players, share in their victories.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      en: `${siteUrl}/en`,
      'zh-TW': `${siteUrl}/zh-TW`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} ${notoSansTC.variable} antialiased font-sans`}>{children}</body>
    </html>
  );
}
