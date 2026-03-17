'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Quote } from 'lucide-react';

export function Testimonials() {
  const t = useTranslations('testimonials');
  const locale = useLocale();
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((data) => setTestimonials(data.testimonials || []))
      .catch(() => {});
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 0.1}>
              <div className="rounded-2xl border border-white/[0.06] bg-[#111318] p-6">
                <Quote className="h-8 w-8 text-gold-500/20 mb-4" />
                <p className="text-sm leading-relaxed text-white/70 mb-6">
                  &ldquo;{locale === 'zh-TW' ? item.quoteZh : item.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gold-500/10 text-gold-400 text-xs">
                      {item.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {locale === 'zh-TW' ? item.nameZh : item.name}
                    </p>
                    <Badge variant="outline" className="text-[10px] border-gold-500/20 text-gold-400">
                      {item.role === 'investor' ? t('investor') : t('player')} · {item.region === 'TW' ? '🇹🇼' : '🇭🇰'}
                    </Badge>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
