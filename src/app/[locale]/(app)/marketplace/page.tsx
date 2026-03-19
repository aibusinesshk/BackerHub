'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatMarkup, formatPercent, formatDate } from '@/lib/format';
import { PlayerHeroImage } from '@/components/shared/player-hero-image';
import { Search, Filter, Check, TrendingUp, Loader2 } from 'lucide-react';
import type { StakingListing } from '@/types';

export default function MarketplacePage() {
  const t = useTranslations('marketplace');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [allListings, setAllListings] = useState<StakingListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/listings')
      .then((res) => res.json())
      .then((data) => setAllListings(data.listings || []))
      .catch(() => setAllListings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return allListings.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (typeFilter !== 'all' && l.tournament?.type !== typeFilter) return false;
      if (regionFilter !== 'all' && l.tournament?.region !== regionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = locale === 'zh-TW' && l.player?.displayNameZh ? l.player.displayNameZh : l.player?.displayName || '';
        const tourney = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || '';
        return name.toLowerCase().includes(q) || tourney.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allListings, search, typeFilter, regionFilter, statusFilter, locale]);

  const statusColors: Record<string, string> = {
    active: 'border-green-500/30 bg-green-500/10 text-green-400',
    filled: 'border-gold-500/30 bg-gold-500/10 text-gold-400',
    completed: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    cancelled: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-white/50">{t('subtitle')}</p>
      </div>

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
        <div className="flex gap-2 flex-wrap">
          {['all', 'MTT', 'SNG', 'SAT', 'HU'].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className={typeFilter === type ? 'bg-gold-500 text-black' : 'border-white/10 text-white/50 hover:text-white'}
            >
              {type === 'all' ? t('allTypes') : type}
            </Button>
          ))}
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50">{t('noResults')}</p>
          <Button variant="outline" size="sm" className="mt-4 border-white/10 text-white/50" onClick={() => { setSearch(''); setTypeFilter('all'); setRegionFilter('all'); setStatusFilter('all'); }}>
            {t('resetFilters')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => {
            if (!listing.player || !listing.tournament) return null;
            const playerName = locale === 'zh-TW' && listing.player.displayNameZh ? listing.player.displayNameZh : listing.player.displayName;
            const tournamentName = locale === 'zh-TW' && listing.tournament.nameZh ? listing.tournament.nameZh : listing.tournament.name;
            const soldPercent = (listing.actionSold / listing.totalActionOffered) * 100;

            return (
              <Card key={listing.id} className="border-white/[0.06] bg-[#111318] overflow-hidden transition-all hover:border-gold-500/20 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(245,184,28,0.05)]">
                {/* Large player photo */}
                <div className="relative h-48 bg-gradient-to-b from-[#1a1d24] to-[#111318]">
                  <PlayerHeroImage
                    src={listing.player.avatarUrl}
                    alt={playerName}
                    initials={listing.player.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111318] to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge variant="outline" className="text-[10px] border-white/20 bg-black/50 text-white/70 backdrop-blur-sm">{listing.tournament.type}</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className={`text-[10px] backdrop-blur-sm bg-black/50 ${statusColors[listing.status]}`}>
                      {t(listing.status)}
                    </Badge>
                  </div>
                  {/* Player name overlay at bottom */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center gap-1">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg">{playerName}</h3>
                      {listing.player.isVerified && (
                        <span className="flex-shrink-0 inline-flex items-center justify-center h-3 w-3 rounded-full bg-gold-400/80">
                          <Check className="h-2 w-2 text-black" strokeWidth={3.5} />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white/60">{listing.player.region === 'TW' ? '🇹🇼' : listing.player.region === 'HK' ? '🇭🇰' : '🌐'}</span>
                      <span className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="h-3 w-3" /> {formatPercent(listing.player.stats.lifetimeROI)} ROI
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-3 pt-4">
                  <div>
                    <h4 className="font-semibold text-white text-sm leading-tight">{tournamentName}</h4>
                    <p className="text-xs text-white/40 mt-0.5">{formatDate(listing.tournament.date, locale)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <span className="text-white/40">{t('buyIn')}</span>
                      <p className="font-semibold text-white text-base">{formatCurrency(listing.tournament.buyIn)}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <span className="text-white/40">{t('markup')}</span>
                      <p className="font-semibold text-gold-400 text-base">{formatMarkup(listing.markup)}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/40">{t('sharesSold')}: {listing.actionSold}%</span>
                      <span className="text-white/40">{t('sharesAvailable')}: {listing.totalActionOffered - listing.actionSold}%</span>
                    </div>
                    <Progress value={soldPercent} className="h-1.5 bg-white/5 [&>div]:bg-gold-500" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    render={<Link href={`/checkout/${listing.id}` as any} />}
                    className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 text-xs"
                    disabled={listing.status !== 'active'}
                  >
                    {t('buyShares')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
