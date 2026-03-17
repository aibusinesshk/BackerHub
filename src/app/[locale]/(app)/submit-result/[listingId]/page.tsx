'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trophy, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { Link } from '@/i18n/navigation';
import { formatCurrency } from '@/lib/format';

type TournamentResult = 'win' | 'loss' | 'cancelled';

interface ListingDetails {
  id: string;
  tournamentName: string;
  buyIn: number;
  actionPercentage: number;
  currency?: string;
}

export default function SubmitResultPage() {
  const params = useParams();
  const listingId = params.listingId as string;
  const t = useTranslations('tournamentResults');
  const { user } = useAuth();

  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [listingError, setListingError] = useState<string | null>(null);

  const [tournamentResult, setTournamentResult] = useState<TournamentResult | null>(null);
  const [prizeAmount, setPrizeAmount] = useState('');
  const [finishPosition, setFinishPosition] = useState('');
  const [totalEntries, setTotalEntries] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error('Failed to fetch listing');
        const data = await res.json();
        const l = data.listing || data;
        setListing({
          id: l.id,
          tournamentName: l.tournament?.name || l.tournamentName || 'Tournament',
          buyIn: l.tournament?.buyIn || l.buyIn || 0,
          actionPercentage: l.actionSold || l.sharesSold || l.actionPercentage || 0,
          currency: l.tournament?.currency || l.currency,
        });
      } catch {
        setListingError('Could not load listing details.');
      } finally {
        setLoadingListing(false);
      }
    }

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tournamentResult) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const body: Record<string, unknown> = {
        listingId,
        tournamentResult,
        proofUrl: proofUrl || undefined,
        notes: notes || undefined,
      };

      if (tournamentResult === 'win') {
        body.prizeAmount = parseFloat(prizeAmount);
        if (finishPosition) body.finishPosition = parseInt(finishPosition, 10);
        if (totalEntries) body.totalEntries = parseInt(totalEntries, 10);
      }

      const res = await fetch('/api/tournament-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error(t('alreadySubmitted'));
        }
        throw new Error(data.error || 'Failed to submit result');
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName =
    'w-full rounded-lg bg-white/[0.03] border border-white/10 text-white px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold-500/50';

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[#111318] border-white/[0.06]">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">{t('successTitle')}</h2>
            <p className="text-sm text-white/60">{t('successMessage')}</p>
            <Button
              render={<Link href="/dashboard/player" />}
              className="bg-gold-500 text-black font-semibold hover:bg-gold-400 mt-2"
            >
              {t('backToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-10 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
            <Trophy className="h-5 w-5 text-gold-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-white/50">{t('subtitle')}</p>
          </div>
        </div>

        {/* Listing Info */}
        {loadingListing ? (
          <Card className="bg-[#111318] border-white/[0.06]">
            <CardContent className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </CardContent>
          </Card>
        ) : listingError ? (
          <Card className="bg-[#111318] border-white/[0.06]">
            <CardContent className="py-6">
              <p className="text-sm text-red-400">{listingError}</p>
            </CardContent>
          </Card>
        ) : listing ? (
          <Card className="bg-[#111318] border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white text-base">{listing.tournamentName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/[0.06] text-white/70 border-white/10">
                  {t('buyIn')}: {formatCurrency(listing.buyIn, listing.currency)}
                </Badge>
                <Badge className="bg-gold-500/10 text-gold-500 border-gold-500/20">
                  {t('actionSold')}: {listing.actionPercentage}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Submit Form */}
        <Card className="bg-[#111318] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white text-base">{t('formTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tournament Result */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">
                  {t('resultLabel')}
                </label>
                <div className="flex gap-3">
                  {(['win', 'loss', 'cancelled'] as TournamentResult[]).map((value) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                        tournamentResult === value
                          ? 'border-gold-500/50 bg-gold-500/10 text-gold-500'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          tournamentResult === value
                            ? 'border-gold-500 bg-gold-500'
                            : 'border-white/30'
                        }`}
                      >
                        {tournamentResult === value && (
                          <div className="h-1.5 w-1.5 rounded-full bg-black" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="tournamentResult"
                        value={value}
                        checked={tournamentResult === value}
                        onChange={() => setTournamentResult(value)}
                        className="sr-only"
                      />
                      {t(`result_${value}`)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Win-specific fields */}
              {tournamentResult === 'win' && (
                <div className="space-y-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white/70">
                      {t('prizeAmount')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={prizeAmount}
                      onChange={(e) => setPrizeAmount(e.target.value)}
                      placeholder={t('prizeAmountPlaceholder')}
                      className={inputClassName}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-white/70">
                        {t('finishPosition')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={finishPosition}
                        onChange={(e) => setFinishPosition(e.target.value)}
                        placeholder={t('finishPositionPlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-white/70">
                        {t('totalEntries')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalEntries}
                        onChange={(e) => setTotalEntries(e.target.value)}
                        placeholder={t('totalEntriesPlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Proof URL */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">
                  {t('proofUrl')}
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder={t('proofUrlPlaceholder')}
                  className={inputClassName}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">
                  {t('notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  rows={3}
                  className={inputClassName}
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!tournamentResult || submitting || (tournamentResult === 'win' && !prizeAmount)}
                className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('submitButton')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/10 bg-yellow-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500/60" />
          <p className="text-xs text-white/40">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
