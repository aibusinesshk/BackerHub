import { setRequestLocale } from 'next-intl/server';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,184,28,0.04)_0%,transparent_50%)]" />
      {children}
    </div>
  );
}
