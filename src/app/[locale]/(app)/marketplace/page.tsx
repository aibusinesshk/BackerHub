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
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { TournamentBrandBanner } from '@/components/shared/tournament-brand-banner';
import { getPlayerColorTone } from '@/lib/player-colors';
import { Search, Filter, Check, TrendingUp, Loader2, ArrowUpDown, ChevronDown, ChevronUp, Package, Calendar, SlidersHorizontal } from 'lucide-react';
import type { StakingListing, PackageListing } from '@/types';

type SortOption = 'newest' | 'priceLow' | 'priceHigh' | 'markupLow' | 'dateSoon' | 'roi';
type PriceRange = 'all' | 'low' | 'mid' | 'high' | 'ultra';
type ListingTypeFilter = 'all' | 'single' | 'package';

// Unified item that can be either a single listing or a package
type MarketplaceItem =
  | { kind: 'single'; data: StakingListing }
  | { kind: 'package'; data: PackageListing };

function detectBrand(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes('APT')) return 'APT';
  if (upper.includes('TMT')) return 'TMT';
  if (upper.includes('WPT')) return 'WPT';
  if (upper.includes('WSOP')) return 'WSOP';
  if (upper.includes('CTP')) return 'CTP';
  if (upper.includes('CPPT')) return 'CPPT';
  return 'Other';
}

function matchesPriceRange(buyIn: number, range: PriceRange): boolean {
  switch (range) {
    case 'low': return buyIn < 500;
    case 'mid': return buyIn >= 500 && buyIn < 2000;
    case 'high': return buyIn >= 2000 && buyIn < 5000;
    case 'ultra': return buyIn >= 5000;
    default: return true;
  }
}

function getItemCreatedAt(item: MarketplaceItem): number {
  return new Date(item.data.createdAt).getTime();
}

function getItemMarkup(item: MarketplaceItem): number {
  return item.data.markup;
}

function getItemROI(item: MarketplaceItem): number {
  return item.data.player?.stats.lifetimeROI ?? 0;
}

function getItemBuyIn(item: MarketplaceItem): number {
  if (item.kind === 'single') return item.data.tournament?.buyIn ?? 0;
  return item.data.budgetMin;
}

function getItemDate(item: MarketplaceItem): number {
  if (item.kind === 'single') return new Date(item.data.tournament?.date ?? 0).getTime();
  return new Date(item.data.festivalStart).getTime();
}

function sortItems(items: MarketplaceItem[], sort: SortOption): MarketplaceItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'priceLow': return getItemBuyIn(a) - getItemBuyIn(b);
      case 'priceHigh': return getItemBuyIn(b) - getItemBuyIn(a);
      case 'markupLow': return getItemMarkup(a) - getItemMarkup(b);
      case 'dateSoon': return getItemDate(a) - getItemDate(b);
      case 'roi': return getItemROI(b) - getItemROI(a);
      case 'newest':
      default: return getItemCreatedAt(b) - getItemCreatedAt(a);
    }
  });
}

export default function MarketplacePage() {
  const t = useTranslations('marketplace');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState('active');
  const [listingType, setListingType] = useState<ListingTypeFilter>('all');
  const [allListings, setAllListings] = useState<StakingListing[]>([]);
  const [allPackages, setAllPackages] = useState<PackageListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchListings = fetch('/api/listings', { signal })
      .then((res) => res.json())
      .then((data) => setAllListings(data.listings || []))
      .catch((err) => { if (err.name !== 'AbortError') setAllListings([]); });

    const fetchPackages = fetch('/api/packages', { signal })
      .then((res) => res.json())
      .then((data) => setAllPackages(data.packages || []))
      .catch((err) => { if (err.name !== 'AbortError') setAllPackages([]); });

    Promise.all([fetchListings, fetchPackages]).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // Build unified items list
  const allItems = useMemo<MarketplaceItem[]>(() => {
    const singles: MarketplaceItem[] = allListings.map((l) => ({ kind: 'single' as const, data: l }));
    const pkgs: MarketplaceItem[] = allPackages.map((p) => ({ kind: 'package' as const, data: p }));
    return [...singles, ...pkgs];
  }, [allListings, allPackages]);

  // Derive available brands from data
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    allListings.forEach((l) => {
      if (l.tournament?.name) brands.add(detectBrand(l.tournament.name));
    });
    allPackages.forEach((p) => {
      if (p.festivalBrand) brands.add(p.festivalBrand);
    });
    return Array.from(brands).sort();
  }, [allListings, allPackages]);

  const filtered = useMemo(() => {
    const results = allItems.filter((item) => {
      // Listing type filter
      if (listingType === 'single' && item.kind !== 'single') return false;
      if (listingType === 'package' && item.kind !== 'package') return false;

      // Status filter
      if (statusFilter !== 'all' && item.data.status !== statusFilter) return false;

      if (item.kind === 'single') {
        const l = item.data;
        if (typeFilter !== 'all' && l.tournament?.type !== typeFilter) return false;
        if (regionFilter !== 'all' && l.tournament?.region !== regionFilter) return false;
        if (brandFilter !== 'all' && l.tournament?.name && detectBrand(l.tournament.name) !== brandFilter) return false;
        if (priceRange !== 'all' && l.tournament?.buyIn != null && !matchesPriceRange(l.tournament.buyIn, priceRange)) return false;
        if (search) {
          const q = search.toLowerCase();
          const name = locale === 'zh-TW' && l.player?.displayNameZh ? l.player.displayNameZh : l.player?.displayName || '';
          const tourney = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || '';
          return name.toLowerCase().includes(q) || tourney.toLowerCase().includes(q);
        }
      } else {
        const p = item.data;
        if (typeFilter !== 'all') return false; // packages don't have a single tournament type
        if (regionFilter !== 'all' && p.region !== regionFilter) return false;
        if (brandFilter !== 'all' && p.festivalBrand !== brandFilter) return false;
        if (priceRange !== 'all' && !matchesPriceRange(p.budgetMin, priceRange)) return false;
        if (search) {
          const q = search.toLowerCase();
          const name = locale === 'zh-TW' && p.player?.displayNameZh ? p.player.displayNameZh : p.player?.displayName || '';
          const festival = locale === 'zh-TW' && p.festivalNameZh ? p.festivalNameZh : p.festivalName;
          return name.toLowerCase().includes(q) || festival.toLowerCase().includes(q);
        }
      }
      return true;
    });
    return sortItems(results, sortBy);
  }, [allItems, search, typeFilter, regionFilter, brandFilter, priceRange, sortBy, statusFilter, listingType, locale]);

  const statusColors: Record<string, string> = {
    active: 'border-green-500/30 bg-green-500/10 text-green-400',
    filled: 'border-gold-500/30 bg-gold-500/10 text-gold-400',
    completed: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    cancelled: 'border-red-500/30 bg-red-500/10 text-red-400',
    in_progress: 'border-green-500/30 bg-green-500/10 text-green-400',
    pending_result: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    settled: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  };

  const sortLabels: Record<SortOption, string> = {
    newest: t('sortNewest'),
    priceLow: t('sortPriceLow'),
    priceHigh: t('sortPriceHigh'),
    markupLow: t('sortMarkupLow'),
    dateSoon: t('sortDateSoon'),
    roi: t('sortROI'),
  };

  const activeFilterCount = [typeFilter, regionFilter, brandFilter, priceRange, listingType].filter((f) => f !== 'all').length;

  const resetAllFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setRegionFilter('all');
    setBrandFilter('all');
    setPriceRange('all');
    setSortBy('newest');
    setStatusFilter('all');
    setListingType('all');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="mt-2 text-white/50">{t('subtitle')}</p>
      </div>

      {/* Search + Sort row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        {/* Sort dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white/70 hover:text-white gap-1.5"
            onClick={() => setShowSortMenu(!showSortMenu)}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortLabels[sortBy]}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-white/10 bg-[#1a1d24] shadow-xl py-1">
                {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${sortBy === key ? 'text-gold-400 font-semibold' : 'text-white/60'}`}
                    onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                  >
                    {sortLabels[key]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter toggle */}
      <div className="mb-3 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full border-white/10 text-white/60 hover:text-white gap-2 justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t('filterByTournament')}
            {activeFilterCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-gold-500/30 bg-gold-500/10 text-gold-400 ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </span>
          {showMobileFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Filter rows — always visible on desktop, collapsible on mobile */}
      <div className={`mb-6 space-y-3 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
        {/* Row 0: Listing type (Single vs Package) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/30 w-14 flex-shrink-0">{t('filterType')}</span>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'single', 'package'] as ListingTypeFilter[]).map((lt) => {
              const labels: Record<ListingTypeFilter, string> = {
                all: t('listingTypeAll'),
                single: t('listingTypeSingle'),
                package: t('listingTypePackage'),
              };
              return (
                <Button
                  key={lt}
                  variant={listingType === lt ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setListingType(lt)}
                  className={`h-7 text-xs px-2.5 ${listingType === lt ? 'bg-gold-500 text-black hover:bg-gold-400' : 'border-white/10 text-white/50 hover:text-white'}`}
                >
                  {lt === 'package' && <Package className="h-3 w-3 mr-1" />}
                  {labels[lt]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Row 1: Type + Brand */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/30 w-14 flex-shrink-0">{t('filterByTournament')}</span>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'MTT', 'SAT'].map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type)}
                className={`h-7 text-xs px-2.5 ${typeFilter === type ? 'bg-gold-500 text-black hover:bg-gold-400' : 'border-white/10 text-white/50 hover:text-white'}`}
              >
                {type === 'all' ? t('allTypes') : type}
              </Button>
            ))}
          </div>

          <span className="text-white/10 mx-1">|</span>

          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={brandFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBrandFilter('all')}
              className={`h-7 text-xs px-2.5 ${brandFilter === 'all' ? 'bg-gold-500 text-black hover:bg-gold-400' : 'border-white/10 text-white/50 hover:text-white'}`}
            >
              {t('allBrands')}
            </Button>
            {availableBrands.map((brand) => (
              <Button
                key={brand}
                variant={brandFilter === brand ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBrandFilter(brand)}
                className={`h-7 text-xs px-2.5 ${brandFilter === brand ? 'bg-gold-500 text-black hover:bg-gold-400' : 'border-white/10 text-white/50 hover:text-white'}`}
              >
                {brand}
              </Button>
            ))}
          </div>
        </div>

        {/* Row 2: Region + Price range */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/30 w-14 flex-shrink-0">{t('filterByRegion')}</span>
          <div className="flex gap-1.5">
            {['all', 'TW', 'HK'].map((r) => (
              <Button
                key={r}
                variant={regionFilter === r ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRegionFilter(r)}
                className={`h-7 text-xs px-2.5 ${regionFilter === r ? 'bg-gold-500 text-black hover:bg-gold-400' : 'border-white/10 text-white/50 hover:text-white'}`}
              >
                {r === 'all' ? t('allRegions') : r === 'TW' ? '🇹🇼 TW' : '🇭🇰 HK'}
              </Button>
            ))}
          </div>

          <span className="text-white/10 mx-1">|</span>

          <span className="text-xs text-white/30 flex-shrink-0">{t('filterByBuyIn')}</span>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'low', 'mid', 'high', 'ultra'] as PriceRange[]).map((range) => {
              const labels: Record<PriceRange, string> = {
                all: t('allPrices'),
                low: t('priceLow'),
                mid: t('priceMid'),
                high: t('priceHigh'),
                ultra: t('priceUltra'),
              };
              return (
                <Button
                  key={range}
                  variant={priceRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriceRange(range)}
                  className={`h-7 text-xs px-2.5 ${priceRange === range ? 'bg-gold-500 text-black hover:bg-gold-400' : 'border-white/10 text-white/50 hover:text-white'}`}
                >
                  {labels[range]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Active filter count + reset */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-gold-500/30 bg-gold-500/10 text-gold-400">
              {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'}
            </Badge>
            <button className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2" onClick={resetAllFilters}>
              {t('resetFilters')}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50">{t('noResults')}</p>
          <Button variant="outline" size="sm" className="mt-4 border-white/10 text-white/50" onClick={resetAllFilters}>
            {t('resetFilters')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            if (item.kind === 'single') return <SingleListingCard key={item.data.id} listing={item.data} locale={locale} t={t} statusColors={statusColors} />;
            return <PackageListingCard key={item.data.id} pkg={item.data} locale={locale} t={t} statusColors={statusColors} />;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Single Tournament Card (existing design) ───────────────────────────

function SingleListingCard({ listing, locale, t, statusColors }: {
  listing: StakingListing;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  statusColors: Record<string, string>;
}) {
  if (!listing.player || !listing.tournament) return null;
  const playerName = locale === 'zh-TW' && listing.player.displayNameZh ? listing.player.displayNameZh : listing.player.displayName;
  const tournamentName = locale === 'zh-TW' && listing.tournament.nameZh ? listing.tournament.nameZh : listing.tournament.name;
  const soldPercent = (listing.actionSold / listing.totalActionOffered) * 100;
  const playerTone = getPlayerColorTone(listing.player.colorTone);

  return (
    <Card className="border-white/[0.06] bg-[#111318] overflow-hidden transition-all hover:border-gold-500/20 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(245,184,28,0.05)] flex flex-col">
      {/* Brand banner — upper half */}
      <div className="relative">
        <TournamentBrandBanner
          tournamentName={listing.tournament.name}
          venue={locale === 'zh-TW' && listing.tournament.venueZh ? listing.tournament.venueZh : listing.tournament.venue}
          buyIn={listing.tournament.buyIn}
          type={listing.tournament.type}
        />
        {/* Status badge overlaid on banner */}
        <Badge variant="outline" className={`absolute top-3 right-3 text-[10px] backdrop-blur-sm ${statusColors[listing.status]}`}>
          {t(listing.status)}
        </Badge>
      </div>

      {/* Player info — bridging banner and content */}
      <div className="px-4 -mt-5 relative z-10">
        <div className={`flex items-center gap-3 rounded-xl bg-[#111318] border p-2.5 shadow-lg ${playerTone.border}`}>
          <PlayerAvatar
            src={listing.player.avatarUrl}
            name={listing.player.displayName}
            className="h-9 w-9 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-bold text-white truncate">{playerName}</h3>
              {listing.player.isVerified && (
                <span className="flex-shrink-0 inline-flex items-center justify-center h-3 w-3 rounded-full bg-gold-400/80">
                  <Check className="h-2 w-2 text-black" strokeWidth={3.5} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/50">{listing.player.region === 'TW' ? '🇹🇼' : listing.player.region === 'HK' ? '🇭🇰' : '🌐'}</span>
              <span className="flex items-center gap-1 text-green-400">
                <TrendingUp className="h-3 w-3" /> {formatPercent(listing.player.stats.lifetimeROI)} ROI
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 pt-3 flex-1">
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
}

// ─── Festival Package Card (new design) ─────────────────────────────────

function PackageListingCard({ pkg, locale, t, statusColors }: {
  pkg: PackageListing;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  statusColors: Record<string, string>;
}) {
  if (!pkg.player) return null;
  const playerName = locale === 'zh-TW' && pkg.player.displayNameZh ? pkg.player.displayNameZh : pkg.player.displayName;
  const festivalName = locale === 'zh-TW' && pkg.festivalNameZh ? pkg.festivalNameZh : pkg.festivalName;
  const venueName = locale === 'zh-TW' && pkg.venueZh ? pkg.venueZh : pkg.venue;
  const soldPercent = pkg.totalActionOffered > 0 ? (pkg.actionSold / pkg.totalActionOffered) * 100 : 0;
  const playerTone = getPlayerColorTone(pkg.player.colorTone);

  // Compute entries summary
  const totalSpent = pkg.entries.reduce((sum, e) => sum + e.buyIn, 0);
  const totalWon = pkg.entries.reduce((sum, e) => sum + (e.prizeAmount || 0), 0);
  const bulletsCount = pkg.entries.length;

  return (
    <Card className="border-purple-500/20 bg-[#111318] overflow-hidden transition-all hover:border-purple-400/30 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)] flex flex-col">
      {/* Package banner — purple gradient with festival branding */}
      <div className="relative">
        <TournamentBrandBanner
          tournamentName={`${pkg.festivalBrand} ${festivalName}`}
          venue={venueName}
          buyIn={pkg.budgetMax}
          type="PKG"
        />
        {/* Package badge + status overlaid on banner */}
        <Badge variant="outline" className="absolute top-3 left-3 text-[10px] backdrop-blur-sm border-purple-400/40 bg-purple-500/20 text-purple-300">
          <Package className="h-2.5 w-2.5 mr-1" />
          {t('packageBadge')}
        </Badge>
        <Badge variant="outline" className={`absolute top-3 right-3 text-[10px] backdrop-blur-sm ${statusColors[pkg.status]}`}>
          {t(pkg.status)}
        </Badge>
      </div>

      {/* Player info */}
      <div className="px-4 -mt-5 relative z-10">
        <div className={`flex items-center gap-3 rounded-xl bg-[#111318] border p-2.5 shadow-lg ${playerTone.border}`}>
          <PlayerAvatar
            src={pkg.player.avatarUrl}
            name={pkg.player.displayName}
            className="h-9 w-9 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-bold text-white truncate">{playerName}</h3>
              {pkg.player.isVerified && (
                <span className="flex-shrink-0 inline-flex items-center justify-center h-3 w-3 rounded-full bg-gold-400/80">
                  <Check className="h-2 w-2 text-black" strokeWidth={3.5} />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/50">{pkg.player.region === 'TW' ? '🇹🇼' : pkg.player.region === 'HK' ? '🇭🇰' : '🌐'}</span>
              <span className="flex items-center gap-1 text-green-400">
                <TrendingUp className="h-3 w-3" /> {formatPercent(pkg.player.stats.lifetimeROI)} ROI
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 pt-3 flex-1">
        <div>
          <h4 className="font-semibold text-white text-sm leading-tight">{festivalName}</h4>
          <div className="flex items-center gap-1.5 text-xs text-white/40 mt-0.5">
            <Calendar className="h-3 w-3" />
            {formatDate(pkg.festivalStart, locale)} – {formatDate(pkg.festivalEnd, locale)}
          </div>
        </div>

        {/* Budget + Markup */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <span className="text-white/40">{t('budget')}</span>
            <p className="font-semibold text-white text-sm">
              {formatCurrency(pkg.budgetMin)}–{formatCurrency(pkg.budgetMax)}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <span className="text-white/40">{t('markup')}</span>
            <p className="font-semibold text-gold-400 text-base">{formatMarkup(pkg.markup)}</p>
          </div>
        </div>

        {/* Planned events + bullets fired */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <span className="text-white/40">{t('plannedEvents')}</span>
            <p className="font-semibold text-white text-sm">{pkg.plannedEventsMin}–{pkg.plannedEventsMax}</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2.5">
            <span className="text-white/40">{t('bullets')}</span>
            <p className="font-semibold text-white text-sm">{t('bulletsFired', { count: bulletsCount })}</p>
          </div>
        </div>

        {/* Entries summary (if any bullets fired) */}
        {bulletsCount > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white/[0.03] p-2.5">
              <span className="text-white/40">{t('totalSpent')}</span>
              <p className="font-semibold text-white text-sm">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-2.5">
              <span className="text-white/40">{t('totalWon')}</span>
              <p className={`font-semibold text-sm ${totalWon > totalSpent ? 'text-green-400' : 'text-white'}`}>
                {formatCurrency(totalWon)}
              </p>
            </div>
          </div>
        )}

        {/* Player notes */}
        {pkg.notes && (
          <p className="text-xs text-white/40 italic line-clamp-2">
            &ldquo;{locale === 'zh-TW' && pkg.notesZh ? pkg.notesZh : pkg.notes}&rdquo;
          </p>
        )}

        {/* Shares sold progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/40">{t('sharesSold')}: {pkg.actionSold}%</span>
            <span className="text-white/40">{t('sharesAvailable')}: {pkg.totalActionOffered - pkg.actionSold}%</span>
          </div>
          <Progress value={soldPercent} className="h-1.5 bg-white/5 [&>div]:bg-purple-500" />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-purple-600 text-white font-semibold hover:bg-purple-500 text-xs"
          disabled={pkg.status !== 'active'}
        >
          {t('buyShares')}
        </Button>
      </CardFooter>
    </Card>
  );
}
