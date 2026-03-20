import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    "Learn about BackerHub — Asia's premier poker tournament staking platform. Meet our team and understand our mission.",
  openGraph: {
    title: 'About | BackerHub',
    description: "Learn about BackerHub — Asia's premier poker tournament staking platform.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
