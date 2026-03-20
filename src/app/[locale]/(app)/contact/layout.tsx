import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the BackerHub team. We support English and Traditional Chinese. Reach us for questions about backing, staking, or partnerships.',
  openGraph: {
    title: 'Contact | BackerHub',
    description: 'Get in touch with the BackerHub team for support, partnerships, or questions.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
