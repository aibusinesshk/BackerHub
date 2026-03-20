import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your BackerHub account password. We will send you a link to set a new password.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
