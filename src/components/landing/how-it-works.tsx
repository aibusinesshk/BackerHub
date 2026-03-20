'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Search, ShoppingCart, Trophy, ArrowRight, ChevronRight } from 'lucide-react';

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      icon: Search,
      title: t('step1Title'),
      desc: t('step1Desc'),
      num: '01',
      accent: 'from-gold-500/20 to-amber-500/5',
      iconBg: 'bg-gold-500/15 group-hover:bg-gold-500/25',
      glow: 'rgba(245,184,28,0.08)',
    },
    {
      icon: ShoppingCart,
      title: t('step2Title'),
      desc: t('step2Desc'),
      num: '02',
      accent: 'from-gold-400/20 to-amber-400/5',
      iconBg: 'bg-gold-500/15 group-hover:bg-gold-500/25',
      glow: 'rgba(245,184,28,0.10)',
    },
    {
      icon: Trophy,
      title: t('step3Title'),
      desc: t('step3Desc'),
      num: '03',
      accent: 'from-green-500/20 to-emerald-500/5',
      iconBg: 'bg-green-500/15 group-hover:bg-green-500/25',
      glow: 'rgba(34,197,94,0.08)',
    },
  ];

  return (
    <section className="relative py-24 bg-[#080a0e] overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,184,28,0.03)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16 sm:mb-20">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400/80">
              {t('title')}
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {t('subtitle')}
            </h2>
          </div>
        </ScrollReveal>

        {/* Desktop: horizontal timeline with connectors */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-0">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.2}>
                <div className="group relative flex flex-col items-center text-center px-6">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-10 left-[calc(50%+2.5rem)] right-0 flex items-center z-0 pointer-events-none">
                      <div className="flex-1 h-px bg-gradient-to-r from-gold-500/30 via-gold-500/15 to-transparent" />
                      <ChevronRight className="h-4 w-4 text-gold-500/30 -ml-1" />
                    </div>
                  )}

                  {/* Step number badge */}
                  <div className="relative z-10 mb-6">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-2xl ${step.iconBg} border border-white/[0.06] transition-all duration-300 group-hover:scale-110 group-hover:border-gold-500/20`}
                      style={{ boxShadow: `0 0 40px ${step.glow}` }}
                    >
                      <step.icon className="h-8 w-8 text-gold-400" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-black shadow-lg">
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50 max-w-[280px]">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden space-y-0">
          {steps.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.15}>
              <div className="group relative flex gap-5">
                {/* Timeline rail */}
                <div className="flex flex-col items-center">
                  <div
                    className={`relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${step.iconBg} border border-white/[0.06] transition-all duration-300 group-hover:border-gold-500/20`}
                    style={{ boxShadow: `0 0 30px ${step.glow}` }}
                  >
                    <step.icon className="h-6 w-6 text-gold-400" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-black">
                      {i + 1}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 min-h-[2rem] bg-gradient-to-b from-gold-500/30 to-transparent my-2" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 ${i < steps.length - 1 ? 'pb-8' : 'pb-0'}`}>
                  <h3 className="text-lg font-bold text-white mt-2">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
