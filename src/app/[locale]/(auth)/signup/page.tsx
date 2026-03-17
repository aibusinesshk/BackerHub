'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spade, TrendingUp, Gamepad2, Layers, Loader2, CheckCircle2 } from 'lucide-react';
import type { UserRole, Region } from '@/types';

export default function SignupPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { signup } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('investor');
  const [region, setRegion] = useState<Region>('TW');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signup({ displayName, email, password, role, region });
      if (result.success) {
        // Show email verification message
        setShowVerification(true);
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles: { value: UserRole; label: string; icon: typeof TrendingUp }[] = [
    { value: 'investor', label: t('roleInvestor'), icon: TrendingUp },
    { value: 'player', label: t('rolePlayer'), icon: Gamepad2 },
    { value: 'both', label: t('roleBoth'), icon: Layers },
  ];

  if (showVerification) {
    return (
      <Card className="relative z-10 w-full max-w-md border-white/[0.06] bg-[#111318]">
        <CardContent className="pt-8 pb-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-400" />
          <h2 className="mb-2 text-xl font-semibold text-white">Check your email</h2>
          <p className="mb-4 text-white/50">
            We sent a verification link to <span className="text-gold-400">{email}</span>.
            Click the link to activate your account.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="bg-gold-500 text-black font-semibold hover:bg-gold-400"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative z-10 w-full max-w-md border-white/[0.06] bg-[#111318]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500 text-black">
          <Spade className="h-7 w-7" />
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
              placeholder="Minimum 6 characters"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">{t('selectRole')}</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  disabled={isSubmitting}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-all ${
                    role === r.value
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                      : 'border-white/[0.06] text-white/50 hover:border-white/20'
                  }`}
                >
                  <r.icon className="h-5 w-5" />
                  {r.label}
                </button>
              ))}
            </div>
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
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs transition-all ${
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
            className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
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
