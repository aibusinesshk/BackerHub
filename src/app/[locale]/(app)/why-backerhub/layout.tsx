import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Why BackerHub',
  description:
    'Why choose BackerHub over traditional staking? Escrow-protected funds, verified players, transparent fees, and institutional-grade controls.',
  openGraph: {
    title: 'Why BackerHub',
    description: 'Escrow-protected funds, verified players, and transparent fees for poker staking.',
  },
};

export default function WhyBackerHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
