'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import {
  Shield, Loader2, CheckCircle, XCircle, ExternalLink, AlertTriangle, Clock, User,
  Brain, Eye, FileText, UserCheck, MapPin, Fingerprint, RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

const DOC_LABELS_EN: Record<string, string> = {
  'id-front': 'ID Front',
  'id-back': 'ID Back',
  'selfie': 'Selfie',
  'proof-of-address': 'Address Proof',
};

function ScoreBadge({ score, label }: { score: number | null | undefined; label: string }) {
  if (score == null) return null;
  const color = score >= 85 ? 'green' : score >= 50 ? 'yellow' : 'red';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/40">{label}</span>
      <span className={`text-xs font-bold ${
        color === 'green' ? 'text-green-400' : color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
      }`}>
        {Math.round(score)}%
      </span>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  );
}

function AiVerificationPanel({ ai, t }: { ai: any; t: any }) {
  if (!ai) return null;

  const isProcessing = ai.status === 'processing' || ai.status === 'pending';
  const isFailed = ai.status === 'failed';

  if (isProcessing) {
    return (
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 mb-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          <span className="text-xs font-medium text-blue-400">{t('aiProcessing')}</span>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-xs font-medium text-red-400">{t('aiFailed')}</span>
        </div>
        {ai.error_message && (
          <p className="text-[10px] text-red-300/60 mt-1 ml-6">{ai.error_message}</p>
        )}
      </div>
    );
  }

  const recColor = ai.recommendation === 'auto_approve' ? 'green'
    : ai.recommendation === 'auto_reject' ? 'red' : 'yellow';

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-4 mb-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">{t('aiAnalysis')}</span>
        </div>
        <Badge className={`text-[10px] ${
          recColor === 'green' ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : recColor === 'red' ? 'bg-red-500/20 text-red-400 border-red-500/30'
            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        }`}>
          {ai.recommendation === 'auto_approve' ? t('aiAutoApprove')
            : ai.recommendation === 'auto_reject' ? t('aiAutoReject')
            : t('aiManualReview')}
        </Badge>
      </div>

      {/* Overall Score */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/40">{t('aiOverallScore')}</span>
          <span className={`text-sm font-bold ${
            ai.overall_score >= 85 ? 'text-green-400' : ai.overall_score >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(ai.overall_score)}%
          </span>
        </div>
        <ScoreBar score={ai.overall_score} />
      </div>

      {/* Document Scores Grid */}
      <div className="grid grid-cols-2 gap-2">
        {ai.id_front_analysis?.quality != null && (
          <div className="rounded-lg bg-white/[0.03] p-2">
            <div className="flex items-center gap-1 mb-1">
              <FileText className="h-3 w-3 text-white/30" />
              <span className="text-[10px] text-white/50">{t('idFront')}</span>
            </div>
            <ScoreBadge score={ai.id_front_analysis.quality} label={t('aiQuality')} />
            <ScoreBadge score={ai.id_front_analysis.authenticity} label={t('aiAuth')} />
          </div>
        )}
        {ai.id_back_analysis?.quality != null && (
          <div className="rounded-lg bg-white/[0.03] p-2">
            <div className="flex items-center gap-1 mb-1">
              <FileText className="h-3 w-3 text-white/30" />
              <span className="text-[10px] text-white/50">{t('idBack')}</span>
            </div>
            <ScoreBadge score={ai.id_back_analysis.quality} label={t('aiQuality')} />
            <ScoreBadge score={ai.id_back_analysis.authenticity} label={t('aiAuth')} />
          </div>
        )}
        {ai.selfie_analysis?.quality != null && (
          <div className="rounded-lg bg-white/[0.03] p-2">
            <div className="flex items-center gap-1 mb-1">
              <Eye className="h-3 w-3 text-white/30" />
              <span className="text-[10px] text-white/50">{t('selfie')}</span>
            </div>
            <ScoreBadge score={ai.selfie_analysis.quality} label={t('aiQuality')} />
            {ai.selfie_analysis.face_visible != null && (
              <span className={`text-[10px] ${ai.selfie_analysis.face_visible ? 'text-green-400' : 'text-red-400'}`}>
                {ai.selfie_analysis.face_visible ? t('aiFaceDetected') : t('aiNoFace')}
              </span>
            )}
          </div>
        )}
        {ai.address_proof_analysis?.quality != null && (
          <div className="rounded-lg bg-white/[0.03] p-2">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-white/30" />
              <span className="text-[10px] text-white/50">{t('proofOfAddress')}</span>
            </div>
            <ScoreBadge score={ai.address_proof_analysis.quality} label={t('aiQuality')} />
            {ai.address_proof_analysis.appears_recent != null && (
              <span className={`text-[10px] ${ai.address_proof_analysis.appears_recent ? 'text-green-400' : 'text-yellow-400'}`}>
                {ai.address_proof_analysis.appears_recent ? t('aiRecent') : t('aiNotRecent')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Face Match */}
      {ai.face_match_score != null && (
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2">
          <UserCheck className="h-3.5 w-3.5 text-white/30" />
          <span className="text-[10px] text-white/40">{t('aiFaceMatch')}</span>
          <span className={`text-xs font-bold ml-auto ${
            ai.face_match_score >= 80 ? 'text-green-400' : ai.face_match_score >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(ai.face_match_score)}%
          </span>
        </div>
      )}

      {/* Extracted Data */}
      {(ai.extracted_name || ai.extracted_doc_type) && (
        <div className="rounded-lg bg-white/[0.03] p-2 space-y-1">
          <div className="flex items-center gap-1 mb-1">
            <Fingerprint className="h-3 w-3 text-white/30" />
            <span className="text-[10px] font-medium text-white/50">{t('aiExtractedData')}</span>
          </div>
          {ai.extracted_name && (
            <div className="flex justify-between text-[10px]">
              <span className="text-white/30">{t('aiName')}</span>
              <span className="text-white/60">{ai.extracted_name}</span>
            </div>
          )}
          {ai.extracted_doc_type && (
            <div className="flex justify-between text-[10px]">
              <span className="text-white/30">{t('aiDocType')}</span>
              <span className="text-white/60">{ai.extracted_doc_type}</span>
            </div>
          )}
          {ai.extracted_id_number && (
            <div className="flex justify-between text-[10px]">
              <span className="text-white/30">{t('aiIdNumber')}</span>
              <span className="text-white/60 font-mono">{ai.extracted_id_number}</span>
            </div>
          )}
          {ai.extracted_dob && (
            <div className="flex justify-between text-[10px]">
              <span className="text-white/30">{t('aiDob')}</span>
              <span className="text-white/60">{ai.extracted_dob}</span>
            </div>
          )}
          {ai.extracted_doc_expiry && (
            <div className="flex justify-between text-[10px]">
              <span className="text-white/30">{t('aiExpiry')}</span>
              <span className="text-white/60">{ai.extracted_doc_expiry}</span>
            </div>
          )}
        </div>
      )}

      {/* Flags */}
      {ai.flags && ai.flags.length > 0 && (
        <div className="space-y-1">
          {ai.flags.map((flag: any, i: number) => (
            <div key={i} className={`flex items-start gap-1.5 rounded-lg p-2 text-[10px] ${
              flag.severity === 'critical' ? 'bg-red-500/10 text-red-400'
                : flag.severity === 'high' ? 'bg-red-500/5 text-red-300'
                : flag.severity === 'medium' ? 'bg-yellow-500/5 text-yellow-400'
                : 'bg-white/[0.03] text-white/50'
            }`}>
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              <span>{flag.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {ai.summary && (
        <p className="text-[11px] text-white/50 leading-relaxed italic">{ai.summary}</p>
      )}

      {/* Processing time */}
      {ai.processing_time_ms && (
        <p className="text-[9px] text-white/20">
          {t('aiProcessedIn', { seconds: (ai.processing_time_ms / 1000).toFixed(1) })}
        </p>
      )}
    </div>
  );
}

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
  const [rerunningAi, setRerunningAi] = useState<string | null>(null);
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});

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

  const handleRerunAi = async (userId: string) => {
    setRerunningAi(userId);
    setAiErrors((prev) => { const next = { ...prev }; delete next[userId]; return next; });
    try {
      const res = await fetch('/api/ai-kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiErrors((prev) => ({ ...prev, [userId]: data.error || `AI verification failed (${res.status})` }));
        return;
      }
      // Refresh to show updated results
      await fetchData();
    } catch {
      setAiErrors((prev) => ({ ...prev, [userId]: 'Network error: failed to reach AI verification service' }));
    } finally {
      setRerunningAi(null);
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

                  {/* AI Verification Results */}
                  <AiVerificationPanel ai={submission.aiVerification} t={t} />

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
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 ml-auto"
                        onClick={() => handleRerunAi(submission.id)}
                        disabled={rerunningAi === submission.id}
                      >
                        {rerunningAi === submission.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1 h-3 w-3" />
                        )}
                        {t('aiRerun')}
                      </Button>
                    </div>
                  )}

                  {/* AI error feedback */}
                  {aiErrors[submission.id] && (
                    <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                      <p className="text-xs text-red-400">{aiErrors[submission.id]}</p>
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
