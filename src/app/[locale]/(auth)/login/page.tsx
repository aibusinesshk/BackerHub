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

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
        // Hard navigation so middleware picks up the new session cookie
        const locale = window.location.pathname.match(/^\/(en|zh-TW)/)?.[1] || 'en';
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || `/${locale}/dashboard/investor`;
        window.location.href = redirect;
      } else {
        setError(result.error || tc('invalidCredentials'));
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
          <Image src="/images/logo-transparent.png" alt="BackerHub" width={160} height={80} className="h-16 w-auto" priority />
        </div>
        <CardTitle className="text-2xl text-white">{t('loginTitle')}</CardTitle>
        <CardDescription className="text-white/50">{t('loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-white/70">{t('email')}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
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
              placeholder="••••••••"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500/50 focus:ring-offset-0 accent-[#F5B81C]"
              />
              <span className="text-sm text-white/50">{t('rememberMe')}</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-gold-400 hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('signingIn')}</>
            ) : (
              t('loginTitle')
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-gold-400 hover:underline">{t('signupTitle')}</Link>
        </p>
      </CardContent>
    </Card>
  );
}
