'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { AvatarCropModal } from '@/components/shared/avatar-crop-modal';
import { formatDate } from '@/lib/format';
import {
  Loader2, CheckCircle, Shield, User, MapPin, Calendar,
  Camera, Upload, FileCheck, AlertTriangle, Globe, Phone,
  Twitter, Instagram, Facebook, ExternalLink,
} from 'lucide-react';

const KYC_DOCS = ['id-front', 'id-back', 'selfie', 'proof-of-address'] as const;

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { refreshProfile } = useAuth();

  // Loading / feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [displayNameZh, setDisplayNameZh] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [bioZh, setBioZh] = useState('');
  const [region, setRegion] = useState('TW');
  const [role, setRole] = useState('both');
  const [hendonMobUrl, setHendonMobUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');

  // Read-only fields
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [kycStatus, setKycStatus] = useState('none');
  const [memberSince, setMemberSince] = useState('');

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState('');
  const [uploading, setUploading] = useState(false);

  // KYC
  const [kycFiles, setKycFiles] = useState<Record<string, File | null>>({
    'id-front': null, 'id-back': null, 'selfie': null, 'proof-of-address': null,
  });
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState('');
  const [kycRejectionReason, setKycRejectionReason] = useState('');

  // AI KYC Verification
  const [aiVerification, setAiVerification] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/profile', { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setDisplayName(p.display_name || '');
          setDisplayNameZh(p.display_name_zh || '');
          setAvatarUrl(p.avatar_url || '');
          setBio(p.bio || '');
          setBioZh(p.bio_zh || '');
          setRegion(p.region || 'TW');
          setRole(p.role || 'both');
          setHendonMobUrl(p.hendon_mob_url || '');
          setPhone(p.phone || '');
          setSocialTwitter(p.social_twitter || '');
          setSocialInstagram(p.social_instagram || '');
          setSocialFacebook(p.social_facebook || '');
          setEmail(p.email || '');
          setIsVerified(p.is_verified || false);
          setKycStatus(p.kyc_status || 'none');
          setKycRejectionReason(p.kyc_rejection_reason || '');
          setMemberSince(p.member_since || p.created_at || '');
        }
      })
      .catch((err) => { if (err.name !== 'AbortError') setError(tc('failedToLoadProfile')); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [tc]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError(t('errorRequired'));
      return;
    }

    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          display_name_zh: displayNameZh.trim() || null,
          bio: bio.trim() || null,
          bio_zh: bioZh.trim() || null,
          role,
          hendon_mob_url: hendonMobUrl.trim() || null,
          phone: phone.trim() || null,
          social_twitter: socialTwitter.trim() || null,
          social_instagram: socialInstagram.trim() || null,
          social_facebook: socialFacebook.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tc('failedToSave'));
        return;
      }

      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(tc('networkError'));
    } finally {
      setSaving(false);
    }
  };

  // Avatar handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('avatarInvalidType'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('avatarTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropped = async (blob: Blob) => {
    setCropModalOpen(false);
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.webp');
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || tc('uploadFailed'));
        return;
      }
      setAvatarUrl(data.avatar_url);
      await refreshProfile();
    } catch {
      setError(tc('networkError'));
    } finally {
      setUploading(false);
    }
  };

  // KYC handlers
  const handleKycFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setKycFiles((prev) => ({ ...prev, [docName]: file }));
    }
  };

  const allKycFilesSelected = KYC_DOCS.every((d) => kycFiles[d] !== null);

  const handleKycSubmit = async () => {
    if (!allKycFilesSelected) return;
    setKycSubmitting(true);
    setKycError('');
    try {
      const formData = new FormData();
      for (const docName of KYC_DOCS) {
        formData.append(docName, kycFiles[docName]!);
      }
      const res = await fetch('/api/profile/kyc', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setKycError(data.error || tc('failedToSave'));
        return;
      }
      setKycStatus('pending');
    } catch {
      setKycError(tc('networkError'));
    } finally {
      setKycSubmitting(false);
    }
  };

  // Fetch AI verification status when KYC is pending
  useEffect(() => {
    if (kycStatus !== 'pending') return;
    setAiLoading(true);
    const fetchAiStatus = () => {
      fetch('/api/ai-kyc/status')
        .then((r) => r.json())
        .then((data) => {
          setAiVerification(data.verification);
          setAiLoading(false);
          // If still processing, poll again in 5 seconds
          if (data.verification?.status === 'processing' || data.verification?.status === 'pending') {
            setTimeout(fetchAiStatus, 5000);
          }
        })
        .catch(() => setAiLoading(false));
    };
    fetchAiStatus();
  }, [kycStatus]);

  const regionOptions = [
    { value: 'TW', label: t('regionTW'), flag: '\u{1F1F9}\u{1F1FC}' },
    { value: 'HK', label: t('regionHK'), flag: '\u{1F1ED}\u{1F1F0}' },
    { value: 'OTHER', label: t('regionOther'), flag: '\u{1F30F}' },
  ] as const;

  const kycBadge = () => {
    switch (kycStatus) {
      case 'approved': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{t('kycApproved')}</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{t('kycPending')}</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{t('kycRejected')}</Badge>;
      default: return <Badge className="bg-white/10 text-white/40 border-white/10">{t('kycNone')}</Badge>;
    }
  };

  const kycDocLabels: Record<string, string> = {
    'id-front': t('kycIdFront'),
    'id-back': t('kycIdBack'),
    'selfie': t('kycSelfie'),
    'proof-of-address': t('kycProofOfAddress'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('subtitle')}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Edit Form */}
        <div className="lg:col-span-3 space-y-8">
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-gold-400" />
                {t('editInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar Upload */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('avatar')}</label>
                <div className="flex items-center gap-4">
                  <PlayerAvatar
                    src={avatarUrl}
                    name={displayName || 'U'}
                    className="h-16 w-16 border-2 border-white/10"
                    fallbackClassName="bg-gold-500/10 text-gold-400 text-lg font-bold"
                  />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/10 text-white/60 hover:bg-white/5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="mr-2 h-4 w-4" />
                      )}
                      {uploading ? t('avatarUploading') : t('avatarUpload')}
                    </Button>
                    <p className="mt-1 text-[10px] text-white/30">{t('avatarHelp')}</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('displayName')} *</label>
                <Input
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder="John Doe"
                />
              </div>

              {/* Display Name Chinese */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('displayNameZh')}</label>
                <Input
                  value={displayNameZh}
                  onChange={(e) => setDisplayNameZh(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder={t('displayNameZhHelp')}
                />
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Bio */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-500/50 resize-none"
                  placeholder={t('bioPlaceholder')}
                />
              </div>

              {/* Bio Chinese */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('bioZh')}</label>
                <textarea
                  value={bioZh}
                  onChange={(e) => setBioZh(e.target.value)}
                  rows={3}
                  className="w-full rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-500/50 resize-none"
                  placeholder={t('bioZhPlaceholder')}
                />
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Account Type */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('roleTitle')}</label>
                <p className="mb-2 text-[10px] text-white/30">{t('roleDescription')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {([['investor', t('roleInvestor')], ['player', t('rolePlayer')], ['both', t('roleBoth')]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRole(val)}
                      className={`rounded-xl border p-2.5 text-sm transition-all ${
                        role === val
                          ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                          : 'border-white/[0.06] text-white/50 hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Hendon Mob URL */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {t('hendonMobUrl')}
                </label>
                <Input
                  value={hendonMobUrl}
                  onChange={(e) => setHendonMobUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder={t('hendonMobUrlPlaceholder')}
                />
                <p className="mt-1 text-[10px] text-white/30">{t('hendonMobUrlHelp')}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {t('phone')}
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder={t('phonePlaceholder')}
                />
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Social Links */}
              <div>
                <label className="mb-3 block text-xs text-white/50">{t('socialLinks')}</label>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] text-white/40 flex items-center gap-1">
                      <Twitter className="h-3 w-3" />
                      {t('socialTwitter')}
                    </label>
                    <Input
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      placeholder={t('socialTwitterPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-white/40 flex items-center gap-1">
                      <Instagram className="h-3 w-3" />
                      {t('socialInstagram')}
                    </label>
                    <Input
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      placeholder={t('socialInstagramPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-white/40 flex items-center gap-1">
                      <Facebook className="h-3 w-3" />
                      {t('socialFacebook')}
                    </label>
                    <Input
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      placeholder={t('socialFacebookPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Region (read-only, set during signup) */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('region')}</label>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/60">
                  {regionOptions.find((r) => r.value === region)?.flag}{' '}
                  {regionOptions.find((r) => r.value === region)?.label}
                </div>
              </div>

              {/* Error / Success */}
              {error && <p className="text-xs text-red-400">{error}</p>}
              {saved && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('saved')}
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving || !displayName.trim()}
                className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? t('saving') : t('save')}
              </Button>
            </CardContent>
          </Card>

          {/* KYC Section */}
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold-400" />
                {t('kycTitle')}
              </CardTitle>
              <p className="text-xs text-white/40">{t('kycSubtitle')}</p>
            </CardHeader>
            <CardContent>
              {kycStatus === 'approved' && (
                <div className="flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                  <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                  <p className="text-sm text-green-300">{t('kycApprovedMessage')}</p>
                </div>
              )}

              {kycStatus === 'pending' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
                    <Loader2 className="h-5 w-5 text-yellow-400 animate-spin shrink-0" />
                    <p className="text-sm text-yellow-300">{t('kycPendingMessage')}</p>
                  </div>

                  {/* AI Verification Progress */}
                  {aiLoading && (
                    <div className="flex items-center gap-2 rounded-xl bg-purple-500/5 border border-purple-500/20 p-3">
                      <Loader2 className="h-4 w-4 text-purple-400 animate-spin shrink-0" />
                      <p className="text-xs text-purple-300">{t('kycAiAnalyzing')}</p>
                    </div>
                  )}
                  {aiVerification && aiVerification.status === 'completed' && (
                    <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-300">{t('kycAiComplete')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-white/40">{t('kycAiConfidence')}</span>
                            <span className={`text-xs font-bold ${
                              aiVerification.overall_score >= 85 ? 'text-green-400'
                                : aiVerification.overall_score >= 50 ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}>
                              {Math.round(aiVerification.overall_score)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                aiVerification.overall_score >= 85 ? 'bg-green-500'
                                  : aiVerification.overall_score >= 50 ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, aiVerification.overall_score)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/40">{t('kycAiPendingHuman')}</p>
                    </div>
                  )}
                  {aiVerification && (aiVerification.status === 'processing' || aiVerification.status === 'pending') && (
                    <div className="flex items-center gap-2 rounded-xl bg-purple-500/5 border border-purple-500/20 p-3">
                      <Loader2 className="h-4 w-4 text-purple-400 animate-spin shrink-0" />
                      <p className="text-xs text-purple-300">{t('kycAiAnalyzing')}</p>
                    </div>
                  )}
                </div>
              )}

              {(kycStatus === 'none' || kycStatus === 'rejected') && (
                <div className="space-y-4">
                  {kycStatus === 'rejected' && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                        <p className="text-sm text-red-300">{t('kycRejectedMessage')}</p>
                      </div>
                      {kycRejectionReason && (
                        <div className="ml-8 rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                          <p className="text-[10px] font-semibold text-red-400/70 uppercase tracking-wider mb-1">{t('kycRejectionReasonLabel')}</p>
                          <p className="text-xs text-red-300/80">{kycRejectionReason}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document quality tips */}
                  <div className="rounded-xl bg-gold-500/5 border border-gold-500/15 p-4">
                    <p className="text-xs font-semibold text-gold-400 mb-2">{t('kycDocTipsTitle')}</p>
                    <ul className="space-y-1">
                      <li className="text-[11px] text-white/50 flex items-start gap-2">
                        <span className="text-gold-400/60 mt-0.5">•</span>
                        {t('kycDocTip1')}
                      </li>
                      <li className="text-[11px] text-white/50 flex items-start gap-2">
                        <span className="text-gold-400/60 mt-0.5">•</span>
                        {t('kycDocTip2')}
                      </li>
                      <li className="text-[11px] text-white/50 flex items-start gap-2">
                        <span className="text-gold-400/60 mt-0.5">•</span>
                        {t('kycDocTip3')}
                      </li>
                      <li className="text-[11px] text-white/50 flex items-start gap-2">
                        <span className="text-gold-400/60 mt-0.5">•</span>
                        {t('kycDocTip4')}
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {KYC_DOCS.map((docName) => (
                      <label
                        key={docName}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all hover:border-gold-500/50 ${
                          kycFiles[docName]
                            ? 'border-green-500/40 bg-green-500/5'
                            : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        {kycFiles[docName] ? (
                          <FileCheck className="h-6 w-6 text-green-400" />
                        ) : (
                          <Upload className="h-6 w-6 text-white/30" />
                        )}
                        <span className="text-xs text-white/60 text-center font-medium">
                          {kycDocLabels[docName]}
                        </span>
                        {kycFiles[docName] ? (
                          <span className="text-[10px] text-green-400">{t('kycFileSelected')}</span>
                        ) : (
                          <span className="text-[10px] text-white/30">{t('kycUploadHint')}</span>
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleKycFileChange(docName, e)}
                        />
                      </label>
                    ))}
                  </div>

                  {kycError && <p className="text-xs text-red-400">{kycError}</p>}

                  <Button
                    onClick={handleKycSubmit}
                    disabled={!allKycFilesSelected || kycSubmitting}
                    className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400"
                  >
                    {kycSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {kycSubmitting ? t('kycSubmitting') : kycStatus === 'rejected' ? t('kycResubmit') : t('kycSubmit')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <Card className="border-white/[0.06] bg-[#111318]">
              <CardHeader>
                <CardTitle className="text-white text-sm">{t('preview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col items-center text-center">
                  <PlayerAvatar
                    src={avatarUrl}
                    name={displayName || 'U'}
                    className="h-20 w-20 border-2 border-gold-500/30 text-lg"
                    fallbackClassName="bg-gold-500/10 text-gold-400 text-xl font-bold"
                  />
                  <h3 className="mt-3 text-lg font-bold text-white">
                    {locale === 'zh-TW' && displayNameZh ? displayNameZh : displayName || '—'}
                  </h3>
                  <p className="text-xs text-white/40">{email}</p>
                </div>

                <Separator className="bg-white/[0.06]" />

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="border-white/20 text-white/60">
                    <MapPin className="mr-1 h-3 w-3" />
                    {regionOptions.find((r) => r.value === region)?.flag}{' '}
                    {regionOptions.find((r) => r.value === region)?.label}
                  </Badge>
                  <Badge variant="outline" className="border-gold-500/30 text-gold-400">
                    {role === 'investor' ? t('roleInvestor') : role === 'player' ? t('rolePlayer') : t('roleBoth')}
                  </Badge>
                </div>

                {(socialTwitter || socialInstagram || socialFacebook) && (
                  <div className="flex justify-center gap-3">
                    {socialTwitter && (
                      <span className="text-white/40 hover:text-white/70 transition-colors" title={socialTwitter}>
                        <Twitter className="h-4 w-4" />
                      </span>
                    )}
                    {socialInstagram && (
                      <span className="text-white/40 hover:text-white/70 transition-colors" title={socialInstagram}>
                        <Instagram className="h-4 w-4" />
                      </span>
                    )}
                    {socialFacebook && (
                      <span className="text-white/40 hover:text-white/70 transition-colors" title={socialFacebook}>
                        <Facebook className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                )}

                {hendonMobUrl && (
                  <div className="flex items-center justify-center">
                    <a href={hendonMobUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-gold-400 hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      Hendon Mob
                    </a>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {t('verified')}
                    </span>
                    {isVerified ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">{t('verified')}</Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white/40 border-white/10 text-[10px]">{t('unverified')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">{t('kycStatus')}</span>
                    {kycBadge()}
                  </div>
                </div>

                <Separator className="bg-white/[0.06]" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('memberSince')}
                  </span>
                  <span className="text-white/70">{memberSince ? formatDate(memberSince, locale) : '—'}</span>
                </div>

                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-[10px] text-white/30 mb-1">{t('email')} ({t('readOnly')})</p>
                  <p className="text-xs text-white/60 font-mono">{email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedImageSrc && (
        <AvatarCropModal
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          imageSrc={selectedImageSrc}
          onCropped={handleCropped}
        />
      )}
    </div>
  );
}
