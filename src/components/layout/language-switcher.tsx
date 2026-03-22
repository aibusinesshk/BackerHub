'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const localeOrder = ['en', 'zh-TW', 'zh-HK'] as const;
  const localeLabels: Record<string, string> = { en: 'EN', 'zh-TW': '繁中(台)', 'zh-HK': '繁中(港)' };

  const toggle = () => {
    const idx = localeOrder.indexOf(locale as (typeof localeOrder)[number]);
    const next = localeOrder[(idx + 1) % localeOrder.length];
    router.replace(pathname, { locale: next });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1.5 text-white/70 hover:text-white text-xs"
    >
      <Globe className="h-3.5 w-3.5" />
      {localeLabels[locale] || 'EN'}
    </Button>
  );
}
