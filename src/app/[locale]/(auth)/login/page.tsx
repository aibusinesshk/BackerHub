'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const { login, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
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

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setError(result.error || tc('unexpectedError'));
        setIsGoogleLoading(false);
      }
      // On success, Supabase redirects — no need to handle here
    } catch {
      setError(tc('unexpectedError'));
      setIsGoogleLoading(false);
    }
  };

  const isBusy = isSubmitting || isGoogleLoading;

  return (
    <Card className="relative z-10 w-full max-w-md border-white/[0.06] bg-[#111318]">
      <Link href="/" className="absolute right-3 top-3 rounded-full p-2.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors active:opacity-70">
        <X className="h-5 w-5" />
      </Link>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Image src="/images/logo-hero.png" alt="BackerHub" width={350} height={100} className="h-14 w-auto" priority />
        </div>
        <CardTitle className="text-2xl text-white">{t('loginTitle')}</CardTitle>
        <CardDescription className="text-white/50">{t('loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Google Sign-In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          className="w-full h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white mb-6"
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {t('google')}
        </Button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#111318] px-3 text-white/30">{t('orContinueWith')}</span>
          </div>
        </div>

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
              disabled={isBusy}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/70">{t('password')}</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                required
                disabled={isBusy}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isBusy}
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
            disabled={isBusy}
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
