'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

const locales = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文（台灣）' },
  { code: 'zh-HK', label: '繁體中文（香港）' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-white/70 hover:text-white text-xs"
      >
        <Globe className="h-3.5 w-3.5" />
        {current.label}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-white/[0.08] bg-[#1a1d24] py-1 shadow-xl">
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                router.replace(pathname, { locale: l.code });
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-white/[0.06] text-white/80 hover:text-white"
            >
              {l.label}
              {l.code === locale && <Check className="h-3.5 w-3.5 text-gold-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
