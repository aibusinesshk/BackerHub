'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import type { PlatformStats } from '@/types';

function StatItem({ value, label, prefix = '', suffix = '' }: {
  value: number; label: string; prefix?: string; suffix?: string;
}) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-bold text-gold-400 sm:text-4xl md:text-5xl">
        {prefix}{count.toLocaleString()}{suffix}
      </p>
      <p className="mt-2 text-sm text-white/50">{label}</p>
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
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111318]/50 p-8 sm:p-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatItem value={platformStats.totalBacked} label={t('totalInvested')} prefix="$" />
            <StatItem value={platformStats.tournamentsStaked} label={t('tournamentsStaked')} />
            <StatItem value={platformStats.activePlayers} label={t('activePlayers')} suffix="+" />
            <StatItem value={platformStats.avgROI} label={t('avgROI')} suffix="%" />
          </div>
        </div>
      </div>
    </section>
  );
}
