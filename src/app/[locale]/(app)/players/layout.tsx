import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Players',
  description:
    'Discover verified poker players on BackerHub. View stats, ROI history, and reliability scores before backing.',
  openGraph: {
    title: 'Players | BackerHub',
    description: 'Discover verified poker players. View stats and ROI history before investing.',
  },
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
