'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Trophy, Upload, Clock, AlertTriangle, XCircle, List, Palette, ShieldAlert, ShieldCheck,
  AlertCircle, RefreshCw, Brain, ImageIcon, X, FileCheck,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletBalance } from '@/components/shared/wallet-balance';
import { PLAYER_COLOR_TONES, ALL_COLOR_TONES, getPlayerColorTone } from '@/lib/player-colors';
import type { PlayerColorTone } from '@/types';

export default function PlayerDashboardPage() {
  const t = useTranslations('dashboard.player');
  const tc = useTranslations('common');
  const tr = useTranslations('tournamentResults');
  const locale = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [proofUrl, setProofUrl] = useState<Record<string, string>>({});
  const [submittingProof, setSubmittingProof] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedColorTone, setSelectedColorTone] = useState<PlayerColorTone | null>(null);
  const [savingColor, setSavingColor] = useState(false);
  const [proofImages, setProofImages] = useState<Record<string, File[]>>({});
  const [uploadingProofFor, setUploadingProofFor] = useState<string | null>(null);
  const [aiProofStatus, setAiProofStatus] = useState<Record<string, { score: number; recommendation: string; summary: string; flags: Array<{ code: string; severity: string; message: string }> }>>({});

  const fetchData = useCallback((signal?: AbortSignal) => {
    setError(false);
    fetch('/api/dashboard/player', signal ? { signal } : undefined)
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then((d) => {
        setData(d);
        if (d.profile?.color_tone) {
          setSelectedColorTone(d.profile.color_tone);
        }
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

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

  async function handleSaveColorTone(tone: PlayerColorTone) {
    setSelectedColorTone(tone);
    setSavingColor(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color_tone: tone }),
      });
    } catch {
      // ignore
    } finally {
      setSavingColor(false);
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

  function handleProofFileSelect(listingId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith('image/')).slice(0, 3);
    setProofImages(prev => ({ ...prev, [listingId]: files }));
    e.target.value = '';
  }

  async function handleUploadProofImages(listingId: string, proofType: 'buyin' | 'prize') {
    const files = proofImages[listingId];
    if (!files?.length) return;

    setUploadingProofFor(listingId);
    try {
      const formData = new FormData();
      formData.append('listingId', listingId);
      formData.append('proofType', proofType);
      files.forEach(f => formData.append('files', f));

      const uploadRes = await fetch('/api/proof/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // Trigger AI analysis
      const aiRes = await fetch('/api/ai-proof/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, proofType }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiProofStatus(prev => ({
          ...prev,
          [listingId]: {
            score: aiData.overall_score,
            recommendation: aiData.recommendation,
            summary: aiData.summary,
            flags: aiData.flags || [],
          },
        }));
      }

      // If buyin proof, also set the registration proof URL to signal it's been uploaded
      if (proofType === 'buyin') {
        await fetch(`/api/listings/${listingId}/confirm-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationProofUrl: `[AI-verified image proof]` }),
        });
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setUploadingProofFor(null);
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-white/50">{t('welcome', { name: user?.displayName || 'Player' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href={'/dashboard/player/listings' as any} />} variant="outline" className="border-white/10 text-white/70 hover:text-white">
            <List className="mr-2 h-4 w-4" /> {t('manageListings')}
          </Button>
          <Button render={<Link href="/create-listing" />} className="bg-gold-500 text-black font-semibold hover:bg-gold-400">
            <Plus className="mr-2 h-4 w-4" /> {t('createListing')}
          </Button>
        </div>
      </div>

      <WalletBalance />

      {/* KYC reminder banner */}
      {user && user.kycStatus !== 'approved' && (
        <div className={`mb-6 rounded-xl border p-4 flex items-start gap-4 ${
          user.kycStatus === 'pending'
            ? 'border-yellow-500/20 bg-yellow-500/5'
            : user.kycStatus === 'rejected'
            ? 'border-red-500/20 bg-red-500/5'
            : 'border-gold-500/20 bg-gold-500/5'
        }`}>
          {user.kycStatus === 'pending' ? (
            <Clock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          ) : (
            <ShieldAlert className={`h-5 w-5 mt-0.5 flex-shrink-0 ${user.kycStatus === 'rejected' ? 'text-red-400' : 'text-gold-400'}`} />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              user.kycStatus === 'pending' ? 'text-yellow-300' : user.kycStatus === 'rejected' ? 'text-red-300' : 'text-gold-300'
            }`}>
              {user.kycStatus === 'pending' ? t('kycPendingTitle') : user.kycStatus === 'rejected' ? t('kycRejectedTitle') : t('kycRequiredTitle')}
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              {user.kycStatus === 'pending' ? t('kycPendingDesc') : user.kycStatus === 'rejected' ? t('kycRejectedDesc') : t('kycRequiredDesc')}
            </p>
          </div>
          {user.kycStatus !== 'pending' && (
            <Button
              render={<Link href={'/profile' as any} />}
              size="sm"
              className="bg-gold-500 text-black font-semibold hover:bg-gold-400 flex-shrink-0 text-xs"
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              {t('kycVerifyNow')}
            </Button>
          )}
        </div>
      )}

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

      {/* Color Tone Picker */}
      <Card className="border-white/[0.06] bg-[#111318] mb-8">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Palette className="h-4 w-4 text-white/50" />
              <span className="text-sm font-medium text-white">{t('profileColor')}</span>
              {savingColor && <Loader2 className="h-3 w-3 animate-spin text-gold-400" />}
            </div>
            <div className="flex gap-2 flex-wrap">
              {ALL_COLOR_TONES.map((tone) => {
                const config = PLAYER_COLOR_TONES[tone];
                const isActive = selectedColorTone === tone;
                return (
                  <button
                    key={tone}
                    onClick={() => handleSaveColorTone(tone)}
                    className={`relative h-8 w-8 rounded-full transition-all ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111318] scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: config.swatch }}
                    title={locale === 'zh-TW' ? config.labelZh : config.label}
                  />
                );
              })}
            </div>
            {selectedColorTone && (
              <span className="text-xs text-white/40">
                {locale === 'zh-TW'
                  ? PLAYER_COLOR_TONES[selectedColorTone].labelZh
                  : PLAYER_COLOR_TONES[selectedColorTone].label}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-white/50">{tc('failedToLoad')}</p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchData(); }} className="border-white/10 text-white/60">
            <RefreshCw className="mr-2 h-3 w-3" /> {tc('retry')}
          </Button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold-400" /></div>
      ) : (
      <Tabs defaultValue="listings">
        <TabsList className="bg-white/[0.03] border border-white/10 mb-6">
          <TabsTrigger value="listings" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
            <List className="mr-1.5 h-3.5 w-3.5" /> {t('yourListings')}
          </TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <FileCheck className="mr-1.5 h-3.5 w-3.5" /> {t('submissions')}
            {playerListings.filter((l: Record<string, unknown>) => ['buy_in_released', 'registered', 'in_progress', 'pending_result'].includes(l.status as string)).length > 0 && (
              <Badge variant="outline" className="ml-1.5 border-purple-500/30 text-purple-400 text-[9px] px-1.5 py-0">
                {playerListings.filter((l: Record<string, unknown>) => ['buy_in_released', 'registered', 'in_progress', 'pending_result'].includes(l.status as string)).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══ MY LISTINGS TAB ═══ */}
        <TabsContent value="listings">
      <Card className="border-white/[0.06] bg-[#111318]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">{t('yourListings')}</CardTitle>
            <Button
              render={<Link href={'/dashboard/player/listings' as any} />}
              variant="ghost"
              size="sm"
              className="text-gold-400 hover:text-gold-300 text-xs"
            >
              {t('manageListings')} →
            </Button>
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
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {tc('overdue')}
                            </Badge>
                          )}
                          {needsRegistrationProof && isDeadlineWarning(l.deadlineRegistration) && (
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400">
                              <Clock className="h-2.5 w-2.5 mr-0.5" /> &lt; 24h
                            </Badge>
                          )}
                          {needsPrizeDeposit && isDeadlineOverdue(l.deadlineDeposit) && (
                            <Badge variant="outline" className="text-[10px] border-red-500/30 bg-red-500/10 text-red-400 animate-pulse">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {tc('overdue')}
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
                            <span>✓ {tc('proofUploaded')}</span>
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
        </TabsContent>

        {/* ═══ SUBMISSIONS TAB ═══ */}
        <TabsContent value="submissions">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-medium text-white">{t('submissionsTitle')}</h3>
            </div>
            <p className="text-xs text-white/40 mb-4">{t('submissionsDesc')}</p>

            {playerListings.filter((l: Record<string, unknown>) =>
              ['buy_in_released', 'registered', 'in_progress', 'pending_result', 'pending_deposit'].includes(l.status as string)
            ).length === 0 ? (
              <Card className="border-white/[0.06] bg-[#111318]">
                <CardContent className="py-12 text-center">
                  <FileCheck className="h-8 w-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">{t('noSubmissions')}</p>
                </CardContent>
              </Card>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              playerListings.filter((l: any) =>
                ['buy_in_released', 'registered', 'in_progress', 'pending_result', 'pending_deposit'].includes(l.status)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ).map((l: any) => {
                const tName = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || 'Tournament';
                const needsBuyinProof = l.status === 'buy_in_released';
                const canSubmitPrize = ['registered', 'in_progress'].includes(l.status);
                const hasPendingResult = l.status === 'pending_result';
                const aiResult = aiProofStatus[l.id];

                return (
                  <Card key={l.id} className="border-white/[0.06] bg-[#111318]">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{tName}</p>
                          <p className="text-xs text-white/40">
                            {l.tournament?.date ? formatDate(l.tournament.date, locale) : ''} · Buy-in: {formatCurrency(l.tournament?.buyIn || 0)}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${
                          needsBuyinProof ? 'border-blue-500/30 text-blue-400' :
                          canSubmitPrize ? 'border-gold-500/30 text-gold-400' :
                          hasPendingResult ? 'border-yellow-500/30 text-yellow-400' :
                          'border-white/10 text-white/40'
                        }`}>
                          {needsBuyinProof ? t('needsBuyinProof') :
                           canSubmitPrize ? t('needsPrizeProof') :
                           hasPendingResult ? tr('pendingReview') : l.status}
                        </Badge>
                      </div>

                      {/* Buy-in proof upload */}
                      {needsBuyinProof && !l.registrationProofUrl && (
                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-3">
                          <div className="flex items-start gap-2">
                            <Upload className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-blue-200/80">{tr('buyInReleasedDesc')}</p>
                              <p className="text-[10px] text-blue-200/50 mt-1">{t('uploadScreenshot')}</p>
                            </div>
                          </div>

                          <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-500/20 bg-blue-500/[0.03] px-3 py-4 cursor-pointer hover:border-blue-500/40 transition-colors">
                            <ImageIcon className="h-5 w-5 text-blue-400/50 mb-1" />
                            <span className="text-[10px] text-blue-200/50">{t('dropOrClickShort')}</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleProofFileSelect(l.id, e)}
                              className="sr-only"
                            />
                          </label>

                          {proofImages[l.id]?.length > 0 && (
                            <div className="flex gap-2">
                              {proofImages[l.id].map((file, i) => (
                                <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 w-16 h-16">
                                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setProofImages(prev => ({ ...prev, [l.id]: prev[l.id].filter((_, idx) => idx !== i) }))}
                                    className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {proofImages[l.id]?.length > 0 && (
                            <Button
                              onClick={() => handleUploadProofImages(l.id, 'buyin')}
                              disabled={uploadingProofFor === l.id}
                              className="w-full bg-blue-600 text-white hover:bg-blue-500 text-xs"
                              size="sm"
                            >
                              {uploadingProofFor === l.id ? (
                                <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> {t('analyzingProof')}</>
                              ) : (
                                <><Brain className="mr-1.5 h-3 w-3" /> {t('uploadAndVerify')}</>
                              )}
                            </Button>
                          )}

                          {/* Fallback URL */}
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

                      {/* Already uploaded buy-in proof */}
                      {needsBuyinProof && l.registrationProofUrl && (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <span>✓ {tc('proofUploaded')}</span>
                        </div>
                      )}

                      {/* Prize proof - link to submit result */}
                      {canSubmitPrize && (
                        <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-gold-400" />
                              <span className="text-xs text-gold-200/80">{t('readyForResult')}</span>
                            </div>
                            <Button
                              render={<Link href={`/submit-result/${l.id}`} />}
                              size="sm"
                              className="bg-gold-500 text-black font-semibold hover:bg-gold-400 text-xs"
                            >
                              <Trophy className="mr-1 h-3 w-3" /> {tr('submitResult')}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Pending result notice */}
                      {hasPendingResult && (
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs text-yellow-200/80">{t('resultUnderReview')}</span>
                          </div>
                        </div>
                      )}

                      {/* AI analysis result */}
                      {aiResult && (
                        <div className={`rounded-lg border p-3 space-y-2 ${
                          aiResult.score >= 85 ? 'border-green-500/20 bg-green-500/5' :
                          aiResult.score >= 50 ? 'border-yellow-500/20 bg-yellow-500/5' :
                          'border-red-500/20 bg-red-500/5'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Brain className={`h-4 w-4 ${
                                aiResult.score >= 85 ? 'text-green-400' :
                                aiResult.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                              }`} />
                              <span className="text-xs font-medium text-white">{t('aiVerified')}</span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${
                              aiResult.score >= 85 ? 'border-green-500/30 text-green-400' :
                              aiResult.score >= 50 ? 'border-yellow-500/30 text-yellow-400' :
                              'border-red-500/30 text-red-400'
                            }`}>
                              {aiResult.score}/100
                            </Badge>
                          </div>
                          {aiResult.summary && (
                            <p className="text-[11px] text-white/50">{aiResult.summary}</p>
                          )}
                          {aiResult.flags.length > 0 && (
                            <div className="space-y-1">
                              {aiResult.flags.slice(0, 3).map((flag, i) => (
                                <div key={i} className={`flex items-center gap-1.5 text-[10px] ${
                                  flag.severity === 'critical' || flag.severity === 'high' ? 'text-red-400' :
                                  flag.severity === 'medium' ? 'text-yellow-400' : 'text-white/40'
                                }`}>
                                  <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                                  {flag.message}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
