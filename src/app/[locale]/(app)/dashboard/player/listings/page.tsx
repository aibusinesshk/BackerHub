'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatMarkup, formatDate } from '@/lib/format';
import {
  Plus, Loader2, Trophy, Upload, Clock, AlertTriangle, XCircle,
  ArrowLeft, Pencil, Eye, Filter, Search,
} from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'filled' | 'in_progress' | 'pending' | 'settled' | 'cancelled';

const STATUS_GROUPS: Record<StatusFilter, string[]> = {
  all: [],
  active: ['active'],
  filled: ['filled', 'buy_in_released', 'registered'],
  in_progress: ['in_progress'],
  pending: ['pending_result', 'pending_deposit'],
  settled: ['settled'],
  cancelled: ['cancelled'],
};

export default function MyListingsPage() {
  const t = useTranslations('myListings');
  const tr = useTranslations('tournamentResults');
  const locale = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingListing, setEditingListing] = useState<any>(null);
  const [editForm, setEditForm] = useState({ markup: 1.10, sharesOffered: 70, threshold: 50 });
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<Record<string, string>>({});
  const [submittingProof, setSubmittingProof] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch('/api/dashboard/player')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allListings = data?.listings || [];

  const filteredListings = allListings.filter((l: any) => {
    // Status filter
    if (statusFilter !== 'all') {
      const statuses = STATUS_GROUPS[statusFilter];
      if (!statuses.includes(l.status)) return false;
    }
    // Search filter
    if (searchQuery) {
      const tName = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || '';
      if (!tName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  // Status counts
  const statusCounts: Record<StatusFilter, number> = {
    all: allListings.length,
    active: allListings.filter((l: any) => STATUS_GROUPS.active.includes(l.status)).length,
    filled: allListings.filter((l: any) => STATUS_GROUPS.filled.includes(l.status)).length,
    in_progress: allListings.filter((l: any) => STATUS_GROUPS.in_progress.includes(l.status)).length,
    pending: allListings.filter((l: any) => STATUS_GROUPS.pending.includes(l.status)).length,
    settled: allListings.filter((l: any) => STATUS_GROUPS.settled.includes(l.status)).length,
    cancelled: allListings.filter((l: any) => STATUS_GROUPS.cancelled.includes(l.status)).length,
  };

  function openEditDialog(listing: any) {
    setEditForm({
      markup: listing.markup,
      sharesOffered: listing.totalActionOffered,
      threshold: listing.minThreshold,
    });
    setEditingListing(listing);
  }

  async function handleSaveEdit() {
    if (!editingListing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${editingListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markup: editForm.markup,
          total_shares_offered: editForm.sharesOffered,
          min_threshold: editForm.threshold,
        }),
      });
      if (res.ok) {
        setEditingListing(null);
        fetchData();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || t('editError'));
      }
    } catch {
      alert(t('editError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(listingId: string) {
    if (!confirm(t('cancelConfirm'))) return;
    setCancellingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}/cancel`, { method: 'POST' });
      if (res.ok) fetchData();
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
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

  function isDeadlineWarning(deadline: string | null): boolean {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }

  function isDeadlineOverdue(deadline: string | null): boolean {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  }

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

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'active', label: t('filterActive') },
    { key: 'filled', label: t('filterFilled') },
    { key: 'in_progress', label: t('filterInProgress') },
    { key: 'pending', label: t('filterPending') },
    { key: 'settled', label: t('filterSettled') },
    { key: 'cancelled', label: t('filterCancelled') },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/dashboard/player" />}
            variant="ghost"
            size="sm"
            className="text-white/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-white/50">{t('subtitle')}</p>
          </div>
        </div>
        <Button render={<Link href="/create-listing" />} className="bg-gold-500 text-black font-semibold hover:bg-gold-400">
          <Plus className="mr-2 h-4 w-4" /> {t('createNew')}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === tab.key
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'bg-white/[0.03] text-white/50 border border-white/[0.06] hover:text-white/70 hover:border-white/10'
            }`}
          >
            {tab.label}
            {statusCounts[tab.key] > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] ${
                statusFilter === tab.key ? 'bg-gold-500/30 text-gold-300' : 'bg-white/10 text-white/40'
              }`}>
                {statusCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full sm:w-80 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-sm pl-9 pr-3 py-2 placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/30"
        />
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardContent className="py-16 text-center">
            <p className="text-sm text-white/40">{t('noListings')}</p>
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')} className="mt-2 text-xs text-gold-400 hover:text-gold-300">
                {t('clearFilter')}
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredListings.map((l: any) => {
            const tName = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || 'Tournament';
            const soldPct = l.totalActionOffered > 0 ? (l.actionSold / l.totalActionOffered) * 100 : 0;
            const canEdit = l.status === 'active' && l.actionSold === 0;
            const canSubmitResult = ['registered', 'in_progress'].includes(l.status);
            const canCancel = l.status === 'active';
            const needsRegistrationProof = l.status === 'buy_in_released';
            const needsPrizeDeposit = l.status === 'pending_deposit';

            return (
              <Card key={l.id} className="border-white/[0.06] bg-[#111318] hover:border-white/10 transition-colors">
                <CardContent className="p-4 sm:p-5">
                  {/* Top row: name, status, date */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">{tName}</h3>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColors[l.status] || 'border-white/10 text-white/40'}`}>
                          {statusLabels[l.status] || l.status}
                        </Badge>
                        {l.resultStatus && (
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${
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
                        {/* Deadline warnings */}
                        {needsRegistrationProof && isDeadlineOverdue(l.deadlineRegistration) && (
                          <Badge variant="outline" className="text-[10px] border-red-500/30 bg-red-500/10 text-red-400 animate-pulse shrink-0">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {t('overdue')}
                          </Badge>
                        )}
                        {needsRegistrationProof && !isDeadlineOverdue(l.deadlineRegistration) && isDeadlineWarning(l.deadlineRegistration) && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0">
                            <Clock className="h-2.5 w-2.5 mr-0.5" /> &lt; 24h
                          </Badge>
                        )}
                        {needsPrizeDeposit && isDeadlineOverdue(l.deadlineDeposit) && (
                          <Badge variant="outline" className="text-[10px] border-red-500/30 bg-red-500/10 text-red-400 animate-pulse shrink-0">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> {t('overdue')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40">
                        {l.tournament?.date ? formatDate(l.tournament.date, locale) : ''} · Buy-in: {formatCurrency(l.tournament?.buyIn || 0)} · {t('created')}: {formatDate(l.createdAt, locale)}
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div className="rounded-lg bg-white/[0.02] px-3 py-2">
                      <p className="text-[10px] text-white/40">{t('markup')}</p>
                      <p className="text-sm font-semibold text-gold-400">{formatMarkup(l.markup)}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] px-3 py-2">
                      <p className="text-[10px] text-white/40">{t('actionOffered')}</p>
                      <p className="text-sm font-semibold text-white">{l.totalActionOffered}%</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] px-3 py-2">
                      <p className="text-[10px] text-white/40">{t('actionSold')}</p>
                      <p className="text-sm font-semibold text-white">{l.actionSold}%</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] px-3 py-2">
                      <p className="text-[10px] text-white/40">{t('threshold')}</p>
                      <p className="text-sm font-semibold text-white">{l.minThreshold}%</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-white/40 mb-1">
                      <span>{l.actionSold}% {t('sold')}</span>
                      <span>{l.totalActionOffered}% {t('offered')}</span>
                    </div>
                    <Progress value={soldPct} className="h-1.5 bg-white/5 [&>div]:bg-gold-500" />
                  </div>

                  {/* Registration proof upload */}
                  {needsRegistrationProof && (
                    <div className={`rounded-lg border p-3 space-y-2 mb-3 ${
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
                          <span>✓ {t('proofUploaded')}</span>
                          <a href={l.registrationProofUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-400 hover:text-blue-300">{t('viewProof')}</a>
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
                          {t('deadline')}: {formatDate(l.deadlineRegistration, locale)}
                          {isDeadlineOverdue(l.deadlineRegistration) && ` (${t('overdue').toUpperCase()})`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending prize deposit notice */}
                  {needsPrizeDeposit && (
                    <div className={`rounded-lg border p-3 mb-3 ${
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
                              {isDeadlineOverdue(l.deadlineDeposit) && ` (${t('overdue').toUpperCase()})`}
                            </div>
                          )}
                          <p className="text-[10px] text-amber-200/50 mt-1">{tr('withdrawalLocked')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs"
                        onClick={() => openEditDialog(l)}
                      >
                        <Pencil className="mr-1 h-3 w-3" /> {t('edit')}
                      </Button>
                    )}
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
                        {t('cancel')}
                      </Button>
                    )}
                    <Button
                      render={<Link href={`/checkout/${l.id}` as any} />}
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-white/50 hover:text-white/70 text-xs ml-auto"
                    >
                      <Eye className="mr-1 h-3 w-3" /> {t('viewPublic')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Listing Dialog */}
      <Dialog open={!!editingListing} onOpenChange={(open) => !open && setEditingListing(null)}>
        <DialogContent className="bg-[#111318] border-white/[0.06] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{t('editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                {t('editMarkup')}: {formatMarkup(editForm.markup)}
              </label>
              <input
                type="range"
                min="1.00"
                max="1.50"
                step="0.01"
                value={editForm.markup}
                onChange={(e) => setEditForm({ ...editForm, markup: parseFloat(e.target.value) })}
                className="w-full accent-gold-500"
              />
              <p className="text-xs text-white/40 mt-1">{t('editMarkupHelp')}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                {t('editShares')}: {editForm.sharesOffered}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={editForm.sharesOffered}
                onChange={(e) => setEditForm({ ...editForm, sharesOffered: parseInt(e.target.value) })}
                className="w-full accent-gold-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                {t('editThreshold')}: {editForm.threshold}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editForm.threshold}
                onChange={(e) => setEditForm({ ...editForm, threshold: parseInt(e.target.value) })}
                className="w-full accent-gold-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-white/70"
                onClick={() => setEditingListing(null)}
              >
                {t('editCancel')}
              </Button>
              <Button
                className="flex-1 bg-gold-500 text-black font-semibold hover:bg-gold-400"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('editSave')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
