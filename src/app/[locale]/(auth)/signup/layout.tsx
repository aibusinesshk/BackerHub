import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your BackerHub account. Join as an investor, poker player, or both — and start staking in minutes.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
