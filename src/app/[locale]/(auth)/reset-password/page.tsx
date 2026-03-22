'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        setDone(true);
        return;
      }

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setDone(true);
      }
    } catch {
      setError(t('resetError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="relative z-10 w-full max-w-md border-white/[0.06] bg-[#111318]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Image src="/images/logo-hero.png" alt="BackerHub" width={350} height={100} className="h-14 w-auto" priority />
        </div>
        <CardTitle className="text-2xl text-white">{t('newPasswordTitle')}</CardTitle>
        <CardDescription className="text-white/50">{t('newPasswordSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <p className="text-white/70 mb-4">{t('passwordUpdated')}</p>
            <Button
              render={<Link href="/login" />}
              className="bg-gold-500 text-black font-semibold hover:bg-gold-400"
            >
              {t('backToLogin')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm text-white/70">{t('newPassword')}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder={t('newPasswordPlaceholder')}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">{t('confirmPassword')}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder={t('confirmPasswordPlaceholder')}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('updatePassword')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
