'use client';

import { use, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { PAYMENT_METHODS, PLATFORM_FEE_PERCENT } from '@/lib/constants';
import { formatCurrency, formatMarkup } from '@/lib/format';
import { CheckCircle, CreditCard, Wallet, Copy, Loader2 } from 'lucide-react';
import type { StakingListing } from '@/types';

export default function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params);
  const t = useTranslations('checkout');
  const tLegal = useTranslations('legal');
  const locale = useLocale();
  const router = useRouter();
  const [sharePercent, setSharePercent] = useState(10);
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
            <CardContent>
              <Tabs defaultValue="tw">
                <TabsList className="w-full bg-white/5 mb-4 flex-wrap gap-1 sm:flex-nowrap">
                  <TabsTrigger value="tw" className="flex-1 data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400 text-xs min-w-0">{'\u{1F1F9}\u{1F1FC}'} <span className="hidden sm:inline">{t('regionTW')}</span><span className="sm:hidden">TW</span></TabsTrigger>
                  <TabsTrigger value="hk" className="flex-1 data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400 text-xs min-w-0">{'\u{1F1ED}\u{1F1F0}'} <span className="hidden sm:inline">{t('regionHK')}</span><span className="sm:hidden">HK</span></TabsTrigger>
                  <TabsTrigger value="card" className="flex-1 data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400 text-xs min-w-0">{'\u{1F4B3}'} <span className="hidden sm:inline">{t('creditCard')}</span><span className="sm:hidden">Card</span></TabsTrigger>
                  <TabsTrigger value="crypto" className="flex-1 data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400 text-xs min-w-0">{'\u{20BF}'} <span className="hidden sm:inline">{t('crypto')}</span><span className="sm:hidden">Crypto</span></TabsTrigger>
                </TabsList>

                <TabsContent value="tw" className="space-y-2">
                  {PAYMENT_METHODS.taiwan.map((m) => (
                    <button key={m.id} className="w-full flex items-center gap-3 rounded-lg border border-white/[0.06] p-3 text-left transition-colors hover:border-gold-500/20 hover:bg-gold-500/5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-xs font-bold text-gold-400">{m.name.charAt(0)}</div>
                      <span className="text-sm text-white">{locale === 'zh-TW' ? m.nameZh : m.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="hk" className="space-y-2">
                  {PAYMENT_METHODS.hongkong.map((m) => (
                    <button key={m.id} className="w-full flex items-center gap-3 rounded-lg border border-white/[0.06] p-3 text-left transition-colors hover:border-gold-500/20 hover:bg-gold-500/5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white/5 text-xs font-bold text-gold-400">{m.name.charAt(0)}</div>
                      <span className="text-sm text-white">{locale === 'zh-TW' ? m.nameZh : m.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="card" className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs text-white/50">{t('cardNumber')}</label>
                    <Input placeholder="4242 4242 4242 4242" className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs text-white/50">{t('expiry')}</label>
                      <Input placeholder="MM/YY" className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-white/50">{t('cvc')}</label>
                      <Input placeholder="123" className="bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="crypto" className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {['BTC', 'ETH', 'USDT'].map((coin) => (
                      <button key={coin} className="rounded-lg border border-white/[0.06] p-3 text-center text-sm text-white/70 hover:border-gold-500/20 hover:text-gold-400 transition-colors">
                        {coin}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-4">
                    <p className="text-xs text-white/40 mb-2">{t('walletAddress')}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-white/60 break-all">0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18</code>
                      <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handlePay}
                disabled={processing}
                className="w-full mt-6 bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow h-12 text-base"
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
