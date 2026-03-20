import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace',
  description:
    'Browse poker tournament staking listings. Find players to back and invest in their tournament action on BackerHub.',
  openGraph: {
    title: 'Marketplace | BackerHub',
    description: 'Browse poker tournament staking listings. Back skilled players and share in their victories.',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
