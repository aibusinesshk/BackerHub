'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPercent, formatCurrency } from '@/lib/format';
import { CheckCircle, TrendingUp, Trophy } from 'lucide-react';
import type { Player } from '@/types';

export function FeaturedPlayers() {
  const t = useTranslations('featured');
  const locale = useLocale();
  const [featured, setFeatured] = useState<Player[]>([]);

  useEffect(() => {
    fetch('/api/players?verified=true&limit=6')
      .then((r) => r.json())
      .then((data) => setFeatured(data.players || []))
      .catch(() => {});
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="py-24 bg-[#080a0e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((player, i) => (
            <ScrollReveal key={player.id} delay={i * 0.1}>
              <div className="group rounded-2xl border border-white/[0.06] bg-[#111318] overflow-hidden transition-all hover:border-gold-500/20 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(245,184,28,0.05)]">
                {/* Large player photo */}
                <div className="relative h-52 bg-gradient-to-b from-[#1a1d24] to-[#111318]">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={locale === 'zh-TW' && player.displayNameZh ? player.displayNameZh : player.displayName}
                      className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-5xl font-bold text-gold-500/30">
                        {player.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111318] to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg">
                        {locale === 'zh-TW' && player.displayNameZh ? player.displayNameZh : player.displayName}
                      </h3>
                      <CheckCircle className="h-4 w-4 text-gold-400 drop-shadow" />
                    </div>
                    <p className="text-xs text-white/60">
                      {player.region === 'TW' ? '🇹🇼' : '🇭🇰'} {player.stats.totalTournaments} tournaments
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                      <TrendingUp className="mx-auto h-4 w-4 text-green-400 mb-1" />
                      <p className="text-sm font-semibold text-green-400">{formatPercent(player.stats.lifetimeROI)}</p>
                      <p className="text-[10px] text-white/40">ROI</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                      <Trophy className="mx-auto h-4 w-4 text-gold-400 mb-1" />
                      <p className="text-sm font-semibold text-white">{formatCurrency(player.stats.biggestWin)}</p>
                      <p className="text-[10px] text-white/40">Best Win</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                      <p className="text-sm font-semibold text-white mt-4">{player.stats.cashRate}%</p>
                      <p className="text-[10px] text-white/40">Cash Rate</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/player/${player.id}` as any} />}
                    className="w-full border-gold-500/20 text-gold-400 hover:bg-gold-500/10"
                  >
                    {t('viewProfile')}
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
