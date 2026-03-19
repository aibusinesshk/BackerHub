'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/format';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import {
  Search, Check, TrendingUp, Trophy, Users, Loader2, ExternalLink,
} from 'lucide-react';
import type { Player } from '@/types';

export default function PlayersPage() {
  const t = useTranslations('players');
  const locale = useLocale();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState(false);

  useEffect(() => {
    fetch('/api/players?limit=200')
      .then((res) => res.json())
      .then((data) => setPlayers(data.players || []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (regionFilter !== 'all' && p.region !== regionFilter) return false;
      if (verifiedFilter && !p.isVerified) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = locale === 'zh-TW' && p.displayNameZh ? p.displayNameZh : p.displayName;
        return name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [players, search, regionFilter, verifiedFilter, locale]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-white/50">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'TW', 'HK'].map((r) => (
            <Button
              key={r}
              variant={regionFilter === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRegionFilter(r)}
              className={regionFilter === r ? 'bg-gold-500 text-black' : 'border-white/10 text-white/50 hover:text-white'}
            >
              {r === 'all' ? t('allRegions') : r === 'TW' ? '🇹🇼 TW' : '🇭🇰 HK'}
            </Button>
          ))}
        </div>
        <Button
          variant={verifiedFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => setVerifiedFilter(!verifiedFilter)}
          className={verifiedFilter ? 'bg-gold-500 text-black' : 'border-white/10 text-white/50 hover:text-white'}
        >
          <Check className="mr-1 h-3 w-3" />
          {t('verifiedOnly')}
        </Button>
      </div>

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="mb-4 text-sm text-white/40">{t('showingCount', { count: filtered.length })}</p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50">{t('noResults')}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-white/10 text-white/50"
            onClick={() => { setSearch(''); setRegionFilter('all'); setVerifiedFilter(false); }}
          >
            {t('resetFilters')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((player) => {
            const playerName = locale === 'zh-TW' && player.displayNameZh ? player.displayNameZh : player.displayName;

            return (
              <div
                key={player.id}
                className="group rounded-2xl border border-white/[0.06] bg-[#111318] overflow-hidden transition-all hover:border-gold-500/20 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(245,184,28,0.05)]"
              >
                <div className="p-5">
                  {/* Player info with circular avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <PlayerAvatar
                      src={player.avatarUrl}
                      name={player.displayName}
                      className="h-11 w-11 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="text-base font-bold text-white truncate">{playerName}</h3>
                        {player.isVerified && (
                          <span className="flex-shrink-0 inline-flex items-center justify-center h-3 w-3 rounded-full bg-gold-400/80">
                            <Check className="h-2 w-2 text-black" strokeWidth={3.5} />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50">
                        {player.region === 'TW' ? '🇹🇼' : player.region === 'HK' ? '🇭🇰' : '🌐'}{' '}
                        {player.stats.totalTournaments} {t('tournaments')}
                      </p>
                    </div>
                  </div>
                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                      <TrendingUp className="mx-auto h-4 w-4 text-green-400 mb-1" />
                      <p className="text-sm font-semibold text-green-400">{formatPercent(player.stats.lifetimeROI)}</p>
                      <p className="text-[10px] text-white/40">{t('roi')}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                      <Trophy className="mx-auto h-4 w-4 text-gold-400 mb-1" />
                      <p className="text-sm font-semibold text-white">{formatCurrency(player.stats.biggestWin)}</p>
                      <p className="text-[10px] text-white/40">{t('biggestWin')}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                      <p className="text-sm font-semibold text-white mt-4">{player.stats.cashRate}%</p>
                      <p className="text-[10px] text-white/40">{t('cashRate')}</p>
                    </div>
                  </div>

                  {/* Total earnings */}
                  {player.stats.totalStakedValue > 0 && (
                    <div className="mb-4 rounded-lg bg-white/[0.03] px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-white/40">{t('totalEarnings')}</span>
                      <span className="text-sm font-semibold text-gold-400">
                        {formatCurrency(player.stats.totalStakedValue)}
                      </span>
                    </div>
                  )}

                  {/* Hendon Mob link */}
                  {player.hendonMobUrl && (
                    <a
                      href={player.hendonMobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 flex items-center gap-2 text-xs text-white/40 hover:text-gold-400 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t('hendonMob')}
                    </a>
                  )}

                  {/* View Profile button */}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
