import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Understand the BackerHub staking flow — from listing creation to escrow settlement. A step-by-step guide for backers and players.',
  openGraph: {
    title: 'How It Works | BackerHub',
    description: 'Step-by-step guide to poker tournament staking on BackerHub.',
  },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
