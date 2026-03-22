'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import type { PlatformStats } from '@/types';

function StatItem({ value, label, prefix = '', suffix = '' }: {
  value: number; label: string; prefix?: string; suffix?: string;
}) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <div ref={ref} className="group relative text-center px-4 py-2">
      <p className="text-3xl font-bold gold-gradient-text sm:text-4xl md:text-5xl transition-transform duration-300 group-hover:scale-105">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-white/40 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

function Divider() {
  return (
    <div className="hidden md:flex items-center justify-center">
      <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function StatsCounter() {
  const t = useTranslations('stats');
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalBacked: 0, tournamentsStaked: 0, activePlayers: 0, avgROI: 0, prizeDistributions: 0, countriesServed: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/stats', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setPlatformStats(data))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#111318] to-[#0d0f14] p-8 sm:p-12 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,184,28,0.04)_0%,transparent_70%)]" />

          {/* Top gradient border accent */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

          {/* Mobile: 2x2 grid, Desktop: 4 stats with dividers */}
          <div className="relative grid grid-cols-2 gap-8 md:hidden">
            <StatItem value={platformStats.totalBacked} label={t('totalInvested')} prefix="$" />
            <StatItem value={platformStats.tournamentsStaked} label={t('tournamentsStaked')} />
            <StatItem value={platformStats.activePlayers} label={t('activePlayers')} suffix="+" />
            <StatItem value={platformStats.avgROI} label={t('avgROI')} suffix="%" />
          </div>

          <div className="relative hidden md:grid md:grid-cols-7 md:items-center">
            <StatItem value={platformStats.totalBacked} label={t('totalInvested')} prefix="$" />
            <Divider />
            <StatItem value={platformStats.tournamentsStaked} label={t('tournamentsStaked')} />
            <Divider />
            <StatItem value={platformStats.activePlayers} label={t('activePlayers')} suffix="+" />
            <Divider />
            <StatItem value={platformStats.avgROI} label={t('avgROI')} suffix="%" />
          </div>
        </div>
      </div>
    </section>
  );
}
