'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8">
        <span className="text-[8rem] font-bold leading-none tracking-tighter text-white/[0.04] sm:text-[12rem]">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold tracking-tight sm:text-7xl">
          <span className="text-white">4</span>
          <span className="gold-gradient-text">0</span>
          <span className="text-white">4</span>
        </span>
      </div>

      <h1 className="mb-3 text-xl font-semibold text-white sm:text-2xl">
        {t('title')}
      </h1>
      <p className="mb-8 max-w-md text-white/50">
        {t('description')}
      </p>

      <Button
        render={<Link href="/" />}
        className="bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow px-8 h-11"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('goHome')}
      </Button>
    </div>
  );
}
