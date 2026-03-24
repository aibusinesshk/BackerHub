'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { ScanFace, Lock, Eye, Headphones } from 'lucide-react';

export function TrustBadges() {
  const t = useTranslations('trust');

  const items = [
    { icon: ScanFace, title: t('verified'), desc: t('verifiedDesc'), color: 'gold' },
    { icon: Lock, title: t('secure'), desc: t('secureDesc'), color: 'green' },
    { icon: Eye, title: t('transparent'), desc: t('transparentDesc'), color: 'blue' },
    { icon: Headphones, title: t('support'), desc: t('supportDesc'), color: 'purple' },
  ];

  const colorMap: Record<string, { bg: string; hoverBg: string; text: string; border: string }> = {
    gold: { bg: 'bg-gold-500/10', hoverBg: 'group-hover:bg-gold-500/15', text: 'text-gold-400', border: 'group-hover:border-gold-500/15' },
    green: { bg: 'bg-emerald-500/10', hoverBg: 'group-hover:bg-emerald-500/15', text: 'text-emerald-400', border: 'group-hover:border-emerald-500/15' },
    blue: { bg: 'bg-blue-500/10', hoverBg: 'group-hover:bg-blue-500/15', text: 'text-blue-400', border: 'group-hover:border-blue-500/15' },
    purple: { bg: 'bg-purple-500/10', hoverBg: 'group-hover:bg-purple-500/15', text: 'text-purple-400', border: 'group-hover:border-purple-500/15' },
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Subtle background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/poker-chips.jpg"
          alt=""
          fill
          className="object-cover object-center"
          quality={75}
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/92" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400/80">
              {t('title')}
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const colors = colorMap[item.color];
            return (
              <ScrollReveal key={item.title} delay={i * 0.1}>
                <div className={`group text-center rounded-2xl border border-white/[0.06] bg-[#111318]/80 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] ${colors.border}`}>
                  <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg} ${colors.hoverBg} border border-white/[0.04] transition-all duration-300 group-hover:scale-110`}>
                    <item.icon className={`h-7 w-7 ${colors.text}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
