'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  Trophy, Loader2, CheckCircle, XCircle, ExternalLink, AlertTriangle,
  Unlock, ClipboardCheck, DollarSign, Clock, ShieldCheck, ArrowRight,
} from 'lucide-react';

export default function AdminResultsPage() {
  const t = useTranslations('tournamentResults');
  const locale = useLocale();
  const { user } = useAuth();

  const [pending, setPending] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [filledListings, setFilledListings] = useState<any[]>([]);
  const [awaitingRegistration, setAwaitingRegistration] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});
  const [confirmDepositId, setConfirmDepositId] = useState<string | null>(null);
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [resultsRes, lifecycleRes] = await Promise.all([
        fetch('/api/admin/tournament-results'),
        fetch('/api/admin/lifecycle'),
      ]);

      if (resultsRes.status === 403) {
        setForbidden(true);
        return;
      }

      if (resultsRes.ok) {
        const data = await resultsRes.json();
        setPending(data.pending || []);
        setHistory(data.history || []);
      }

      if (lifecycleRes.ok) {
        const data = await lifecycleRes.json();
        setPendingDeposits(data.pendingDeposits || []);
        setFilledListings(data.filledListings || []);
        setAwaitingRegistration(data.awaitingRegistration || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(resultId: string, action: 'approve' | 'reject') {
    setProcessing(resultId);
    try {
      const res = await fetch('/api/admin/tournament-results', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId,
          action,
          rejectionReason: action === 'reject' ? rejectReason : undefined,
        }),
      });

      if (res.ok) {
        setRejectingId(null);
        setRejectReason('');
        setConfirmApproveId(null);
        await fetchAll();
      }
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  }

  async function handleReleaseBuyIn(listingId: string) {
    setProcessing(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}/release-buyin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setConfirmReleaseId(null);
        await fetchAll();
      }
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  }

  async function handleConfirmRegistration(listingId: string) {
    setProcessing(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}/confirm-registration`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) await fetchAll();
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  }

  async function handleConfirmDeposit(listingId: string) {
    setProcessing(listingId);
    const amount = Number(depositAmounts[listingId]);
    if (!amount || amount <= 0) return;

    try {
      const res = await fetch(`/api/listings/${listingId}/confirm-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositAmount: amount }),
      });
      if (res.ok) {
        setConfirmDepositId(null);
        setDepositAmounts({});
        await fetchAll();
      }
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-red-400 text-center">Access denied. Admin only.</p>
      </div>
    );
  }

  const resultBadge = (result: string) => {
    switch (result) {
      case 'win': return <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 text-[10px]">Win</Badge>;
      case 'loss': return <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 text-[10px]">Loss</Badge>;
      case 'cancelled': return <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px]">Cancelled</Badge>;
      default: return null;
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      filled: { color: 'border-gold-500/30 bg-gold-500/10 text-gold-400', label: t('lifecycleFilled') },
      buy_in_released: { color: 'border-blue-500/30 bg-blue-500/10 text-blue-400', label: t('lifecycleBuyInReleased') },
      registered: { color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400', label: t('lifecycleRegistered') },
      pending_deposit: { color: 'border-amber-500/30 bg-amber-500/10 text-amber-400', label: t('pendingDeposit') },
      settled: { color: 'border-green-500/30 bg-green-500/10 text-green-400', label: t('lifecycleSettled') },
    };
    const info = map[status] || { color: 'border-white/10 text-white/40', label: status };
    return <Badge variant="outline" className={`text-[10px] ${info.color}`}>{info.label}</Badge>;
  };

  const totalActions = filledListings.length + awaitingRegistration.length + pending.length + pendingDeposits.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="h-6 w-6 text-gold-400" />
        <h1 className="text-2xl font-bold text-white">{t('adminTitle')}</h1>
      </div>
      <p className="text-sm text-white/50 mb-8">{t('adminSubtitle')}</p>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold-400" /></div>
      ) : (
        <Tabs defaultValue="lifecycle">
          <TabsList className="bg-white/[0.03] border border-white/10 mb-6 flex-wrap h-auto">
            <TabsTrigger value="lifecycle" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
              {t('lifecycle')} ({totalActions})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
              {t('pendingReview')} ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
              {t('pendingDeposit')} ({pendingDeposits.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
              {t('settledHistory')} ({history.length})
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════ */}
          {/* LIFECYCLE TAB - Buy-in releases & registrations */}
          {/* ═══════════════════════════════════════ */}
          <TabsContent value="lifecycle" className="space-y-6">
            {/* Filled listings needing buy-in release */}
            {filledListings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4 text-gold-400" />
                  <h3 className="text-sm font-medium text-white">{t('releaseBuyIn')}</h3>
                  <Badge variant="outline" className="border-gold-500/30 text-gold-400 text-[10px]">{filledListings.length}</Badge>
                </div>
                <p className="text-xs text-white/40">{t('releaseBuyInDesc')}</p>
                {filledListings.map((listing: any) => {
                  const tName = locale === 'zh-TW' && listing.tournament?.nameZh
                    ? listing.tournament.nameZh
                    : listing.tournament?.name || 'Tournament';
                  const pName = locale === 'zh-TW' && listing.player?.displayNameZh
                    ? listing.player.displayNameZh
                    : listing.player?.displayName || 'Player';

                  return (
                    <Card key={listing.id} className="border-white/[0.06] bg-[#111318]">
                      <CardContent className="pt-5">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{pName}</p>
                              {statusBadge('filled')}
                              {listing.reliability !== undefined && (
                                <Badge variant="outline" className="border-white/10 text-white/40 text-[10px]">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  {listing.reliability}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-white/40">{tName} · Buy-in: {formatCurrency(listing.tournament?.buyIn || 0)}</p>
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                              <p className="text-[10px] text-white/30 uppercase tracking-wider">{t('buyInBreakdown')}</p>
                              <div className="flex justify-between text-xs">
                                <span className="text-white/50">{t('backerBuyInShare')}</span>
                                <span className="text-white">{formatCurrency(listing.breakdown?.baseCost || 0)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-white/50">{t('markupProfit')}</span>
                                <span className="text-white">{formatCurrency(listing.breakdown?.markupTotal || 0)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-white/50">{t('platformFee')}</span>
                                <span className="text-white/40">{formatCurrency(listing.breakdown?.platformFee || 0)}</span>
                              </div>
                              <div className="border-t border-white/[0.06] pt-1 mt-1 flex justify-between text-xs">
                                <span className="text-white/70 font-medium">{t('totalReleased')}</span>
                                <span className="text-gold-400 font-medium">{formatCurrency(listing.breakdown?.releaseToPlayer || 0)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:min-w-[160px]">
                            {confirmReleaseId === listing.id ? (
                              <div className="space-y-2">
                                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-amber-200/70">
                                      This will release {formatCurrency(listing.breakdown?.releaseToPlayer || 0)} to the player&apos;s wallet.
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleReleaseBuyIn(listing.id)}
                                  disabled={processing === listing.id}
                                  className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 text-xs"
                                  size="sm"
                                >
                                  {processing === listing.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="mr-1 h-3 w-3" />}
                                  {t('releaseBuyIn')}
                                </Button>
                                <Button
                                  onClick={() => setConfirmReleaseId(null)}
                                  variant="outline"
                                  className="w-full border-white/10 text-white/50 hover:bg-white/5 text-xs"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => setConfirmReleaseId(listing.id)}
                                className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 text-xs"
                                size="sm"
                              >
                                <Unlock className="mr-1 h-3 w-3" /> {t('releaseBuyIn')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Awaiting registration confirmation */}
            {awaitingRegistration.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-medium text-white">{t('awaitingRegistration')}</h3>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">{awaitingRegistration.length}</Badge>
                </div>
                {awaitingRegistration.map((listing: any) => {
                  const tName = locale === 'zh-TW' && listing.tournament?.nameZh
                    ? listing.tournament.nameZh
                    : listing.tournament?.name || 'Tournament';
                  const pName = locale === 'zh-TW' && listing.player?.displayNameZh
                    ? listing.player.displayNameZh
                    : listing.player?.displayName || 'Player';

                  return (
                    <Card key={listing.id} className="border-white/[0.06] bg-[#111318]">
                      <CardContent className="pt-5">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{pName}</p>
                              {statusBadge('buy_in_released')}
                            </div>
                            <p className="text-xs text-white/40">{tName}</p>
                            {listing.registrationProofUrl ? (
                              <a href={listing.registrationProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">
                                <ExternalLink className="h-3 w-3" /> {t('registrationProof')}
                              </a>
                            ) : (
                              <p className="text-xs text-white/30 italic">{t('noProofYet')}</p>
                            )}
                            {listing.deadlineRegistration && (
                              <div className="flex items-center gap-1 text-xs text-white/30">
                                <Clock className="h-3 w-3" />
                                Deadline: {formatDate(listing.deadlineRegistration, locale)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 sm:min-w-[160px]">
                            <Button
                              onClick={() => handleConfirmRegistration(listing.id)}
                              disabled={processing === listing.id || !listing.registrationProofUrl}
                              className="w-full bg-blue-600 text-white hover:bg-blue-500 text-xs"
                              size="sm"
                            >
                              {processing === listing.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardCheck className="mr-1 h-3 w-3" />}
                              {t('confirmRegistration')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {totalActions === 0 && (
              <Card className="border-white/[0.06] bg-[#111318]">
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-white/40">No active lifecycle items</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════ */}
          {/* PENDING RESULTS TAB */}
          {/* ═══════════════════════════════════════ */}
          <TabsContent value="pending" className="space-y-4">
            {pending.length === 0 ? (
              <Card className="border-white/[0.06] bg-[#111318]">
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-white/40">{t('noPending')}</p>
                </CardContent>
              </Card>
            ) : (
              pending.map((result) => {
                const tName = locale === 'zh-TW' && result.tournament?.nameZh
                  ? result.tournament.nameZh
                  : result.tournament?.name || 'Tournament';
                const pName = locale === 'zh-TW' && result.player?.displayNameZh
                  ? result.player.displayNameZh
                  : result.player?.displayName || 'Player';

                return (
                  <Card key={result.id} className="border-white/[0.06] bg-[#111318]">
                    <CardContent className="pt-5">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{pName}</p>
                            {resultBadge(result.tournamentResult)}
                          </div>
                          <p className="text-xs text-white/40">{tName} · {result.tournament?.date ? formatDate(result.tournament.date, locale) : ''}</p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {result.tournamentResult === 'win' && (
                              <div>
                                <span className="text-white/40">{t('prizeAmount')}</span>
                                <p className="text-white font-medium">{formatCurrency(result.prizeAmount)}</p>
                              </div>
                            )}
                            {result.finishPosition && (
                              <div>
                                <span className="text-white/40">{t('placement')}</span>
                                <p className="text-white font-medium">
                                  #{result.finishPosition}{result.totalEntries ? ` ${t('of')} ${result.totalEntries}` : ''}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-white/40">Action Sold</span>
                              <p className="text-white font-medium">{result.listing?.totalSharesSold || 0}%</p>
                            </div>
                            <div>
                              <span className="text-white/40">Backers</span>
                              <p className="text-white font-medium">{result.distribution?.backerCount || 0}</p>
                            </div>
                          </div>

                          {result.tournamentResult === 'win' && result.prizeAmount > 0 && (
                            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
                              <p className="text-[10px] text-white/30 uppercase tracking-wider">{t('distribution')}</p>
                              <div className="flex justify-between text-xs">
                                <span className="text-white/50">{t('backerPayout')}</span>
                                <span className="text-green-400">{formatCurrency(result.distribution.backerPool)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-white/50">{t('playerPayout')}</span>
                                <span className="text-white">{formatCurrency(result.distribution.playerKeeps)}</span>
                              </div>
                              {result.tournamentResult === 'win' && (
                                <div className="border-t border-white/[0.06] pt-1 mt-1">
                                  <div className="flex items-center gap-1 text-[10px] text-amber-400/70">
                                    <ArrowRight className="h-3 w-3" />
                                    Player must deposit {formatCurrency(result.distribution.backerPool)} after approval
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {result.proofUrl && (
                            <a href={result.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">
                              <ExternalLink className="h-3 w-3" /> {t('viewProof')}
                            </a>
                          )}
                          {result.notes && (
                            <p className="text-xs text-white/30 italic">&ldquo;{result.notes}&rdquo;</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 sm:min-w-[160px]">
                          {confirmApproveId === result.id ? (
                            <div className="space-y-2">
                              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                  <p className="text-[10px] text-amber-200/70">
                                    {result.tournamentResult === 'win'
                                      ? 'This will approve the result and move to pending deposit. Player must deposit backer share before settlement.'
                                      : t('confirmApproveMessage')
                                    }
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleAction(result.id, 'approve')}
                                disabled={processing === result.id}
                                className="w-full bg-green-600 text-white hover:bg-green-500 text-xs"
                                size="sm"
                              >
                                {processing === result.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="mr-1 h-3 w-3" />}
                                {t('approveResult')}
                              </Button>
                              <Button
                                onClick={() => setConfirmApproveId(null)}
                                variant="outline"
                                className="w-full border-white/10 text-white/50 hover:bg-white/5 text-xs"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : rejectingId === result.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder={t('rejectReason')}
                                rows={2}
                                className="w-full rounded-md bg-white/[0.03] border border-white/10 text-white text-xs px-2 py-1.5 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                              />
                              <Button
                                onClick={() => handleAction(result.id, 'reject')}
                                disabled={processing === result.id}
                                className="w-full bg-red-600 text-white hover:bg-red-500 text-xs"
                                size="sm"
                              >
                                {processing === result.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="mr-1 h-3 w-3" />}
                                {t('reject')}
                              </Button>
                              <Button
                                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                variant="outline"
                                className="w-full border-white/10 text-white/50 hover:bg-white/5 text-xs"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                onClick={() => setConfirmApproveId(result.id)}
                                className="w-full bg-green-600 text-white hover:bg-green-500 text-xs"
                                size="sm"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" /> {t('approveResult')}
                              </Button>
                              <Button
                                onClick={() => setRejectingId(result.id)}
                                variant="outline"
                                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                                size="sm"
                              >
                                <XCircle className="mr-1 h-3 w-3" /> {t('reject')}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════ */}
          {/* PENDING DEPOSITS TAB */}
          {/* ═══════════════════════════════════════ */}
          <TabsContent value="deposits" className="space-y-4">
            {pendingDeposits.length === 0 ? (
              <Card className="border-white/[0.06] bg-[#111318]">
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-white/40">No pending prize deposits</p>
                </CardContent>
              </Card>
            ) : (
              pendingDeposits.map((item: any) => {
                const tName = locale === 'zh-TW' && item.tournament?.nameZh
                  ? item.tournament.nameZh
                  : item.tournament?.name || 'Tournament';
                const pName = locale === 'zh-TW' && item.player?.displayNameZh
                  ? item.player.displayNameZh
                  : item.player?.displayName || 'Player';

                return (
                  <Card key={item.id} className="border-amber-500/10 bg-[#111318]">
                    <CardContent className="pt-5">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{pName}</p>
                            {statusBadge('pending_deposit')}
                            <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 text-[10px]">Win</Badge>
                          </div>
                          <p className="text-xs text-white/40">{tName}</p>
                          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                            <p className="text-[10px] text-amber-200/50 uppercase tracking-wider">{t('pendingDepositDesc')}</p>
                            <div className="flex justify-between text-xs">
                              <span className="text-white/50">{t('prizeAmount')}</span>
                              <span className="text-white font-medium">{formatCurrency(item.prizeAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-white/50">{t('expectedDeposit')}</span>
                              <span className="text-amber-400 font-medium">{formatCurrency(item.expectedDeposit)}</span>
                            </div>
                            {item.deadlineDeposit && (
                              <div className="flex items-center gap-1 text-xs text-white/30">
                                <Clock className="h-3 w-3" />
                                {t('depositDeadline')}: {formatDate(item.deadlineDeposit, locale)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:min-w-[200px]">
                          {confirmDepositId === item.id ? (
                            <div className="space-y-2">
                              <label className="text-[10px] text-white/40">{t('depositAmount')}</label>
                              <input
                                type="number"
                                value={depositAmounts[item.id] || ''}
                                onChange={(e) => setDepositAmounts({ ...depositAmounts, [item.id]: e.target.value })}
                                placeholder={String(item.expectedDeposit)}
                                className="w-full rounded-md bg-white/[0.03] border border-white/10 text-white text-xs px-2 py-1.5 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                              />
                              <Button
                                onClick={() => handleConfirmDeposit(item.id)}
                                disabled={processing === item.id || !depositAmounts[item.id]}
                                className="w-full bg-amber-600 text-white hover:bg-amber-500 text-xs"
                                size="sm"
                              >
                                {processing === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="mr-1 h-3 w-3" />}
                                {t('confirmDeposit')}
                              </Button>
                              <Button
                                onClick={() => setConfirmDepositId(null)}
                                variant="outline"
                                className="w-full border-white/10 text-white/50 hover:bg-white/5 text-xs"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setConfirmDepositId(item.id)}
                              className="w-full bg-amber-600 text-white hover:bg-amber-500 text-xs"
                              size="sm"
                            >
                              <DollarSign className="mr-1 h-3 w-3" /> {t('confirmDeposit')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════ */}
          {/* HISTORY TAB */}
          {/* ═══════════════════════════════════════ */}
          <TabsContent value="history" className="space-y-3">
            {history.length === 0 ? (
              <Card className="border-white/[0.06] bg-[#111318]">
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-white/40">No settlement history yet</p>
                </CardContent>
              </Card>
            ) : (
              history.map((result) => {
                const tName = locale === 'zh-TW' && result.tournament?.nameZh
                  ? result.tournament.nameZh
                  : result.tournament?.name || 'Tournament';
                const pName = locale === 'zh-TW' && result.player?.displayNameZh
                  ? result.player.displayNameZh
                  : result.player?.displayName || 'Player';

                return (
                  <Card key={result.id} className="border-white/[0.06] bg-[#111318]">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">{pName}</p>
                            {resultBadge(result.tournamentResult)}
                            <Badge variant="outline" className={`text-[10px] ${
                              result.status === 'approved' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
                            }`}>
                              {result.status === 'approved' ? t('approved') : t('rejected')}
                            </Badge>
                          </div>
                          <p className="text-xs text-white/40">{tName}</p>
                        </div>
                        <div className="text-right">
                          {result.tournamentResult === 'win' && (
                            <p className="text-sm font-medium text-green-400">{formatCurrency(result.prizeAmount)}</p>
                          )}
                          <p className="text-[10px] text-white/30">{result.reviewedAt ? formatDate(result.reviewedAt, locale) : ''}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
