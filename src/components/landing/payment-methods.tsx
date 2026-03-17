'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PaymentMethods() {
  const t = useTranslations('payments');
  const locale = useLocale();

  const renderMethods = (methods: readonly { id: string; name: string; nameZh: string }[]) => (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      {methods.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#111318] px-4 py-3 transition-colors hover:border-gold-500/20"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-gold-400">
            {m.name.charAt(0)}
          </div>
          <span className="text-sm text-white/70">{locale === 'zh-TW' ? m.nameZh : m.name}</span>
        </div>
      ))}
    </div>
  );

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
          <Tabs defaultValue="taiwan" className="w-full">
            <TabsList className="mx-auto flex w-fit bg-white/5">
              <TabsTrigger value="taiwan" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
                🇹🇼 {t('taiwan')}
              </TabsTrigger>
              <TabsTrigger value="hongkong" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
                🇭🇰 {t('hongkong')}
              </TabsTrigger>
              <TabsTrigger value="international" className="data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
                🌐 {t('international')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="taiwan">{renderMethods(PAYMENT_METHODS.taiwan)}</TabsContent>
            <TabsContent value="hongkong">{renderMethods(PAYMENT_METHODS.hongkong)}</TabsContent>
            <TabsContent value="international">{renderMethods(PAYMENT_METHODS.international)}</TabsContent>
          </Tabs>
        </ScrollReveal>
      </div>
    </section>
  );
}
