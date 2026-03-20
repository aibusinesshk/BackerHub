import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'BackerHub pricing and fee structure. Transparent, simple fees for poker tournament staking — currently 0% during pre-launch.',
  openGraph: {
    title: 'Pricing | BackerHub',
    description: 'Transparent fees for poker tournament staking. 0% platform fee during pre-launch.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
