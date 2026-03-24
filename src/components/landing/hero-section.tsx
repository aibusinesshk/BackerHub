'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
  const t = useTranslations('hero');
  const { user } = useAuth();

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden pb-24 md:pb-0">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-poker.jpg"
          alt="Poker table background"
          fill
          className="object-cover object-center scale-105"
          priority
          quality={85}
        />
        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]/40" />
      </div>

      {/* Animated gradient orbs */}
      <div className="glow-orb absolute top-1/4 left-1/4 h-96 w-96 bg-gold-500/20" style={{ animationDelay: '0s' }} />
      <div className="glow-orb absolute bottom-1/4 right-1/4 h-80 w-80 bg-gold-600/15" style={{ animationDelay: '3s' }} />
      <div className="glow-orb absolute top-1/2 right-1/3 h-64 w-64 bg-gold-400/10" style={{ animationDelay: '1.5s' }} />

      {/* Gradient accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,184,28,0.1)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,184,28,0.06)_0%,transparent_50%)]" />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center animate-fade-in-up">
          {/* Large Logo Display with glow */}
          <div className="relative mb-6 sm:mb-10">
            <div className="absolute inset-0 blur-3xl bg-gold-500/10 scale-150 animate-float" />
            <Image
              src="/images/logo-hero.png"
              alt="BackerHub - Premium Poker Staking"
              width={706}
              height={159}
              className="relative h-16 sm:h-20 md:h-28 lg:h-36 w-auto drop-shadow-2xl"
              priority
            />
          </div>

          <Badge variant="outline" className="mb-4 sm:mb-6 border-gold-500/30 bg-gold-500/10 text-gold-400 px-4 py-1.5 text-sm backdrop-blur-sm animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(245,184,28,0.05), transparent)', backgroundSize: '200% auto' }}>
            {t('badge')}
          </Badge>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
            {t('title').split('\n').map((line, i) => (
              <span key={i}>
                {i === 0 ? (
                  <>{line}</>
                ) : (
                  <><br /><span className="gold-gradient-text drop-shadow-[0_0_30px_rgba(245,184,28,0.3)]">{line}</span></>
                )}
              </span>
            ))}
          </h1>

          <p className="mt-4 sm:mt-6 max-w-2xl text-base text-white/60 sm:text-xl leading-relaxed drop-shadow-md">
            {t('subtitle')}
          </p>

          {/* Pre-launch 0% fee callout */}
          <Link href={'/pricing' as any} className="group mt-5 sm:mt-8 inline-flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-gold-500/10 backdrop-blur-sm px-5 py-2.5 sm:px-6 sm:py-3 transition-all duration-300 hover:bg-gold-500/20 hover:border-gold-500/50 hover:shadow-[0_0_40px_rgba(245,184,28,0.12)] cursor-pointer">
            <Sparkles className="h-5 w-5 text-gold-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <div className="text-left">
              <span className="block text-lg font-bold text-gold-400 sm:text-xl">{t('freeTag')}</span>
              <span className="block text-xs text-white/50 sm:text-sm">{t('freeTagSub')}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gold-400/60 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <div className="mt-5 sm:mt-8 flex flex-col gap-3 sm:gap-4 sm:flex-row">
            <Button
              size="lg"
              render={<Link href={user ? '/marketplace' as const : '/signup' as const} />}
              className="relative bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold hover:from-gold-400 hover:to-gold-300 shadow-[0_0_30px_rgba(245,184,28,0.2)] hover:shadow-[0_0_50px_rgba(245,184,28,0.35)] px-8 h-12 text-base transition-all duration-300"
            >
              {t('ctaInvestor')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href={user ? '/create-listing' as any : '/signup' as const} />}
              className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm px-8 h-12 text-base transition-all duration-300"
            >
              {t('ctaPlayer')}
            </Button>
          </div>

        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080a0e] to-transparent" />
    </section>
  );
}
