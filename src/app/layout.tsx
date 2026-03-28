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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhub.com';

export const metadata: Metadata = {
  title: {
    template: '%s | BackerHub',
    default: 'BackerHub \u2014 Back Players. Share Victories.',
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
  manifest: '/manifest.json',
  other: {
    'theme-color': '#0a0a0a',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },
  description:
    'Invest in poker players or sell your tournament action. The first poker staking platform built for the Asian market.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    siteName: 'BackerHub',
    title: 'BackerHub \u2014 Back Players. Share Victories.',
    description:
      "Asia's premier poker tournament staking platform. Back skilled players, share in their victories.",
    url: siteUrl,
    locale: 'en',
    alternateLocale: ['zh-TW', 'zh-HK'],
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "BackerHub - Asia's Poker Backing Platform",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BackerHub \u2014 Back Players. Share Victories.',
    description:
      "Asia's premier poker tournament staking platform. Back skilled players, share in their victories.",
    images: [`${siteUrl}/opengraph-image`],
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
      'zh-HK': `${siteUrl}/zh-HK`,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
  themeColor: '#0a0a0a',
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
