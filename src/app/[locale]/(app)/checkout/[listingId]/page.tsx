'use client';

import { use, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { DepositDialog } from '@/components/shared/deposit-dialog';
import { PLATFORM_FEE_PERCENT } from '@/lib/constants';
import { formatCurrency, formatMarkup } from '@/lib/format';
import { CheckCircle, Loader2, Wallet, AlertCircle } from 'lucide-react';
import type { StakingListing } from '@/types';

export default function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params);
  const t = useTranslations('checkout');
  const tLegal = useTranslations('legal');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [sharePercent, setSharePercent] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [listing, setListing] = useState<StakingListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/listings/${listingId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setListing(data.listing || null))
      .catch((err) => { if (err.name !== 'AbortError') setListing(null); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [listingId]);

  // Fetch wallet balance when user is authenticated
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetch('/api/wallet', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setWalletBalance(data.balance ?? null))
      .catch((err) => { if (err.name !== 'AbortError') setWalletBalance(null); });
    return () => controller.abort();
  }, [user]);

  const refreshBalance = () => {
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((data) => setWalletBalance(data.balance ?? null))
      .catch(() => {});
  };

  // Auto-refresh wallet balance when deposit dialog closes
  const handleDepositClose = (open: boolean) => {
    setShowDeposit(open);
    if (!open) refreshBalance();
  };

  if (loading || authLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold-400" /></div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-gold-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('title')}</h2>
        <p className="text-white/50 mb-6">You need to be logged in to purchase action.</p>
        <Button render={<Link href="/login" />} className="bg-gold-500 text-black font-semibold hover:bg-gold-400">
          Log In
        </Button>
      </div>
    );
  }

  if (!listing || !listing.player || !listing.tournament) {
    return <div className="py-20 text-center text-white/50">Listing not found</div>;
  }

  const availableShares = listing.totalActionOffered - listing.actionSold;
  const baseCost = listing.tournament.buyIn * (sharePercent / 100);
  const markupCost = baseCost * (listing.markup - 1);
  const platformFee = baseCost * (PLATFORM_FEE_PERCENT / 100);
  const total = baseCost + markupCost + platformFee;

  const playerName = locale === 'zh-TW' && listing.player.displayNameZh ? listing.player.displayNameZh : listing.player.displayName;
  const tournamentName = locale === 'zh-TW' && listing.tournament.nameZh ? listing.tournament.nameZh : listing.tournament.name;

  const hasInsufficientBalance = walletBalance !== null && walletBalance < total;

  const handlePurchase = async () => {
    setError('');
    setProcessing(true);

    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          sharesPurchased: sharePercent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Purchase failed');
        setProcessing(false);
        return;
      }

      setProcessing(false);
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('success')}</h2>
        <p className="text-white/50 mb-6">{t('successMessage')}</p>
        <Button render={<Link href="/dashboard/investor" />} className="bg-gold-500 text-black font-semibold hover:bg-gold-400">
          {t('goToDashboard')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white mb-8">{t('title')}</h1>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardHeader><CardTitle className="text-white text-sm">{t('orderSummary')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  src={listing.player.avatarUrl}
                  name={listing.player.displayName}
                  className="h-10 w-10 border border-gold-500/20"
                  fallbackClassName="bg-gold-500/10 text-gold-400 text-xs"
                />
                <div>
                  <p className="text-sm font-medium text-white">{playerName}</p>
                  <p className="text-xs text-white/40">{tournamentName}</p>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              <div>
                <label className="mb-2 block text-sm text-white/70">{t('selectAmount')}: {sharePercent}%</label>
                <input
                  type="range"
                  min="1"
                  max={availableShares}
                  value={sharePercent}
                  onChange={(e) => { setSharePercent(parseInt(e.target.value)); setError(''); }}
                  className="w-full accent-gold-500"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>1%</span>
                  <span>{availableShares}% available</span>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/50">{t('baseCost')}</span><span className="text-white">{formatCurrency(baseCost)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">{t('markupFee', { rate: formatMarkup(listing.markup) })}</span><span className="text-white">{formatCurrency(markupCost)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">{t('platformFee')}</span><span className="text-white">{formatCurrency(platformFee)}</span></div>
                <Separator className="bg-white/[0.06]" />
                <div className="flex justify-between font-bold"><span className="text-white">{t('total')}</span><span className="text-gold-400 text-lg">{formatCurrency(total)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardHeader><CardTitle className="text-white text-sm">{t('selectPayment')}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Wallet Balance */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/10">
                    <Wallet className="h-5 w-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Wallet Balance</p>
                    <p className={`text-lg font-bold ${hasInsufficientBalance ? 'text-red-400' : 'text-gold-400'}`}>
                      {walletBalance !== null ? formatCurrency(walletBalance) : '—'}
                    </p>
                  </div>
                </div>

                {hasInsufficientBalance && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 mb-3">
                    <p className="text-xs text-red-400">
                      Insufficient balance. You need {formatCurrency(total - (walletBalance || 0))} more.
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeposit(true)}
                  className="w-full border-gold-500/20 text-gold-400 hover:bg-gold-500/10 text-xs"
                >
                  Deposit Funds
                </Button>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Purchase button */}
              <Button
                onClick={handlePurchase}
                disabled={processing || hasInsufficientBalance || walletBalance === null}
                className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow h-12 text-base disabled:opacity-50"
              >
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('processing')}</>
                ) : (
                  `${t('payNow')} - ${formatCurrency(total)}`
                )}
              </Button>
              <p className="mt-4 text-xs text-white/30 text-center">{tLegal('checkoutDisclaimer')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DepositDialog
        open={showDeposit}
        onOpenChange={handleDepositClose}
        onSuccess={refreshBalance}
      />
    </div>
  );
}
