'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { CRYPTO_COINS } from '@/lib/constants';

export function PaymentMethods() {
  const t = useTranslations('payments');

  return (
    <section className="py-24 bg-[#080a0e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
            <p className="mt-4 text-lg text-white/50">{t('subtitle')}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-4">
            {CRYPTO_COINS.map((coin) => (
              <div
                key={coin.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111318] px-6 py-4 transition-colors hover:border-gold-500/20"
              >
                <span className="text-2xl font-bold text-gold-400">{coin.icon}</span>
                <div>
                  <span className="text-sm font-medium text-white block">{coin.name}</span>
                  <span className="text-[10px] text-white/30">{coin.network}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
