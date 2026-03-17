'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { X, Zap, ArrowRight } from 'lucide-react';

export function PreLaunchBanner() {
  const t = useTranslations('preLaunch');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative z-[60] bg-gradient-to-r from-gold-600 via-gold-500 to-amber-500 text-black">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              <Zap className="h-3 w-3" />
              FREE
            </span>
            <p className="text-sm font-bold sm:text-base">
              {t('banner')}
            </p>
            <span className="hidden text-sm text-black/70 sm:inline">
              — {t('bannerSub')}
            </span>
            <Link
              href="/signup"
              className="ml-2 inline-flex items-center gap-1 rounded-full bg-black px-4 py-1.5 text-xs font-bold text-gold-400 transition-colors hover:bg-black/80"
            >
              {t('cta')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-full p-1 text-black/50 transition-colors hover:bg-black/10 hover:text-black"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
