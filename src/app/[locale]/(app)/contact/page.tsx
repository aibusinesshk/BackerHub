'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const t = useTranslations('contact');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputClassName =
    'w-full rounded-lg bg-white/[0.03] border border-white/10 text-white px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold-500/50';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    setSubmitting(false);
  }

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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <Badge className="bg-gold-500/10 text-gold-500 border-gold-500/20 px-4 py-1.5 text-sm">
            {t('badge')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            {t('title')}
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-[#111318] border-white/[0.06]">
              <CardContent className="pt-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/10">
                    <Mail className="h-4 w-4 text-gold-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{t('emailLabel')}</h4>
                    <p className="text-sm text-white/50">support@backerhub.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{t('liveChat')}</h4>
                    <p className="text-sm text-white/50">{t('liveChatDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <MapPin className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{t('location')}</h4>
                    <p className="text-sm text-white/50">{t('locationDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                    <Clock className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{t('hours')}</h4>
                    <p className="text-sm text-white/50">{t('hoursDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111318] border-white/[0.06]">
              <CardContent className="pt-5 pb-5">
                <h4 className="text-sm font-medium text-white mb-2">{t('languages')}</h4>
                <div className="flex gap-2">
                  <Badge className="bg-white/[0.06] text-white/60 border-white/10">English</Badge>
                  <Badge className="bg-white/[0.06] text-white/60 border-white/10">繁體中文</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <Card className="bg-[#111318] border-white/[0.06]">
              <CardHeader>
                <CardTitle className="text-white text-base">{t('formTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-white/70">
                        {t('nameLabel')} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('namePlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-white/70">
                        {t('emailFieldLabel')} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('emailPlaceholder')}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white/70">
                      {t('subjectLabel')}
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={inputClassName}
                    >
                      <option value="general">{t('subjectGeneral')}</option>
                      <option value="backing">{t('subjectBacking')}</option>
                      <option value="selling">{t('subjectSelling')}</option>
                      <option value="payment">{t('subjectPayment')}</option>
                      <option value="account">{t('subjectAccount')}</option>
                      <option value="partnership">{t('subjectPartnership')}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white/70">
                      {t('messageLabel')} <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('messagePlaceholder')}
                      rows={5}
                      className={inputClassName}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || !name || !email || !message}
                    className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-40"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {t('sendButton')}
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
