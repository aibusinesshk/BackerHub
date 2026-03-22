'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPercent, formatCurrency } from '@/lib/format';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { Check, TrendingUp, Trophy, ArrowRight } from 'lucide-react';
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
    <section className="relative py-24 bg-[#080a0e] overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,184,28,0.04)_0%,transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400/80">
              {t('title')}
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((player, i) => (
            <ScrollReveal key={player.id} delay={i * 0.1}>
              <div className="group card-shine rounded-2xl border border-white/[0.06] bg-[#111318] overflow-hidden transition-all duration-300 hover:border-gold-500/25 hover:-translate-y-1.5 hover:shadow-[0_8px_40px_rgba(245,184,28,0.08)]">
                {/* Top accent line */}
                <div className="h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="p-5">
                  {/* Player info with circular avatar */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative">
                      <PlayerAvatar
                        src={player.avatarUrl}
                        name={player.displayName}
                        className="h-14 w-14 flex-shrink-0 text-lg ring-2 ring-white/[0.06] transition-all duration-300 group-hover:ring-gold-500/30"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 ring-2 ring-[#111318]">
                        <Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-white truncate">
                        {locale === 'zh-TW' && player.displayNameZh ? player.displayNameZh : player.displayName}
                      </h3>
                      <p className="text-sm text-white/50">
                        <span role="img" aria-label={player.region === 'TW' ? 'Taiwan' : 'Hong Kong'}>{player.region === 'TW' ? '🇹🇼' : '🇭🇰'}</span> {player.stats.totalTournaments} tournaments
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    <div className="rounded-xl bg-white/[0.03] p-3 text-center border border-white/[0.03] transition-colors duration-300 group-hover:border-green-500/10 group-hover:bg-green-500/[0.03]">
                      <TrendingUp className="mx-auto h-4 w-4 text-green-400 mb-1.5" />
                      <p className="text-sm font-bold text-green-400">{formatPercent(player.stats.lifetimeROI)}</p>
                      <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">ROI</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3 text-center border border-white/[0.03] transition-colors duration-300 group-hover:border-gold-500/10 group-hover:bg-gold-500/[0.03]">
                      <Trophy className="mx-auto h-4 w-4 text-gold-400 mb-1.5" />
                      <p className="text-sm font-bold text-white">{formatCurrency(player.stats.biggestWin)}</p>
                      <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Best Win</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-3 text-center border border-white/[0.03] transition-colors duration-300 group-hover:border-white/[0.06]">
                      <p className="text-sm font-bold text-white mt-5">{player.stats.cashRate}%</p>
                      <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Cash Rate</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/player/${player.id}` as any} />}
                    className="w-full border-gold-500/20 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500/30 transition-all duration-300 group-hover:border-gold-500/30"
                  >
                    {t('viewProfile')} <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0 section-divider" />
    </section>
  );
}
