'use client';

import { use, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercent, formatDate, formatMarkup } from '@/lib/format';
import { PlayerHeroImage } from '@/components/shared/player-hero-image';
import { getPlayerColorTone } from '@/lib/player-colors';
import { Check, Star, TrendingUp, Trophy, Target, DollarSign, BarChart3, Loader2, Sparkles } from 'lucide-react';
import type { Player, StakingListing, Review } from '@/types';

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('player');
  const locale = useLocale();
  const [player, setPlayer] = useState<Player | null>(null);
  const [listings, setListings] = useState<StakingListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`/api/players/${id}`, { signal: controller.signal }).then((r) => r.json()),
      fetch(`/api/players/${id}/reviews`, { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([playerData, reviewData]) => {
        setPlayer(playerData.player || null);
        setListings(playerData.listings || []);
        setReviews(reviewData.reviews || []);
      })
      .catch((err) => { if (err.name !== 'AbortError') setPlayer(null); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold-400" /></div>;
  }

  const activeListings = listings.filter((l) => l.status === 'active');

  if (!player) {
    return <div className="py-20 text-center text-white/50">Player not found</div>;
  }

  const name = locale === 'zh-TW' && player.displayNameZh ? player.displayNameZh : player.displayName;
  const bio = locale === 'zh-TW' && player.bioZh ? player.bioZh : player.bio;
  const tone = getPlayerColorTone(player.colorTone);
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const stats = [
    { label: t('lifetimeROI'), value: formatPercent(player.stats.lifetimeROI), icon: TrendingUp, color: 'text-green-400' },
    { label: t('totalTournaments'), value: String(player.stats.totalTournaments), icon: Trophy, color: 'text-gold-400' },
    { label: t('cashRate'), value: `${player.stats.cashRate}%`, icon: Target, color: 'text-blue-400' },
    { label: t('totalStaked'), value: formatCurrency(player.stats.totalStakedValue), icon: DollarSign, color: 'text-white' },
    { label: t('biggestWin'), value: formatCurrency(player.stats.biggestWin), icon: Trophy, color: 'text-gold-400' },
    { label: t('avgFinish'), value: player.stats.avgFinish, icon: BarChart3, color: 'text-purple-400' },
  ];

  const roiData = player.stats.monthlyROI || [];
  const maxROI = roiData.length > 0 ? Math.max(...roiData.map((d) => Math.abs(d.roi))) : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Player Header with Large Photo */}
          <Card className={`${tone.border} bg-[#111318] overflow-hidden`}>
            <div className={`relative h-56 sm:h-64 bg-gradient-to-br ${tone.gradient}`} style={{ backgroundImage: tone.pattern }}>
              <PlayerHeroImage
                src={player.avatarUrl}
                alt={name}
                initials={player.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#111318] to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{name}</h1>
                  {player.isVerified ? (
                    <Badge className="border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs backdrop-blur-sm"><span className="mr-1 inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-gold-400"><Check className="h-2 w-2 text-black" strokeWidth={3} /></span>{t('verified')}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-white/10 text-white/40 backdrop-blur-sm">{t('unverified')}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-white/60">
                    <span role="img" aria-label={player.region === 'TW' ? 'Taiwan' : 'Hong Kong'}>{player.region === 'TW' ? '🇹🇼' : '🇭🇰'}</span> · {t('memberSince', { date: formatDate(player.memberSince, locale) })}
                  </p>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(avgRating) ? 'text-gold-400 fill-gold-400' : 'text-white/20'}`} />
                      ))}
                      <span className="text-xs text-white/40 ml-1">({reviews.length})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {bio && (
              <CardContent className="pt-4 pb-5">
                <p className="text-sm text-white/60">{bio}</p>
              </CardContent>
            )}
          </Card>

          {player.stats.totalTournaments > 0 ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <Card key={s.label} className="border-white/[0.06] bg-[#111318]">
                    <CardContent className="pt-4 pb-4 text-center">
                      <s.icon className={`mx-auto h-5 w-5 ${s.color} mb-2`} />
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-white/40">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ROI Chart */}
              {roiData.length > 0 && (
                <Card className="border-white/[0.06] bg-[#111318]">
                  <CardHeader><CardTitle className="text-white text-sm">{t('roiHistory')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-1 h-32">
                      {roiData.map((d) => {
                        const height = Math.abs(d.roi) / maxROI * 100;
                        return (
                          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col items-center" style={{ height: '100px' }}>
                              <div className="flex-1" />
                              <div
                                className={`w-full rounded-sm ${d.roi >= 0 ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                                style={{ height: `${height}%`, minHeight: '2px' }}
                              />
                            </div>
                            <span className="text-[8px] text-white/30">{d.month.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* New player notice */
            <Card className={`${tone.border} bg-[#111318]`}>
              <CardContent className="py-10 text-center">
                <Sparkles className={`mx-auto h-8 w-8 mb-3 ${tone.accent}`} />
                <Badge variant="outline" className={`text-xs mb-2 ${tone.accent} ${tone.border}`}>
                  {t('newPlayer')}
                </Badge>
                <p className="text-sm text-white/50 max-w-md mx-auto">{t('newPlayerProfileDesc')}</p>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardHeader><CardTitle className="text-white text-sm">{t('reviews')} ({reviews.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-white/40">{t('noReviews')}</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-white/5 text-white/50 text-xs">{r.reviewerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{r.reviewerName}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-gold-400 fill-gold-400' : 'text-white/20'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-white/30">{formatDate(r.createdAt, locale)}</span>
                    </div>
                    <p className="text-sm text-white/60">{locale === 'zh-TW' && r.commentZh ? r.commentZh : r.comment}</p>
                    <Separator className="bg-white/[0.06]" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Active Listings */}
        <div className="space-y-6">
          <Card className="border-white/[0.06] bg-[#111318] sticky top-20">
            <CardHeader><CardTitle className="text-white text-sm">{t('activeListings')} ({activeListings.length})</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {activeListings.length === 0 ? (
                <p className="text-sm text-white/40">{t('noListings')}</p>
              ) : (
                activeListings.map((l) => {
                  if (!l.tournament) return null;
                  const tName = locale === 'zh-TW' && l.tournament.nameZh ? l.tournament.nameZh : l.tournament.name;
                  const soldPct = (l.actionSold / l.totalActionOffered) * 100;
                  return (
                    <div key={l.id} className="rounded-xl border border-white/[0.06] p-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-white">{tName}</p>
                        <p className="text-xs text-white/40">{formatDate(l.tournament.date, locale)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-white/40">Buy-in</span><p className="text-white font-medium">{formatCurrency(l.tournament.buyIn)}</p></div>
                        <div><span className="text-white/40">Markup</span><p className="text-gold-400 font-medium">{formatMarkup(l.markup)}</p></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-white/40 mb-1">
                          <span>{l.actionSold}% sold</span>
                          <span>{l.totalActionOffered - l.actionSold}% left</span>
                        </div>
                        <Progress value={soldPct} className="h-1 bg-white/5 [&>div]:bg-gold-500" />
                      </div>
                      <Button
                        render={<Link href={`/checkout/${l.id}` as any} />}
                        className="w-full bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400"
                        size="sm"
                      >
                        Buy Shares
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
