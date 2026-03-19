'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  DollarSign,
  TrendingUp,
  Percent,
  ShieldCheck,
  Wallet,
  Clock,
  Building2,
  ArrowLeftRight,
  Users,
  Gamepad2,
  Gift,
  BadgeCheck,
  Info,
} from 'lucide-react';

const BREAKDOWN_ITEMS = [
  { key: 'Base', icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', waived: false },
  { key: 'Markup', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', waived: false },
  { key: 'Platform', icon: Percent, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', waived: true },
] as const;

const EXTERNAL_FEES = [
  { key: '1', icon: Wallet, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { key: '2', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { key: '3', icon: Building2, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { key: '4', icon: ArrowLeftRight, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
] as const;

const NEVER_CHARGE_KEYS = ['1', '2', '3', '4', '5', '6', '7'] as const;

export default function PricingPage() {
  const t = useTranslations('pricing');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-20">
      {/* Hero */}
      <ScrollReveal>
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-6 border-gold-500/30 bg-gold-500/10 text-gold-400 px-4 py-1.5 text-sm">
            {t('badge')}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t('title')}
            <br />
            <span className="gold-gradient-text">{t('titleHighlight')}</span>
          </h1>
          <p className="mt-6 text-lg text-white/60 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>
      </ScrollReveal>

      {/* Big 0% Fee Card */}
      <ScrollReveal>
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('whatWaived')}</h2>
            <p className="text-white/40">{t('whatWaivedSub')}</p>
          </div>

          <Card className="border-gold-500/20 bg-gradient-to-b from-gold-500/5 to-transparent overflow-hidden">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Left: visual */}
                <div className="text-center md:text-left shrink-0">
                  <div className="inline-flex items-center gap-3 mb-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 border border-gold-500/20">
                      <Sparkles className="h-7 w-7 text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/40 line-through">{t('feeNormal')}</p>
                      <p className="text-3xl font-bold text-gold-400">{t('feeNow')}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white">{t('feeTitle')}</h3>
                </div>
                {/* Right: description */}
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-white/60 leading-relaxed">{t('feeDesc')}</p>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{t('feeSaved')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {/* Savings Example */}
      <ScrollReveal>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('exampleTitle')}</h2>
            <p className="text-white/40">{t('exampleSubtitle')}</p>
          </div>

          {/* Scenario Description */}
          <Card className="border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-white/30 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white/70">{t('exampleScenario')}</p>
                  <p className="text-sm text-white/40 mt-1">{t('exampleScenarioDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* After Launch (with fee) */}
            <Card className="border-white/[0.06] bg-[#111318]">
              <CardContent className="pt-6 pb-6 space-y-4">
                <div className="text-center">
                  <p className="text-xs font-medium text-white/30 uppercase tracking-wider">{t('exampleWithFee')}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t('exampleBaseCost')}</span>
                    <span className="text-white/70">$100.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t('exampleMarkup')}</span>
                    <span className="text-white/70">$10.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t('examplePlatformFee')}</span>
                    <span className="text-red-400">$2.20</span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-3 flex justify-between">
                    <span className="text-sm font-medium text-white/70">{t('exampleTotal')}</span>
                    <span className="text-lg font-bold text-white">$112.20</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pre-Launch (no fee) */}
            <Card className="border-gold-500/20 bg-gradient-to-b from-gold-500/5 to-[#111318]">
              <CardContent className="pt-6 pb-6 space-y-4">
                <div className="text-center">
                  <Badge className="bg-gold-500/10 text-gold-400 border-gold-500/20 text-xs">
                    {t('exampleWithoutFee')}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t('exampleBaseCost')}</span>
                    <span className="text-white/70">$100.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t('exampleMarkup')}</span>
                    <span className="text-white/70">$10.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t('examplePlatformFee')}</span>
                    <span className="text-green-400 line-through">$0.00</span>
                  </div>
                  <div className="border-t border-gold-500/10 pt-3 flex justify-between">
                    <span className="text-sm font-medium text-white/70">{t('exampleTotal')}</span>
                    <span className="text-lg font-bold text-gold-400">$110.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-white/30">
            {t('exampleSaving', { amount: '$2.20' })} — {t('exampleNote')}
          </p>
        </div>
      </ScrollReveal>

      {/* Full Cost Breakdown */}
      <ScrollReveal>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('breakdownTitle')}</h2>
            <p className="text-white/40">{t('breakdownSubtitle')}</p>
          </div>

          <div className="space-y-4">
            {BREAKDOWN_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.key} className={`border-white/[0.06] bg-[#111318] ${item.waived ? 'ring-1 ring-green-500/20' : ''}`}>
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} border ${item.border}`}>
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-white">
                            {t(`breakdown${item.key}`)}
                          </h3>
                          <Badge className={`text-[10px] px-2 py-0.5 ${
                            item.waived
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : `${item.bg} ${item.color} border ${item.border}`
                          }`}>
                            {t(`breakdown${item.key}Status`)}
                          </Badge>
                          {item.waived && (
                            <span className="text-xs text-white/30 line-through">{t('breakdownPlatformNormal')}</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm text-white/50 leading-relaxed">
                          {t(`breakdown${item.key}Desc`)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* Player Economics */}
      <ScrollReveal>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('playerTitle')}</h2>
            <p className="text-white/40">{t('playerSubtitle')}</p>
          </div>

          <Card className="border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-6 pb-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/20">
                  <Gamepad2 className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{t('playerEarn')}</h3>
                  <p className="text-sm text-white/50 mt-1">{t('playerEarnDesc')}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold-400" />
                    <h4 className="text-sm font-medium text-white">{t('playerKeep')}</h4>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{t('playerKeepDesc')}</p>
                </div>

                <div className="rounded-xl border border-white/[0.06] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-sm font-medium text-white">{t('playerBuyIn')}</h4>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{t('playerBuyInDesc')}</p>
                </div>

                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <h4 className="text-sm font-medium text-green-400">{t('playerNoFee')}</h4>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{t('playerNoFeeDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {/* Third-Party & Network Fees */}
      <ScrollReveal>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('externalTitle')}</h2>
            <p className="text-white/40">{t('externalSubtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {EXTERNAL_FEES.map((fee) => {
              const Icon = fee.icon;
              return (
                <Card key={fee.key} className="border-white/[0.06] bg-[#111318]">
                  <CardContent className="pt-5 pb-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${fee.bg} border ${fee.border}`}>
                        <Icon className={`h-4 w-4 ${fee.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {t(`external${fee.key}Title`)}
                        </h3>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed">
                          {t(`external${fee.key}Desc`)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/30 uppercase tracking-wider">Estimate</span>
                        <span className={`text-xs font-medium ${fee.color}`}>
                          {t(`external${fee.key}Estimate`)}
                        </span>
                      </div>
                      <p className="text-xs text-white/30">
                        {t(`external${fee.key}Note`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#111318] p-4">
            <ShieldCheck className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-white/50 leading-relaxed">
              {t('externalDisclaimer')}
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Why Free */}
      <ScrollReveal>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('whyFreeTitle')}</h2>
            <p className="text-white/40">{t('whyFreeSubtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(['1', '2', '3'] as const).map((key, i) => (
              <ScrollReveal key={key} delay={i * 0.1}>
                <Card className="h-full border-white/[0.06] bg-[#111318]">
                  <CardContent className="pt-6 pb-6 space-y-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 text-sm font-bold">
                      {i + 1}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{t(`why${key}Title`)}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{t(`why${key}Desc`)}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* After Launch */}
      <ScrollReveal>
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">{t('afterLaunchTitle')}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{t('afterLaunchDesc')}</p>
                <p className="text-xs text-white/30">{t('afterLaunchNote')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Fees We'll Never Charge */}
      <ScrollReveal>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('neverChargeTitle')}</h2>
            <p className="text-white/40">{t('neverChargeSub')}</p>
          </div>

          <Card className="border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-6 pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {NEVER_CHARGE_KEYS.map((key) => (
                  <div key={key} className="flex items-center gap-2.5">
                    <Gift className="h-4 w-4 text-green-400 shrink-0" />
                    <span className="text-sm text-white/60">{t(`neverCharge${key}`)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollReveal>
        <div className="relative rounded-2xl border border-gold-500/20 bg-gradient-to-b from-gold-500/5 to-transparent p-8 sm:p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,184,28,0.06)_0%,transparent_70%)]" />
          <div className="relative space-y-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl max-w-2xl mx-auto leading-tight">
              {t('ctaTitle')}
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {t('ctaSubtitle')}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row justify-center pt-2">
              <Button
                size="lg"
                render={<Link href="/marketplace" />}
                className="bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow px-8 h-12 text-base"
              >
                {t('ctaBacker')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href={'/create-listing' as any} />}
                className="border-white/20 text-white hover:bg-white/5 px-8 h-12 text-base"
              >
                {t('ctaPlayer')}
              </Button>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
