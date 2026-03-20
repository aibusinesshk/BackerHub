import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your BackerHub account to manage your portfolio, back players, or list your tournament action.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
