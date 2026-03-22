'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode: just show success
        setSent(true);
        return;
      }

      const supabase = createClient();
      const locale = window.location.pathname.match(/^\/(en|zh-TW)/)?.[1] || 'en';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/api/auth/callback?next=/${locale}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
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
        <CardTitle className="text-2xl text-white">{t('resetTitle')}</CardTitle>
        <CardDescription className="text-white/50">{t('resetSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="text-center py-6">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <p className="text-white/70">{t('resetSent')}</p>
            <Link href="/login" className="mt-4 inline-flex items-center gap-2 text-sm text-gold-400 hover:underline">
              <ArrowLeft className="h-4 w-4" /> {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm text-white/70">{t('email')}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendResetLink')}
            </Button>
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/60">
              <ArrowLeft className="h-4 w-4" /> {t('backToLogin')}
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
