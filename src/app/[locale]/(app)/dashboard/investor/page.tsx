'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent, formatDate, formatMarkup } from '@/lib/format';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { getPlayerColorTone } from '@/lib/player-colors';
import {
  DollarSign, TrendingUp, BarChart3, Layers, ArrowUpRight, ArrowDownRight,
  Loader2, ChevronDown, ChevronUp, Calendar, MapPin, Users, CreditCard,
  Check, ExternalLink,
} from 'lucide-react';
import { WalletBalance } from '@/components/shared/wallet-balance';

export default function InvestorDashboardPage() {
  const t = useTranslations('dashboard.investor');
  const locale = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPortfolio, setExpandedPortfolio] = useState<string | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/investor')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const apiStats = data?.stats || { totalBacked: 0, activeInvestments: 0, totalReturns: 0, roi: 0 };

  const stats = [
    { label: t('totalInvested'), value: formatCurrency(apiStats.totalBacked), icon: DollarSign, trend: '', up: true },
    { label: t('activeInvestments'), value: String(apiStats.activeInvestments), icon: Layers, trend: '', up: true },
    { label: t('totalReturns'), value: formatCurrency(apiStats.totalReturns), icon: TrendingUp, trend: '', up: true },
    { label: t('roi'), value: `${apiStats.roi >= 0 ? '+' : ''}${apiStats.roi}%`, icon: BarChart3, trend: '', up: apiStats.roi >= 0 },
  ];

  const portfolio = data?.portfolio || [];
  const transactions = data?.transactions || [];

  const statusColors: Record<string, string> = {
    active: 'border-green-500/30 bg-green-500/10 text-green-400',
    filled: 'border-gold-500/30 bg-gold-500/10 text-gold-400',
    pending_result: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    settled: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    in_progress: 'border-gold-500/30 bg-gold-500/10 text-gold-400',
    buy_in_released: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    registered: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    pending_deposit: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    cancelled: 'border-red-500/30 bg-red-500/10 text-red-400',
  };

  const statusLabel: Record<string, string> = {
    active: t('statusActive'),
    filled: t('statusFilled'),
    pending_result: t('statusPendingResult'),
    settled: t('statusSettled'),
    in_progress: t('statusInProgress'),
    buy_in_released: t('statusBuyInReleased'),
    registered: t('statusRegistered'),
    pending_deposit: t('statusPendingDeposit'),
    cancelled: t('statusCancelled'),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-white/50">{t('welcome', { name: user?.displayName || 'Backer' })}</p>
        </div>
        <Button render={<Link href="/marketplace" />} className="bg-gold-500 text-black font-semibold hover:bg-gold-400">
          {t('browseMarketplace')}
        </Button>
      </div>

      <WalletBalance />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
                  <s.icon className="h-5 w-5 text-gold-400" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs ${s.up ? 'text-green-400' : 'text-red-400'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold-400" /></div>
      ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio */}
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardHeader><CardTitle className="text-white text-sm">{t('portfolio')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {portfolio.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">{t('noInvestments')}</p>
            ) : portfolio.map((l: any) => {
              const name = locale === 'zh-TW' && l.player?.displayNameZh ? l.player.displayNameZh : l.player?.displayName || 'Player';
              const tName = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || 'Tournament';
              const isExpanded = expandedPortfolio === l.id;
              const tone = getPlayerColorTone(l.player?.colorTone);
              const inv = l.investment;
              const soldPct = l.totalSharesOffered > 0 ? (l.sharesSold / l.totalSharesOffered) * 100 : 0;

              return (
                <div key={l.id} className="rounded-xl overflow-hidden transition-all">
                  {/* Clickable summary row */}
                  <button
                    onClick={() => setExpandedPortfolio(isExpanded ? null : l.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      isExpanded ? `bg-white/[0.05] ${tone.border} border` : 'bg-white/[0.03] hover:bg-white/[0.05]'
                    }`}
                  >
                    {l.player?.avatarUrl && (
                      <PlayerAvatar
                        src={l.player.avatarUrl}
                        name={l.player.displayName || ''}
                        className="h-9 w-9 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{name}</p>
                        {l.player?.isVerified && (
                          <span className="flex-shrink-0 inline-flex items-center justify-center h-3 w-3 rounded-full bg-gold-400/80">
                            <Check className="h-2 w-2 text-black" strokeWidth={3.5} />
                          </span>
                        )}
                        {l.status && (
                          <Badge variant="outline" className={`text-[10px] ${statusColors[l.status] || 'border-white/10 text-white/40'}`}>
                            {statusLabel[l.status] || l.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">{tName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-white">
                        {inv ? formatCurrency(inv.amountPaid) : formatCurrency((l.tournament?.buyIn || 0) * 0.1)}
                      </p>
                      <span className={`text-xs ${(l.player?.stats?.lifetimeROI || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(l.player?.stats?.lifetimeROI || 0)}
                      </span>
                    </div>
                    <div className="flex-shrink-0 ml-1">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-white/30" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/30" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className={`border border-t-0 rounded-b-xl p-4 space-y-3 ${tone.border} bg-white/[0.02]`}>
                      {/* Tournament details */}
                      {l.tournament && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{t('tournamentDetails')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-white/[0.03] p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <DollarSign className="h-3 w-3 text-white/40" />
                                <span className="text-[10px] text-white/40">{t('buyInLabel')}</span>
                              </div>
                              <p className="text-sm font-semibold text-white">{formatCurrency(l.tournament.buyIn)}</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3 w-3 text-white/40" />
                                <span className="text-[10px] text-white/40">{t('dateLabel')}</span>
                              </div>
                              <p className="text-sm font-semibold text-white">{formatDate(l.tournament.date, locale)}</p>
                            </div>
                            {l.tournament.venue && (
                              <div className="rounded-lg bg-white/[0.03] p-2.5 col-span-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <MapPin className="h-3 w-3 text-white/40" />
                                  <span className="text-[10px] text-white/40">{t('venueLabel')}</span>
                                </div>
                                <p className="text-xs text-white/70">
                                  {locale === 'zh-TW' && l.tournament.venueZh ? l.tournament.venueZh : l.tournament.venue}
                                </p>
                              </div>
                            )}
                          </div>
                          {l.tournament.guaranteedPool > 0 && (
                            <div className="flex items-center gap-2 text-xs text-white/40">
                              <Users className="h-3 w-3" />
                              <span>{t('guaranteed')}: {formatCurrency(l.tournament.guaranteedPool)}</span>
                              <span>·</span>
                              <span>{l.tournament.type} · {l.tournament.game}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Investment details */}
                      {inv && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{t('yourInvestment')}</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                              <p className="text-[10px] text-white/40">{t('sharesBought')}</p>
                              <p className="text-sm font-semibold text-white">{inv.sharesPurchased}%</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                              <p className="text-[10px] text-white/40">{t('amountPaid')}</p>
                              <p className="text-sm font-semibold text-gold-400">{formatCurrency(inv.amountPaid)}</p>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] p-2.5 text-center">
                              <p className="text-[10px] text-white/40">{t('markupLabel')}</p>
                              <p className="text-sm font-semibold text-white">{formatMarkup(l.markup)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-white/40">
                            <span>{t('investedOn')}: {formatDate(inv.investedAt, locale)}</span>
                            {inv.platformFee > 0 && <span>{t('fee')}: {formatCurrency(inv.platformFee)}</span>}
                          </div>
                        </div>
                      )}

                      {/* Listing funding progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-white/40">
                          <span>{t('fundingProgress')}</span>
                          <span>{l.sharesSold}% / {l.totalSharesOffered}%</span>
                        </div>
                        <Progress value={soldPct} className="h-1.5 bg-white/5 [&>div]:bg-gold-500" />
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        {l.player?.id && (
                          <Button
                            render={<Link href={`/player/${l.player.id}` as any} />}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/10 text-white/60 hover:text-white text-xs"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" /> {t('viewPlayer')}
                          </Button>
                        )}
                        <Button
                          render={<Link href={`/checkout/${l.id}` as any} />}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gold-500/20 text-gold-400 hover:bg-gold-500/10 text-xs"
                        >
                          {t('viewListing')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardHeader><CardTitle className="text-white text-sm">{t('transactions')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">{t('noTransactions')}</p>
            ) : transactions.slice(0, 10).map((tx: any) => {
              const isExpanded = expandedTx === tx.id;
              const isIncome = ['payout', 'deposit', 'refund'].includes(tx.type);
              const txTypeLabels: Record<string, string> = {
                purchase: t('txPurchase'),
                payout: t('txPayout'),
                refund: t('txRefund'),
                fee: t('txFee'),
                deposit: t('txDeposit'),
                withdrawal: t('txWithdrawal'),
                prize_deposit: t('txPrizeDeposit'),
                buy_in_release: t('txBuyInRelease'),
              };

              return (
                <div key={tx.id} className="rounded-xl overflow-hidden">
                  {/* Clickable summary */}
                  <button
                    onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      isExpanded ? 'bg-white/[0.05] border border-white/[0.08]' : 'bg-white/[0.03] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {locale === 'zh-TW' && tx.descriptionZh ? tx.descriptionZh : tx.description || txTypeLabels[tx.type] || tx.type}
                      </p>
                      <p className="text-xs text-white/40">{formatDate(tx.createdAt, locale)} · {tx.paymentMethod || '-'}</p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <div>
                        <p className={`text-sm font-medium ${isIncome ? 'text-green-400' : 'text-white'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <Badge variant="outline" className={`text-[10px] ${
                          tx.status === 'completed' ? 'border-green-500/30 text-green-400' :
                          tx.status === 'pending' ? 'border-yellow-500/30 text-yellow-400' :
                          'border-red-500/30 text-red-400'
                        }`}>{tx.status === 'completed' ? t('txCompleted') : tx.status === 'pending' ? t('txPending') : t('txFailed')}</Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-white/30" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/30" />
                      )}
                    </div>
                  </button>

                  {/* Expanded transaction detail */}
                  {isExpanded && (
                    <div className="border border-t-0 border-white/[0.08] rounded-b-xl p-4 bg-white/[0.02] space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white/[0.03] p-2.5">
                          <p className="text-[10px] text-white/40">{t('txType')}</p>
                          <p className="text-sm font-semibold text-white">{txTypeLabels[tx.type] || tx.type}</p>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-2.5">
                          <p className="text-[10px] text-white/40">{t('txAmount')}</p>
                          <p className={`text-sm font-semibold ${isIncome ? 'text-green-400' : 'text-white'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-2.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <CreditCard className="h-3 w-3 text-white/40" />
                            <p className="text-[10px] text-white/40">{t('txPaymentMethod')}</p>
                          </div>
                          <p className="text-sm font-semibold text-white">{tx.paymentMethod || '-'}</p>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-2.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Calendar className="h-3 w-3 text-white/40" />
                            <p className="text-[10px] text-white/40">{t('txDate')}</p>
                          </div>
                          <p className="text-sm font-semibold text-white">{formatDate(tx.createdAt, locale)}</p>
                        </div>
                      </div>
                      {tx.currency && (
                        <p className="text-xs text-white/30">{t('txCurrency')}: {tx.currency}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
