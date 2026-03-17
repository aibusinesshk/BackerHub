'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spade, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login, loginWithGoogle, loginWithLINE } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard/investor');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative z-10 w-full max-w-md border-white/[0.06] bg-[#111318]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500 text-black">
          <Spade className="h-7 w-7" />
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
          <Link href="/forgot-password" className="block text-sm text-gold-400 hover:underline">
            {t('forgotPassword')}
          </Link>
          <Button
            type="submit"
            className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
            ) : (
              t('loginTitle')
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <Separator className="bg-white/[0.06]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111318] px-3 text-xs text-white/40">
              {t('orContinueWith')}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-white/10 text-white/70 hover:text-white"
              onClick={loginWithGoogle}
              type="button"
            >
              {t('google')}
            </Button>
            <Button
              variant="outline"
              className="border-white/10 text-white/70 hover:text-white"
              onClick={loginWithLINE}
              type="button"
            >
              {t('line')}
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-gold-400 hover:underline">{t('signupTitle')}</Link>
        </p>
      </CardContent>
    </Card>
  );
}
