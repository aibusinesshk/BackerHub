'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Quote, Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  nameZh?: string;
  quote: string;
  quoteZh?: string;
  role: 'investor' | 'player';
  region: string;
}

export function Testimonials() {
  const t = useTranslations('testimonials');
  const locale = useLocale();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    fetch('/api/testimonials', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setTestimonials(data.testimonials || []))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true);
      });
    return () => controller.abort();
  }, []);

  if (error || testimonials.length === 0) return null;

  return (
    <section className="relative py-24">
      {/* Background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,184,28,0.03)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400/80">
              {t('title')}
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 0.1}>
              <div className="group card-shine rounded-2xl border border-white/[0.06] bg-[#111318] p-6 transition-all duration-300 hover:border-gold-500/15 hover:shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
                {/* Gold accent line at top */}
                <div className="h-px w-12 bg-gradient-to-r from-gold-500/60 to-transparent mb-5" />

                <Quote className="h-7 w-7 text-gold-500/15 mb-4" />

                {/* Star rating */}
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-gold-400 fill-gold-400" />
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-white/60 mb-6">
                  &ldquo;{locale === 'zh-TW' ? item.quoteZh : item.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
                  <Avatar className="h-10 w-10 ring-1 ring-gold-500/20">
                    <AvatarFallback className="bg-gold-500/10 text-gold-400 text-xs font-semibold">
                      {item.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {locale === 'zh-TW' ? item.nameZh : item.name}
                    </p>
                    <Badge variant="outline" className="text-[10px] border-gold-500/20 text-gold-400/80 px-2 py-0">
                      {item.role === 'investor' ? t('investor') : t('player')} · <span role="img" aria-label={item.region === 'TW' ? 'Taiwan' : 'Hong Kong'}>{item.region === 'TW' ? '🇹🇼' : '🇭🇰'}</span>
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
