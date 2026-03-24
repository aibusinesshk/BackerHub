'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Zap, ScanFace, ShieldAlert, Fingerprint } from 'lucide-react';

export function AiVerification() {
  const t = useTranslations('aiVerification');

  const features = [
    {
      icon: Zap,
      title: t('speedTitle'),
      desc: t('speedDesc'),
      color: 'gold',
      stat: t('speedStat'),
    },
    {
      icon: ScanFace,
      title: t('accuracyTitle'),
      desc: t('accuracyDesc'),
      color: 'blue',
      stat: t('accuracyStat'),
    },
    {
      icon: ShieldAlert,
      title: t('fraudTitle'),
      desc: t('fraudDesc'),
      color: 'red',
      stat: t('fraudStat'),
    },
    {
      icon: Fingerprint,
      title: t('privacyTitle'),
      desc: t('privacyDesc'),
      color: 'green',
      stat: t('privacyStat'),
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; statBg: string; glow: string }> = {
    gold: { bg: 'bg-gold-500/10', text: 'text-gold-400', statBg: 'bg-gold-500/10 text-gold-400', glow: 'rgba(245,184,28,0.06)' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', statBg: 'bg-blue-500/10 text-blue-400', glow: 'rgba(59,130,246,0.06)' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', statBg: 'bg-red-500/10 text-red-400', glow: 'rgba(239,68,68,0.06)' },
    green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', statBg: 'bg-emerald-500/10 text-emerald-400', glow: 'rgba(16,185,129,0.06)' },
  };

  return (
    <section className="relative py-24 bg-[#080a0e] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.04)_0%,transparent_60%)]" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
              </span>
              {t('badge')}
            </span>
          </div>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Feature grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, i) => {
            const colors = colorMap[feat.color];
            return (
              <ScrollReveal key={feat.title} delay={i * 0.1}>
                <div
                  className="group relative rounded-2xl border border-white/[0.06] bg-[#111318]/80 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-purple-500/15"
                  style={{ boxShadow: `0 0 40px ${colors.glow}` }}
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} border border-white/[0.04] transition-all duration-300 group-hover:scale-110`}>
                    <feat.icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{feat.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed mb-4">{feat.desc}</p>
                  <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors.statBg}`}>
                    {feat.stat}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bottom highlight */}
        <ScrollReveal delay={0.4}>
          <div className="mt-12 rounded-2xl border border-purple-500/10 bg-purple-500/[0.03] p-6 sm:p-8 text-center">
            <p className="text-sm sm:text-base text-white/60 max-w-3xl mx-auto leading-relaxed">
              {t('footerText')}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
