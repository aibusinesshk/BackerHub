'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPercent, formatCurrency } from '@/lib/format';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { Check, TrendingUp, Trophy } from 'lucide-react';
import type { Player } from '@/types';

export function FeaturedPlayers() {
  const t = useTranslations('featured');
  const locale = useLocale();
  const [featured, setFeatured] = useState<Player[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/players?verified=true&sort=top&limit=6', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setFeatured(data.players || []))
      .catch(() => {});
    return () => controller.abort();
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
                <div className="p-5">
                  {/* Player info with circular avatar */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <PlayerAvatar
                      src={player.avatarUrl}
                      name={player.displayName}
                      className="h-14 w-14 flex-shrink-0 text-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-bold text-white truncate">
                          {locale === 'zh-TW' && player.displayNameZh ? player.displayNameZh : player.displayName}
                        </h3>
                        <span className="flex-shrink-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gold-400/80">
                          <Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} />
                        </span>
                      </div>
                      <p className="text-sm text-white/50">
                        <span role="img" aria-label={player.region === 'TW' ? 'Taiwan' : 'Hong Kong'}>{player.region === 'TW' ? '🇹🇼' : '🇭🇰'}</span> {player.stats.totalTournaments} tournaments
                      </p>
                    </div>
                  </div>
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
