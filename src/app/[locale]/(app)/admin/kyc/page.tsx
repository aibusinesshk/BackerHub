'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import {
  Shield, Loader2, CheckCircle, XCircle, ExternalLink, AlertTriangle, Clock, User,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

const DOC_LABELS_EN: Record<string, string> = {
  'id-front': 'ID Front',
  'id-back': 'ID Back',
  'selfie': 'Selfie',
  'proof-of-address': 'Address Proof',
};

export default function AdminKycPage() {
  const t = useTranslations('adminKyc');
  const { user, isLoading: authLoading } = useAuth();

  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [authLoading, user]);

  async function fetchData() {
    try {
      const res = await fetch('/api/admin/kyc');
      if (res.status === 403) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
        setHistory(data.history || []);
        setIsAdmin(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve' }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessing(userId);
    try {
      const res = await fetch('/api/admin/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject', reason: rejectReason }),
      });
      if (res.ok) {
        setRejectingId(null);
        setRejectReason('');
        await fetchData();
      }
    } finally {
      setProcessing(null);
    }
  };

  const handlePromote = async () => {
    setPromoting(true);
    setPromoteError('');
    try {
      const res = await fetch('/api/admin/promote', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setPromoteError(data.error || 'Failed to promote');
        return;
      }
      window.location.reload();
    } catch {
      setPromoteError('Network error');
    } finally {
      setPromoting(false);
    }
  };

  // Show spinner while auth or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/50">Please log in first</p>
      </div>
    );
  }

  // Not an admin — show become admin option
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardContent className="flex flex-col items-center text-center pt-8 pb-8 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10">
              <Shield className="h-8 w-8 text-gold-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Admin Access Required</h2>
              <p className="text-sm text-white/40">
                You need admin privileges to manage KYC reviews.
              </p>
            </div>
            <p className="text-xs text-white/30 max-w-xs">
              If this is a fresh setup and no admin exists yet, you can claim the admin role below.
            </p>
            {promoteError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 w-full">
                <p className="text-xs text-red-400">{promoteError}</p>
              </div>
            )}
            <Button
              onClick={handlePromote}
              disabled={promoting}
              className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400"
            >
              {promoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Become Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin view — KYC management
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-gold-400" />
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-white/50">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="pending">
            {t('pending')} {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">{t('history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pending.length === 0 ? (
            <Card className="border-white/[0.06] bg-[#111318]">
              <CardContent className="py-12 text-center text-white/40">
                {t('noPending')}
              </CardContent>
            </Card>
          ) : (
            pending.map((submission) => (
              <Card key={submission.id} className="border-white/[0.06] bg-[#111318]">
                <CardContent className="pt-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <PlayerAvatar
                      src={submission.avatar_url}
                      name={submission.display_name || '?'}
                      className="h-10 w-10"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">{submission.display_name}</p>
                      <p className="text-xs text-white/40">{submission.email}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto border-white/20 text-white/50 text-xs">
                      {submission.region}
                    </Badge>
                  </div>

                  {/* Document Links */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {(['id-front', 'id-back', 'selfie', 'proof-of-address'] as const).map((docName) => (
                      <a
                        key={docName}
                        href={submission.docs?.[docName] || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-1.5 rounded-lg border p-3 text-xs transition-all ${
                          submission.docs?.[docName]
                            ? 'border-gold-500/30 text-gold-400 hover:bg-gold-500/10'
                            : 'border-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {DOC_LABELS_EN[docName]}
                      </a>
                    ))}
                  </div>

                  {/* Actions */}
                  {rejectingId === submission.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={t('rejectReason')}
                        className="w-full rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/30 px-3 py-2 text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-white/60"
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        >
                          {t('cancel') || 'Cancel'}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 text-white hover:bg-red-600"
                          onClick={() => handleReject(submission.id)}
                          disabled={processing === submission.id}
                        >
                          {processing === submission.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          {t('reject')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => handleApprove(submission.id)}
                        disabled={processing === submission.id}
                      >
                        {processing === submission.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => setRejectingId(submission.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        {t('reject')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          {history.length === 0 ? (
            <Card className="border-white/[0.06] bg-[#111318]">
              <CardContent className="py-12 text-center text-white/40">
                {t('noHistory')}
              </CardContent>
            </Card>
          ) : (
            history.map((entry) => (
              <Card key={entry.id} className="border-white/[0.06] bg-[#111318]">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      src={entry.avatar_url}
                      name={entry.display_name || '?'}
                      className="h-10 w-10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{entry.display_name}</p>
                      <p className="text-xs text-white/40">{entry.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {entry.kyc_status === 'approved' ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{t('approved')}</Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{t('rejected')}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Audit info */}
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30 pt-1 border-t border-white/[0.04]">
                    {entry.reviewed_by_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t('reviewedBy')}: {entry.reviewed_by_name}
                      </span>
                    )}
                    {(entry.kyc_approved_at || entry.updated_at) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(entry.kyc_approved_at || entry.updated_at, 'en')}
                      </span>
                    )}
                  </div>

                  {/* Rejection reason */}
                  {entry.kyc_status === 'rejected' && entry.kyc_rejection_reason && (
                    <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                      <p className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wider mb-1">{t('rejectionReason')}</p>
                      <p className="text-xs text-red-300/80">{entry.kyc_rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
