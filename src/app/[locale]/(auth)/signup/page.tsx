'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import type { Region } from '@/types';

export default function SignupPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { signup } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState<Region>('TW');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(tc('passwordMinLength'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signup({ displayName, email, password, role: 'both', region });
      if (result.success) {
        // Hard navigation so middleware picks up the new session cookie
        const locale = window.location.pathname.match(/^\/(en|zh-TW)/)?.[1] || 'en';
        window.location.href = `/${locale}/dashboard/player`;
      } else {
        setError(result.error || tc('signupFailed'));
      }
    } catch {
      setError(tc('unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative z-10 w-full max-w-md border-white/[0.06] bg-[#111318]">
      <Link href="/" className="absolute right-3 top-3 rounded-full p-2.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors active:opacity-70">
        <X className="h-5 w-5" />
      </Link>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Image src="/images/logo-hero.png" alt="BackerHub" width={350} height={100} className="h-14 w-auto" priority />
        </div>
        <CardTitle className="text-2xl text-white">{t('signupTitle')}</CardTitle>
        <CardDescription className="text-white/50">{t('signupSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-white/70">{t('displayName')}</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/70">{t('email')}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/70">{t('password')}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tc('passwordPlaceholder')}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">{t('selectRegion')}</label>
            <div className="grid grid-cols-3 gap-2">
              {([['TW', t('regionTW'), '🇹🇼'], ['HK', t('regionHK'), '🇭🇰'], ['OTHER', t('regionOther'), '🌐']] as const).map(([val, label, flag]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRegion(val as Region)}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-sm transition-all min-h-[44px] ${
                    region === val
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                      : 'border-white/[0.06] text-white/50 hover:border-white/20'
                  }`}
                >
                  {flag} {label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {tc('creatingAccount')}</>
            ) : (
              t('signupTitle')
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-gold-400 hover:underline">{t('loginTitle')}</Link>
        </p>
      </CardContent>
    </Card>
  );
}
