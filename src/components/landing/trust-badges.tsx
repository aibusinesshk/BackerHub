'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { ShieldCheck, Lock, Eye, Headphones } from 'lucide-react';

export function TrustBadges() {
  const t = useTranslations('trust');

  const items = [
    { icon: ShieldCheck, title: t('verified'), desc: t('verifiedDesc') },
    { icon: Lock, title: t('secure'), desc: t('secureDesc') },
    { icon: Eye, title: t('transparent'), desc: t('transparentDesc') },
    { icon: Headphones, title: t('support'), desc: t('supportDesc') },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Subtle background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/poker-chips.jpg"
          alt=""
          fill
          className="object-cover object-center"
          quality={75}
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/92" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.1}>
              <div className="text-center rounded-2xl border border-white/[0.06] bg-[#111318]/80 backdrop-blur-sm p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500/10">
                  <item.icon className="h-7 w-7 text-gold-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
