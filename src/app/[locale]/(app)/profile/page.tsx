'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlayerAvatar } from '@/components/shared/player-avatar';
import { formatDate } from '@/lib/format';
import { Loader2, CheckCircle, Shield, User, MapPin, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations('profile');
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
  const [role, setRole] = useState('investor');
  const [region, setRegion] = useState('TW');

  // Read-only fields
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [kycStatus, setKycStatus] = useState('none');
  const [memberSince, setMemberSince] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setDisplayName(p.display_name || '');
          setDisplayNameZh(p.display_name_zh || '');
          setAvatarUrl(p.avatar_url || '');
          setBio(p.bio || '');
          setBioZh(p.bio_zh || '');
          setRole(p.role || 'investor');
          setRegion(p.region || 'TW');
          setEmail(p.email || '');
          setIsVerified(p.is_verified || false);
          setKycStatus(p.kyc_status || 'none');
          setMemberSince(p.member_since || p.created_at || '');
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

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
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim() || null,
          bio_zh: bioZh.trim() || null,
          role,
          region,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }

      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = [
    { value: 'investor', label: t('roleInvestor') },
    { value: 'player', label: t('rolePlayer') },
    { value: 'both', label: t('roleBoth') },
  ] as const;

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
        <div className="lg:col-span-3">
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-gold-400" />
                {t('editInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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

              {/* Avatar URL */}
              <div>
                <label className="mb-1.5 block text-xs text-white/50">{t('avatarUrl')}</label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
                  placeholder={t('avatarUrlPlaceholder')}
                />
                <p className="mt-1 text-[10px] text-white/30">{t('avatarUrlHelp')}</p>
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

              {/* Role Selector */}
              <div>
                <label className="mb-2 block text-xs text-white/50">{t('role')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        role === opt.value
                          ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region Selector */}
              <div>
                <label className="mb-2 block text-xs text-white/50">{t('region')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {regionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRegion(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        region === opt.value
                          ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                          : 'border-white/10 text-white/50 hover:border-white/20'
                      }`}
                    >
                      {opt.flag} {opt.label}
                    </button>
                  ))}
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
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <Card className="border-white/[0.06] bg-[#111318]">
              <CardHeader>
                <CardTitle className="text-white text-sm">{t('preview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar + Name */}
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

                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="border-gold-500/30 text-gold-400">
                    {roleOptions.find((r) => r.value === role)?.label}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-white/60">
                    <MapPin className="mr-1 h-3 w-3" />
                    {regionOptions.find((r) => r.value === region)?.flag}{' '}
                    {regionOptions.find((r) => r.value === region)?.label}
                  </Badge>
                </div>

                {/* Verification Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {t('verified')}
                    </span>
                    {isVerified ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                        {t('verified')}
                      </Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white/40 border-white/10 text-[10px]">
                        {t('unverified')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">{t('kycStatus')}</span>
                    {kycBadge()}
                  </div>
                </div>

                <Separator className="bg-white/[0.06]" />

                {/* Member Since */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('memberSince')}
                  </span>
                  <span className="text-white/70">{memberSince ? formatDate(memberSince, locale) : '—'}</span>
                </div>

                {/* Email (read-only) */}
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-[10px] text-white/30 mb-1">{t('email')} ({t('readOnly')})</p>
                  <p className="text-xs text-white/60 font-mono">{email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
