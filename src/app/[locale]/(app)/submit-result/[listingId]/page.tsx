'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trophy, AlertTriangle, CheckCircle, Loader2, Upload, X, ImageIcon, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { Link } from '@/i18n/navigation';
import { formatCurrency } from '@/lib/format';

type TournamentResult = 'win' | 'loss' | 'cancelled';

interface ListingDetails {
  id: string;
  tournamentName: string;
  buyIn: number;
  actionPercentage: number;
  currency?: string;
}

export default function SubmitResultPage() {
  const params = useParams();
  const listingId = params.listingId as string;
  const t = useTranslations('tournamentResults');
  const tc = useTranslations('common');
  const { user } = useAuth();

  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [listingError, setListingError] = useState<string | null>(null);

  const [tournamentResult, setTournamentResult] = useState<TournamentResult | null>(null);
  const [prizeAmount, setPrizeAmount] = useState('');
  const [finishPosition, setFinishPosition] = useState('');
  const [totalEntries, setTotalEntries] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    overall_score: number;
    recommendation: string;
    summary: string;
    extracted_data: Record<string, unknown>;
    flags: Array<{ code: string; severity: string; message: string }>;
  } | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch listing');
        const data = await res.json();
        const l = data.listing || data;
        setListing({
          id: l.id,
          tournamentName: l.tournament?.name || l.tournamentName || 'Tournament',
          buyIn: l.tournament?.buyIn || l.buyIn || 0,
          actionPercentage: l.actionSold || l.sharesSold || l.actionPercentage || 0,
          currency: l.tournament?.currency || l.currency,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setListingError(tc('couldNotLoadListing'));
        }
      } finally {
        setLoadingListing(false);
      }
    }

    if (listingId) {
      fetchListing();
    }
    return () => controller.abort();
  }, [listingId, tc]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith('image/'));
    setProofFiles(prev => [...prev, ...valid].slice(0, 3));
    e.target.value = '';
  }

  function removeFile(index: number) {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setAiAnalysis(null);
  }

  async function handleUploadAndAnalyze() {
    if (proofFiles.length === 0) return;
    setUploadingProof(true);
    setAiAnalyzing(false);
    setSubmitError(null);

    try {
      // Upload files
      const formData = new FormData();
      formData.append('listingId', listingId);
      formData.append('proofType', 'prize');
      proofFiles.forEach(f => formData.append('files', f));

      const uploadRes = await fetch('/api/proof/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      setUploadingProof(false);
      setAiAnalyzing(true);

      // Trigger AI analysis
      const aiRes = await fetch('/api/ai-proof/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, proofType: 'prize' }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiAnalysis(aiData);

        // Auto-fill extracted data if available
        if (aiData.extracted_data) {
          if (aiData.extracted_data.prize_amount && !prizeAmount) {
            setPrizeAmount(String(aiData.extracted_data.prize_amount));
          }
          if (aiData.extracted_data.finish_position && !finishPosition) {
            setFinishPosition(String(aiData.extracted_data.finish_position));
          }
          if (aiData.extracted_data.total_entries && !totalEntries) {
            setTotalEntries(String(aiData.extracted_data.total_entries));
          }
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingProof(false);
      setAiAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tournamentResult) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Upload proof files if not already uploaded
      if (proofFiles.length > 0 && !aiAnalysis) {
        const formData = new FormData();
        formData.append('listingId', listingId);
        formData.append('proofType', 'prize');
        proofFiles.forEach(f => formData.append('files', f));
        await fetch('/api/proof/upload', { method: 'POST', body: formData });
      }

      const body: Record<string, unknown> = {
        listingId,
        tournamentResult,
        proofUrl: proofUrl || undefined,
        notes: notes || undefined,
      };

      if (tournamentResult === 'win') {
        body.prizeAmount = parseFloat(prizeAmount);
        if (finishPosition) body.finishPosition = parseInt(finishPosition, 10);
        if (totalEntries) body.totalEntries = parseInt(totalEntries, 10);
      }

      const res = await fetch('/api/tournament-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          throw new Error(t('alreadySubmitted'));
        }
        throw new Error(data.error || tc('failedToSubmitResult'));
      }

      // Trigger AI analysis in background if files were uploaded but not yet analyzed
      if (proofFiles.length > 0 && !aiAnalysis) {
        fetch('/api/ai-proof/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId, proofType: 'prize' }),
        }).catch(() => {});
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : tc('unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName =
    'w-full rounded-lg bg-white/[0.03] border border-white/10 text-white px-3 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold-500/50 min-h-[48px]';

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[#111318] border-white/[0.06]">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">{t('successTitle')}</h2>
            <p className="text-sm text-white/60">{t('successMessage')}</p>
            <Button
              render={<Link href="/dashboard/player" />}
              className="bg-gold-500 text-black font-semibold hover:bg-gold-400 mt-2"
            >
              {t('backToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-10 px-4">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
            <Trophy className="h-5 w-5 text-gold-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('title')}</h1>
            <p className="text-sm text-white/50">{t('subtitle')}</p>
          </div>
        </div>

        {/* Listing Info */}
        {loadingListing ? (
          <Card className="bg-[#111318] border-white/[0.06]">
            <CardContent className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </CardContent>
          </Card>
        ) : listingError ? (
          <Card className="bg-[#111318] border-white/[0.06]">
            <CardContent className="py-6">
              <p className="text-sm text-red-400">{listingError}</p>
            </CardContent>
          </Card>
        ) : listing ? (
          <Card className="bg-[#111318] border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white text-base">{listing.tournamentName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/[0.06] text-white/70 border-white/10">
                  {t('buyIn')}: {formatCurrency(listing.buyIn, listing.currency)}
                </Badge>
                <Badge className="bg-gold-500/10 text-gold-500 border-gold-500/20">
                  {t('actionSold')}: {listing.actionPercentage}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Submit Form */}
        <Card className="bg-[#111318] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white text-base">{t('formTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tournament Result */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">
                  {t('resultLabel')}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  {(['win', 'loss', 'cancelled'] as TournamentResult[]).map((value) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-colors min-h-[48px] active:opacity-80 ${
                        tournamentResult === value
                          ? 'border-gold-500/50 bg-gold-500/10 text-gold-500'
                          : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          tournamentResult === value
                            ? 'border-gold-500 bg-gold-500'
                            : 'border-white/30'
                        }`}
                      >
                        {tournamentResult === value && (
                          <div className="h-2 w-2 rounded-full bg-black" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="tournamentResult"
                        value={value}
                        checked={tournamentResult === value}
                        onChange={() => setTournamentResult(value)}
                        className="sr-only"
                      />
                      {t(`result_${value}`)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Win-specific fields */}
              {tournamentResult === 'win' && (
                <div className="space-y-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white/70">
                      {t('prizeAmount')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={prizeAmount}
                      onChange={(e) => setPrizeAmount(e.target.value)}
                      placeholder={t('prizeAmountPlaceholder')}
                      className={inputClassName}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-white/70">
                        {t('finishPosition')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={finishPosition}
                        onChange={(e) => setFinishPosition(e.target.value)}
                        placeholder={t('finishPositionPlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-white/70">
                        {t('totalEntries')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalEntries}
                        onChange={(e) => setTotalEntries(e.target.value)}
                        placeholder={t('totalEntriesPlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Proof Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/70">
                  <ImageIcon className="inline h-4 w-4 mr-1 -mt-0.5" />
                  {t('proofScreenshot')}
                </label>

                {/* File drop zone */}
                <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] px-4 py-6 cursor-pointer hover:border-gold-500/30 hover:bg-gold-500/[0.02] transition-colors">
                  <Upload className="h-6 w-6 text-white/30 mb-2" />
                  <span className="text-xs text-white/40">{t('dropOrClick')}</span>
                  <span className="text-[10px] text-white/20 mt-1">{t('maxFiles')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="sr-only"
                    disabled={proofFiles.length >= 3}
                  />
                </label>

                {/* File previews */}
                {proofFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {proofFiles.map((file, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 w-20 h-20">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Analyze button */}
                {proofFiles.length > 0 && !aiAnalysis && (
                  <Button
                    type="button"
                    onClick={handleUploadAndAnalyze}
                    disabled={uploadingProof || aiAnalyzing}
                    variant="outline"
                    className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs"
                  >
                    {uploadingProof ? (
                      <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> {t('uploading')}</>
                    ) : aiAnalyzing ? (
                      <><Brain className="mr-1.5 h-3 w-3 animate-pulse" /> {t('aiAnalyzing')}</>
                    ) : (
                      <><Brain className="mr-1.5 h-3 w-3" /> {t('analyzeWithAi')}</>
                    )}
                  </Button>
                )}

                {/* AI Analysis Result */}
                {aiAnalysis && (
                  <div className={`rounded-lg border p-3 space-y-2 ${
                    aiAnalysis.overall_score >= 85 ? 'border-green-500/20 bg-green-500/5' :
                    aiAnalysis.overall_score >= 50 ? 'border-yellow-500/20 bg-yellow-500/5' :
                    'border-red-500/20 bg-red-500/5'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className={`h-4 w-4 ${
                          aiAnalysis.overall_score >= 85 ? 'text-green-400' :
                          aiAnalysis.overall_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`} />
                        <span className="text-xs font-medium text-white">{t('aiVerification')}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${
                        aiAnalysis.overall_score >= 85 ? 'border-green-500/30 text-green-400' :
                        aiAnalysis.overall_score >= 50 ? 'border-yellow-500/30 text-yellow-400' :
                        'border-red-500/30 text-red-400'
                      }`}>
                        {aiAnalysis.overall_score}/100
                      </Badge>
                    </div>
                    {aiAnalysis.summary && (
                      <p className="text-[11px] text-white/50">{aiAnalysis.summary}</p>
                    )}
                    {aiAnalysis.flags.length > 0 && (
                      <div className="space-y-1">
                        {aiAnalysis.flags.map((flag, i) => (
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
                    {aiAnalysis.extracted_data && (
                      <p className="text-[10px] text-purple-300/60">{t('aiAutoFilled')}</p>
                    )}
                  </div>
                )}

                {/* Fallback URL input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-white/40">
                    {t('orPasteUrl')}
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder={t('proofUrlPlaceholder')}
                    className={inputClassName}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/70">
                  {t('notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  rows={3}
                  className={inputClassName}
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!tournamentResult || submitting || (tournamentResult === 'win' && !prizeAmount)}
                className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-40 h-12 text-base"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('submitButton')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/10 bg-yellow-500/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500/60" />
          <p className="text-xs text-white/40">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
}
