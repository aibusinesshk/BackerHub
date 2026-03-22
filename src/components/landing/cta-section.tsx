'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { TrendingUp, Gamepad2, ArrowRight, Zap } from 'lucide-react';

export function CtaSection() {
  const t = useTranslations('cta');
  const tc = useTranslations('common');
  const { user } = useAuth();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/poker-table.jpg"
          alt="Poker table background"
          fill
          className="object-cover object-center"
          quality={80}
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080a0e] via-transparent to-[#080a0e]" />
      </div>

      {/* Gold glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gold-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-gold-500/20 bg-gold-500/5 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 text-gold-400" />
              <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">{t('title')}</span>
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2">
          <ScrollReveal delay={0.1}>
            <div className="group card-shine rounded-2xl border border-white/[0.06] bg-[#111318]/90 backdrop-blur-sm p-8 transition-all duration-300 hover:border-gold-500/25 hover:shadow-[0_8px_40px_rgba(245,184,28,0.06)] hover:-translate-y-1">
              {/* Accent line */}
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-gold-500 to-gold-400 mb-6" />

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/10 transition-all duration-300 group-hover:bg-gold-500/15 group-hover:scale-110">
                <TrendingUp className="h-7 w-7 text-gold-400" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-white">{t('investorTitle')}</h3>
              <p className="mb-6 text-white/50 leading-relaxed">{t('investorDesc')}</p>
              <Button
                render={<Link href={user ? '/marketplace' as const : '/signup' as const} />}
                className="bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold hover:from-gold-400 hover:to-gold-300 shadow-[0_0_20px_rgba(245,184,28,0.15)] hover:shadow-[0_0_30px_rgba(245,184,28,0.25)] transition-all duration-300"
              >
                {tc('getStarted')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="group card-shine rounded-2xl border border-white/[0.06] bg-[#111318]/90 backdrop-blur-sm p-8 transition-all duration-300 hover:border-gold-500/25 hover:shadow-[0_8px_40px_rgba(245,184,28,0.06)] hover:-translate-y-1">
              {/* Accent line */}
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-gold-500/60 to-transparent mb-6" />

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/10 transition-all duration-300 group-hover:bg-gold-500/15 group-hover:scale-110">
                <Gamepad2 className="h-7 w-7 text-gold-400" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-white">{t('playerTitle')}</h3>
              <p className="mb-6 text-white/50 leading-relaxed">{t('playerDesc')}</p>
              <Button
                variant="outline"
                render={<Link href={user ? '/create-listing' as any : '/signup' as const} />}
                className="border-gold-500/30 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500/40 transition-all duration-300"
              >
                {tc('listYourAction')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
