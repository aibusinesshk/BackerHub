'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatMarkup } from '@/lib/format';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { Tournament } from '@/types';

export default function CreateListingPage() {
  const t = useTranslations('createListing');
  const locale = useLocale();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [markup, setMarkup] = useState(1.10);
  const [sharesOffered, setSharesOffered] = useState(70);
  const [threshold, setThreshold] = useState(50);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch('/api/tournaments?upcoming=true')
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.tournaments || []).map((t: any) => ({
          id: t.id, name: t.name, nameZh: t.name_zh,
          venue: t.venue, venueZh: t.venue_zh, date: t.date,
          buyIn: Number(t.buy_in), guaranteedPool: Number(t.guaranteed_pool),
          type: t.type, game: t.game, region: t.region,
        }));
        setTournaments(mapped);
      })
      .catch(() => setTournaments([]))
      .finally(() => setLoadingTournaments(false));
  }, []);

  const tournament = tournaments.find((t) => t.id === selectedTournament);

  const handlePublish = async () => {
    if (!selectedTournament) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          markup,
          totalActionOffered: sharesOffered,
          minThreshold: threshold,
        }),
      });
      if (res.ok) {
        setPublished(true);
        setTimeout(() => router.push('/dashboard/player'), 2000);
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || t('publishError'));
      }
    } catch (err) {
      alert(t('publishError'));
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('success')}</h2>
        <p className="text-white/50">{t('successMessage')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-2">{t('title')}</h1>
      <p className="text-white/50 mb-8">{t('subtitle')}</p>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardHeader><CardTitle className="text-white text-sm">{t('selectTournament')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {loadingTournaments ? (
                <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gold-400" /></div>
              ) : tournaments.map((tour) => {
                const name = locale === 'zh-TW' && tour.nameZh ? tour.nameZh : tour.name;
                return (
                  <button
                    key={tour.id}
                    onClick={() => setSelectedTournament(tour.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${
                      selectedTournament === tour.id
                        ? 'border-gold-500 bg-gold-500/10'
                        : 'border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-white/40">{tour.type} · {tour.game} · {tour.region === 'TW' ? '\u{1F1F9}\u{1F1FC}' : '\u{1F1ED}\u{1F1F0}'}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-gold-500/20 text-gold-400">{formatCurrency(tour.buyIn)}</Badge>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-6 space-y-6">

              <div>
                <label className="mb-2 block text-sm text-white/70">{t('setMarkup')}: {formatMarkup(markup)}</label>
                <input
                  type="range"
                  min="1.00"
                  max="1.50"
                  step="0.01"
                  value={markup}
                  onChange={(e) => setMarkup(parseFloat(e.target.value))}
                  className="w-full accent-gold-500"
                />
                <p className="text-xs text-white/40 mt-1">{t('markupHelp')}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">{t('sharesOffered')}: {sharesOffered}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={sharesOffered}
                  onChange={(e) => setSharesOffered(parseInt(e.target.value))}
                  className="w-full accent-gold-500"
                />
                <p className="text-xs text-white/40 mt-1">{t('sharesHelp')}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">{t('minThreshold')}: {threshold}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full accent-gold-500"
                />
                <p className="text-xs text-white/40 mt-1">{t('thresholdHelp')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-white/[0.06] bg-[#111318] sticky top-20">
            <CardHeader><CardTitle className="text-white text-sm">{t('preview')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {tournament ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {locale === 'zh-TW' && tournament.nameZh ? tournament.nameZh : tournament.name}
                    </p>
                    <p className="text-xs text-white/40">{tournament.type} · {tournament.game}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-white/[0.03] p-2">
                      <span className="text-white/40">Buy-in</span>
                      <p className="font-semibold text-white">{formatCurrency(tournament.buyIn)}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2">
                      <span className="text-white/40">Markup</span>
                      <p className="font-semibold text-gold-400">{formatMarkup(markup)}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2">
                      <span className="text-white/40">Shares</span>
                      <p className="font-semibold text-white">{sharesOffered}%</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2">
                      <span className="text-white/40">Threshold</span>
                      <p className="font-semibold text-white">{threshold}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Investor cost per 10%</p>
                    <p className="text-lg font-bold text-gold-400">
                      {formatCurrency(tournament.buyIn * 0.1 * markup)}
                    </p>
                  </div>
                  <Button onClick={handlePublish} disabled={publishing} className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow">
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : t('publish')}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-white/40 py-4 text-center">Select a tournament to preview</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
