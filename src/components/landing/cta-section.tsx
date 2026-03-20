'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { TrendingUp, Gamepad2, ArrowRight } from 'lucide-react';

export function CtaSection() {
  const t = useTranslations('cta');
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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2">
          <ScrollReveal delay={0.1}>
            <div className="group rounded-2xl border border-white/[0.06] bg-[#111318]/90 backdrop-blur-sm p-8 transition-all hover:border-gold-500/20">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500/10">
                <TrendingUp className="h-7 w-7 text-gold-400" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-white">{t('investorTitle')}</h3>
              <p className="mb-6 text-white/50">{t('investorDesc')}</p>
              <Button
                render={<Link href={user ? '/marketplace' as const : '/signup' as const} />}
                className="bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="group rounded-2xl border border-white/[0.06] bg-[#111318]/90 backdrop-blur-sm p-8 transition-all hover:border-gold-500/20">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500/10">
                <Gamepad2 className="h-7 w-7 text-gold-400" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-white">{t('playerTitle')}</h3>
              <p className="mb-6 text-white/50">{t('playerDesc')}</p>
              <Button
                variant="outline"
                render={<Link href={user ? '/create-listing' as any : '/signup' as const} />}
                className="border-gold-500/30 text-gold-400 hover:bg-gold-500/10"
              >
                List Your Action <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
