'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Users, Trophy, Sparkles } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/format';
import type { PlatformStats } from '@/types';

export function HeroSection() {
  const t = useTranslations('hero');
  const { user } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalBacked: 0, tournamentsStaked: 0, activePlayers: 0, avgROI: 0, prizeDistributions: 0, countriesServed: 0,
  });

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => setPlatformStats(data))
      .catch(() => {});
  }, []);

  const stats = [
    { label: t('statInvested'), value: formatCurrency(platformStats.totalBacked), icon: TrendingUp },
    { label: t('statPlayers'), value: `${platformStats.activePlayers}+`, icon: Users },
    { label: t('statTournaments'), value: formatNumber(platformStats.tournamentsStaked), icon: Trophy },
  ];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16 pb-28 md:pb-0">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-poker.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          quality={85}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
      </div>

      {/* Gradient accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,184,28,0.08)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,184,28,0.05)_0%,transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center animate-fade-in-up">
          <Badge variant="outline" className="mb-6 border-gold-500/30 bg-gold-500/10 text-gold-400 px-4 py-1.5 text-sm backdrop-blur-sm">
            {t('badge')}
          </Badge>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
            {t('title').split('\n').map((line, i) => (
              <span key={i}>
                {i === 0 ? (
                  <>{line}</>
                ) : (
                  <><br /><span className="gold-gradient-text">{line}</span></>
                )}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/70 sm:text-xl drop-shadow-md">
            {t('subtitle')}
          </p>

          {/* Pre-launch 0% fee callout */}
          <Link href={'/pricing' as any} className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-gold-500/10 backdrop-blur-sm px-6 py-3 transition-colors hover:bg-gold-500/20 hover:border-gold-500/40 cursor-pointer">
            <Sparkles className="h-5 w-5 text-gold-400" />
            <div className="text-left">
              <span className="block text-lg font-bold text-gold-400 sm:text-xl">{t('freeTag')}</span>
              <span className="block text-xs text-white/60 sm:text-sm">{t('freeTagSub')}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gold-400/60" />
          </Link>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              size="lg"
              render={<Link href={user ? '/marketplace' as const : '/signup' as const} />}
              className="bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow px-8 h-12 text-base"
            >
              {t('ctaInvestor')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href={user ? '/create-listing' as any : '/signup' as const} />}
              className="border-white/20 text-white hover:bg-white/5 backdrop-blur-sm px-8 h-12 text-base"
            >
              {t('ctaPlayer')}
            </Button>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 backdrop-blur-sm bg-black/20 rounded-xl px-4 py-3 border border-white/[0.06]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
                  <stat.icon className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
