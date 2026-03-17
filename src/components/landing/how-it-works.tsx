'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Search, ShoppingCart, Trophy } from 'lucide-react';

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    { icon: Search, title: t('step1Title'), desc: t('step1Desc'), num: '01' },
    { icon: ShoppingCart, title: t('step2Title'), desc: t('step2Desc'), num: '02' },
    { icon: Trophy, title: t('step3Title'), desc: t('step3Desc'), num: '03' },
  ];

  return (
    <section className="relative py-24 bg-[#080a0e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.15}>
              <div className="group relative rounded-2xl border border-white/[0.06] bg-[#111318] p-8 transition-all hover:border-gold-500/20 hover:shadow-[0_0_30px_rgba(245,184,28,0.05)]">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 transition-colors group-hover:bg-gold-500/20">
                    <step.icon className="h-6 w-6 text-gold-400" />
                  </div>
                  <span className="text-4xl font-bold text-white/[0.06]">{step.num}</span>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
