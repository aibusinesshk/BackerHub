'use client';

import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';

export function LegalDisclaimerBanner() {
  const t = useTranslations('legal');
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2">
      <Info className="h-4 w-4 text-amber-400/70 mt-0.5 shrink-0" />
      <p className="text-xs text-amber-200/70">{t('disclaimerBanner')}</p>
    </div>
  );
}
