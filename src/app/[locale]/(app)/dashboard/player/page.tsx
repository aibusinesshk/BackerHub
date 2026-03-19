'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatMarkup, formatDate } from '@/lib/format';
import {
  DollarSign, TrendingUp, Layers, Tag, Plus, ArrowUpRight, Loader2,
  Trophy, Upload, Clock, AlertTriangle, XCircle,
} from 'lucide-react';
import { WalletBalance } from '@/components/shared/wallet-balance';

export default function PlayerDashboardPage() {
  const t = useTranslations('dashboard.player');
  const tr = useTranslations('tournamentResults');
  const locale = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState<Record<string, string>>({});
  const [submittingProof, setSubmittingProof] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    fetch('/api/dashboard/player')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleUploadProof(listingId: string) {
    const url = proofUrl[listingId];
    if (!url) return;
    setSubmittingProof(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}/confirm-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationProofUrl: url }),
      });
      if (res.ok) {
        setProofUrl({});
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setSubmittingProof(null);
    }
  }

  async function handleCancel(listingId: string) {
    if (!confirm(t('cancelConfirm'))) return;
    setCancellingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}/cancel`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  }

  function isDeadlineWarning(deadline: string | null): boolean {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000; // < 24 hours
  }

  function isDeadlineOverdue(deadline: string | null): boolean {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  }

  const apiStats = data?.stats || { totalEarnings: 0, totalSharesSold: 0, activeListings: 0, avgMarkup: 1.10 };
  const playerListings = data?.listings || [];

  const stats = [
    { label: t('totalEarnings'), value: formatCurrency(apiStats.totalEarnings), icon: DollarSign },
    { label: t('sharesSold'), value: `${apiStats.totalSharesSold}%`, icon: TrendingUp },
    { label: t('activeListings'), value: String(apiStats.activeListings), icon: Layers },
    { label: t('avgMarkup'), value: `${apiStats.avgMarkup}x`, icon: Tag },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-white/50">{t('welcome', { name: user?.displayName || 'Player' })}</p>
        </div>
        <Button render={<Link href="/create-listing" />} className="bg-gold-500 text-black font-semibold hover:bg-gold-400">
          <Plus className="mr-2 h-4 w-4" /> {t('createListing')}
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
      <Card className="border-white/[0.06] bg-[#111318]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">{t('yourListings')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {playerListings.length === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">{t('noListings')}</p>
          ) : (
            <div className="space-y-4">
              {playerListings.map((l: any) => {
                const tName = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || 'Tournament';
                const soldPct = (l.actionSold / l.totalActionOffered) * 100;
                const statusColors: Record<string, string> = {
                  active: 'border-green-500/30 bg-green-500/10 text-green-400',
                  filled: 'border-gold-500/30 bg-gold-500/10 text-gold-400',
                  buy_in_released: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
                  registered: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
                  in_progress: 'border-gold-500/30 bg-gold-500/10 text-gold-400',
                  pending_result: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
                  pending_deposit: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                  settled: 'border-green-500/30 bg-green-500/10 text-green-400',
                  cancelled: 'border-red-500/30 bg-red-500/10 text-red-400',
                };
                const statusLabels: Record<string, string> = {
                  active: tr('lifecycleActive'),
                  filled: tr('lifecycleFilled'),
                  buy_in_released: tr('lifecycleBuyInReleased'),
                  registered: tr('lifecycleRegistered'),
                  in_progress: tr('lifecycleInProgress'),
                  pending_result: tr('lifecyclePendingResult'),
                  pending_deposit: tr('lifecyclePendingDeposit'),
                  settled: tr('lifecycleSettled'),
                  cancelled: tr('result_cancelled'),
                };
                const canSubmitResult = ['registered', 'in_progress'].includes(l.status);
                const canCancel = l.status === 'active';
                const needsRegistrationProof = l.status === 'buy_in_released';
                const needsPrizeDeposit = l.status === 'pending_deposit';

                return (
                  <div key={l.id} className="rounded-xl bg-white/[0.03] p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-medium text-white">{tName}</p>
                          <Badge variant="outline" className={`text-[10px] ${statusColors[l.status] || 'border-white/10 text-white/40'}`}>
                            {statusLabels[l.status] || l.status}
                          </Badge>
                          {l.resultStatus && (
                            <Badge variant="outline" className={`text-[10px] ${
                              l.resultStatus === 'pending_review' ? 'border-yellow-500/30 text-yellow-400' :
                              l.resultStatus === 'approved' ? 'border-green-500/30 text-green-400' :
                              l.resultStatus === 'rejected' ? 'border-red-500/30 text-red-400' :
                              'border-white/10 text-white/40'
                            }`}>
                              {l.resultStatus === 'pending_review' ? tr('pendingReview') :
                               l.resultStatus === 'approved' ? tr('approved') :
                               l.resultStatus === 'rejected' ? tr('rejected') : l.resultStatus}
                            </Badge>
                          )}
                          {/* Deadline warning badges */}
                          {needsRegistrationProof && isDeadlineOverdue(l.deadlineRegistration) && (
                            <Badge variant="outline" className="text-[10px] border-red-500/30 bg-red-500/10 text-red-400 animate-pulse">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Overdue
                            </Badge>
                          )}
                          {needsRegistrationProof && isDeadlineWarning(l.deadlineRegistration) && (
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400">
                              <Clock className="h-2.5 w-2.5 mr-0.5" /> &lt; 24h
                            </Badge>
                          )}
                          {needsPrizeDeposit && isDeadlineOverdue(l.deadlineDeposit) && (
                            <Badge variant="outline" className="text-[10px] border-red-500/30 bg-red-500/10 text-red-400 animate-pulse">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{l.tournament?.date ? formatDate(l.tournament.date, locale) : ''} · Buy-in: {formatCurrency(l.tournament?.buyIn || 0)} · Markup: {formatMarkup(l.markup)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {canSubmitResult && (
                          <Button render={<Link href={`/submit-result/${l.id}`} />} size="sm" variant="outline" className="border-gold-500/30 text-gold-400 hover:bg-gold-500/10 text-xs">
                            <Trophy className="mr-1 h-3 w-3" /> {tr('submitResult')}
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                            onClick={() => handleCancel(l.id)}
                            disabled={cancellingId === l.id}
                          >
                            {cancellingId === l.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            {cancellingId === l.id ? t('cancelling') : t('cancelListing')}
                          </Button>
                        )}
                        <div className="w-32 sm:w-48">
                          <div className="flex justify-between text-[10px] text-white/40 mb-1">
                            <span>{l.actionSold}% sold</span>
                            <span>{l.totalActionOffered}% offered</span>
                          </div>
                          <Progress value={soldPct} className="h-1.5 bg-white/5 [&>div]:bg-gold-500" />
                        </div>
                      </div>
                    </div>

                    {/* Registration proof upload (when buy-in has been released) */}
                    {needsRegistrationProof && (
                      <div className={`rounded-lg border p-3 space-y-2 ${
                        isDeadlineOverdue(l.deadlineRegistration)
                          ? 'border-red-500/20 bg-red-500/5'
                          : 'border-blue-500/20 bg-blue-500/5'
                      }`}>
                        <div className="flex items-start gap-2">
                          <Upload className={`h-4 w-4 mt-0.5 shrink-0 ${isDeadlineOverdue(l.deadlineRegistration) ? 'text-red-400' : 'text-blue-400'}`} />
                          <div className="flex-1">
                            <p className="text-xs text-blue-200/80">{tr('buyInReleasedDesc')}</p>
                            <p className="text-[10px] text-blue-200/50 mt-1">{tr('registrationProofHelp')}</p>
                          </div>
                        </div>
                        {l.registrationProofUrl ? (
                          <div className="flex items-center gap-2 text-xs text-green-400">
                            <span>✓ Proof uploaded</span>
                            <a href={l.registrationProofUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">View</a>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={proofUrl[l.id] || ''}
                              onChange={(e) => setProofUrl({ ...proofUrl, [l.id]: e.target.value })}
                              placeholder="https://..."
                              className="flex-1 rounded-md bg-white/[0.03] border border-white/10 text-white text-xs px-2 py-1.5 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                            <Button
                              onClick={() => handleUploadProof(l.id)}
                              disabled={submittingProof === l.id || !proofUrl[l.id]}
                              className="bg-blue-600 text-white hover:bg-blue-500 text-xs"
                              size="sm"
                            >
                              {submittingProof === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                              {tr('uploadRegistrationProof')}
                            </Button>
                          </div>
                        )}
                        {l.deadlineRegistration && (
                          <div className={`flex items-center gap-1 text-[10px] ${
                            isDeadlineOverdue(l.deadlineRegistration) ? 'text-red-400' :
                            isDeadlineWarning(l.deadlineRegistration) ? 'text-amber-400' : 'text-white/30'
                          }`}>
                            <Clock className="h-3 w-3" />
                            Deadline: {formatDate(l.deadlineRegistration, locale)}
                            {isDeadlineOverdue(l.deadlineRegistration) && ' (OVERDUE)'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pending prize deposit notice */}
                    {needsPrizeDeposit && (
                      <div className={`rounded-lg border p-3 ${
                        isDeadlineOverdue(l.deadlineDeposit)
                          ? 'border-red-500/20 bg-red-500/5'
                          : 'border-amber-500/20 bg-amber-500/5'
                      }`}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                            isDeadlineOverdue(l.deadlineDeposit) ? 'text-red-400' : 'text-amber-400'
                          }`} />
                          <div>
                            <p className="text-xs text-amber-200/80">{tr('pendingDepositDesc')}</p>
                            <p className="text-[10px] text-amber-200/50 mt-1">
                              {tr('expectedDeposit')}: {formatCurrency(l.expectedDeposit || 0)}
                            </p>
                            {l.deadlineDeposit && (
                              <div className={`flex items-center gap-1 text-[10px] mt-1 ${
                                isDeadlineOverdue(l.deadlineDeposit) ? 'text-red-400' :
                                isDeadlineWarning(l.deadlineDeposit) ? 'text-amber-400' : 'text-white/30'
                              }`}>
                                <Clock className="h-3 w-3" />
                                {tr('depositDeadline')}: {formatDate(l.deadlineDeposit, locale)}
                                {isDeadlineOverdue(l.deadlineDeposit) && ' (OVERDUE)'}
                              </div>
                            )}
                            <p className="text-[10px] text-amber-200/50 mt-1">{tr('withdrawalLocked')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
