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

export const metadata: Metadata = {
  title: {
    template: '%s | BackHub',
    default: 'BackHub - Back Players. Share Victories.',
  },
  description:
    'Invest in poker players or sell your tournament action. The first poker staking platform built for the Asian market.',
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
