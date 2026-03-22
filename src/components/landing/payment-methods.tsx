'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { CRYPTO_COINS } from '@/lib/constants';

export function PaymentMethods() {
  const t = useTranslations('payments');

  return (
    <section className="relative py-24 bg-[#080a0e]">
      {/* Section divider at top */}
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400/80">
              {t('title')}
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50 max-w-2xl mx-auto">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-4">
            {CRYPTO_COINS.map((coin) => (
              <div
                key={coin.id}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111318] px-6 py-4 transition-all duration-300 hover:border-gold-500/20 hover:bg-[#111318]/80 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <span className="text-2xl font-bold text-gold-400 transition-transform duration-300 group-hover:scale-110">{coin.icon}</span>
                <div>
                  <span className="text-sm font-medium text-white block">{coin.name}</span>
                  <span className="text-[10px] text-white/30">{coin.network}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Section divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 section-divider" />
    </section>
  );
}
