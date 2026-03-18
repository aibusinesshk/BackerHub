'use client';

import { use, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { CRYPTO_COINS, PLATFORM_WALLET, PLATFORM_FEE_PERCENT } from '@/lib/constants';
import { formatCurrency, formatMarkup } from '@/lib/format';
import { CheckCircle, Copy, Check, Loader2 } from 'lucide-react';
import type { StakingListing } from '@/types';

export default function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params);
  const t = useTranslations('checkout');
  const tLegal = useTranslations('legal');
  const locale = useLocale();
  const router = useRouter();
  const [sharePercent, setSharePercent] = useState(10);
  const [coin, setCoin] = useState<'usdt' | 'usdc'>('usdt');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [listing, setListing] = useState<StakingListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/listings/${listingId}`)
      .then((r) => r.json())
      .then((data) => setListing(data.listing || null))
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold-400" /></div>;
  }

  if (!listing || !listing.player || !listing.tournament) {
    return <div className="py-20 text-center text-white/50">Listing not found</div>;
  }

  const baseCost = listing.tournament.buyIn * (sharePercent / 100);
  const markupCost = baseCost * (listing.markup - 1);
  const platformFee = baseCost * (PLATFORM_FEE_PERCENT / 100);
  const total = baseCost + markupCost + platformFee;

  const playerName = locale === 'zh-TW' && listing.player.displayNameZh ? listing.player.displayNameZh : listing.player.displayName;
  const tournamentName = locale === 'zh-TW' && listing.tournament.nameZh ? listing.tournament.nameZh : listing.tournament.name;

  const selectedCoin = CRYPTO_COINS.find((c) => c.id === coin);

  const copyAddress = () => {
    navigator.clipboard.writeText(PLATFORM_WALLET.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 2000);
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
                  max={listing.totalActionOffered - listing.actionSold}
                  value={sharePercent}
                  onChange={(e) => setSharePercent(parseInt(e.target.value))}
                  className="w-full accent-gold-500"
                />
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
              {/* Coin Selector */}
              <div>
                <label className="text-xs text-white/50 mb-2 block">{t('crypto')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['usdt', 'usdc'] as const).map((c) => {
                    const coinData = CRYPTO_COINS.find((x) => x.id === c)!;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCoin(c)}
                        className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                          coin === c
                            ? 'border-gold-500/50 bg-gold-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className={`text-lg font-bold ${coin === c ? 'text-gold-400' : 'text-white/40'}`}>
                          {coinData.icon}
                        </span>
                        <div className="text-left">
                          <span className={`text-xs font-medium block ${coin === c ? 'text-gold-400' : 'text-white/60'}`}>
                            {coinData.name}
                          </span>
                          <span className="text-[10px] text-white/30">{coinData.network}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                <p className="text-xs text-white/40">{t('walletAddress')} ({selectedCoin?.name} - {PLATFORM_WALLET.networkShort})</p>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                  <code className="flex-1 text-xs text-white/80 break-all font-mono">{PLATFORM_WALLET.address}</code>
                  <button onClick={copyAddress} className="flex-shrink-0 text-gold-400 hover:text-gold-300">
                    {copiedAddr ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                  <span className="text-white/50">{t('total')}</span>
                  <span className="text-gold-400 font-semibold">${total.toFixed(2)} {selectedCoin?.name}</span>
                </div>
              </div>

              <Button
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow h-12 text-base"
              >
                {processing ? t('processing') : `${t('payNow')} - ${formatCurrency(total)}`}
              </Button>
              <p className="mt-4 text-xs text-white/30 text-center">{tLegal('checkoutDisclaimer')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
