'use client';

import { useTranslations } from 'next-intl';
import {
  Users,
  ShoppingCart,
  Shield,
  Wallet,
  ClipboardCheck,
  Gamepad2,
  Trophy,
  Banknote,
  CheckCircle2,
  ArrowDown,
  Lock,
  Clock,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

const FLOW_STEPS = [
  {
    key: 'listing',
    icon: ShoppingCart,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    hasDeadline: false,
  },
  {
    key: 'backing',
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    hasDeadline: false,
  },
  {
    key: 'escrow',
    icon: Shield,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    hasDeadline: false,
  },
  {
    key: 'buyinRelease',
    icon: Wallet,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    hasDeadline: true,
  },
  {
    key: 'registration',
    icon: ClipboardCheck,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    hasDeadline: false,
  },
  {
    key: 'tournament',
    icon: Gamepad2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    hasDeadline: false,
  },
  {
    key: 'result',
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    hasDeadline: true,
  },
  {
    key: 'deposit',
    icon: Banknote,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    hasDeadline: true,
  },
  {
    key: 'settlement',
    icon: CheckCircle2,
    color: 'text-gold-500',
    bgColor: 'bg-gold-500/10',
    borderColor: 'border-gold-500/20',
    hasDeadline: false,
  },
] as const;

const PROTECTION_FEATURES = [
  { key: 'escrowProtection', icon: Shield, color: 'text-cyan-400' },
  { key: 'withdrawalLock', icon: Lock, color: 'text-red-400' },
  { key: 'deadlines', icon: Clock, color: 'text-orange-400' },
  { key: 'verification', icon: Eye, color: 'text-green-400' },
  { key: 'reliability', icon: CheckCircle2, color: 'text-gold-500' },
] as const;

export default function HowItWorksPage() {
  const t = useTranslations('flowIntro');

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-16">
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

        {/* Flow Overview Diagram */}
        <div className="relative">
          {/* Steps */}
          <div className="space-y-0">
            {FLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === FLOW_STEPS.length - 1;

              return (
                <div key={step.key}>
                  {/* Step Card */}
                  <div className="relative flex gap-4 sm:gap-6">
                    {/* Timeline line + circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${step.bgColor} border ${step.borderColor}`}
                      >
                        <Icon className={`h-6 w-6 ${step.color}`} />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 bg-gradient-to-b from-white/20 to-white/5 min-h-[24px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-8 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono text-white/30">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-lg font-semibold text-white">
                          {t(`steps.${step.key}.title`)}
                        </h3>
                        <Badge
                          className={`${step.bgColor} ${step.color} border ${step.borderColor} text-[10px] px-2 py-0.5`}
                        >
                          {t(`steps.${step.key}.status`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/50 leading-relaxed mb-3">
                        {t(`steps.${step.key}.description`)}
                      </p>

                      {/* Who does what */}
                      <div className="flex flex-wrap gap-2">
                        {t(`steps.${step.key}.actor`) && (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 text-xs text-white/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                            {t(`steps.${step.key}.actor`)}
                          </span>
                        )}
                        {step.hasDeadline && (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-500/5 border border-orange-500/10 px-2.5 py-1 text-xs text-orange-400/60">
                            <Clock className="h-3 w-3" />
                            {t(`steps.${step.key}.deadline`)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outcome Scenarios */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">
            {t('outcomes.title')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Win */}
            <Card className="bg-[#111318] border-green-500/10">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                    <Trophy className="h-4 w-4 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-green-400">
                    {t('outcomes.win.title')}
                  </h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  {t('outcomes.win.description')}
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <ArrowDown className="h-3 w-3 text-green-400" />
                    {t('outcomes.win.step1')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <ArrowDown className="h-3 w-3 text-green-400" />
                    {t('outcomes.win.step2')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    {t('outcomes.win.step3')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loss */}
            <Card className="bg-[#111318] border-white/[0.06]">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                    <AlertTriangle className="h-4 w-4 text-white/40" />
                  </div>
                  <h3 className="font-semibold text-white/70">
                    {t('outcomes.loss.title')}
                  </h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  {t('outcomes.loss.description')}
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <ArrowDown className="h-3 w-3 text-white/30" />
                    {t('outcomes.loss.step1')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 className="h-3 w-3 text-white/30" />
                    {t('outcomes.loss.step2')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancelled */}
            <Card className="bg-[#111318] border-yellow-500/10">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Banknote className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h3 className="font-semibold text-yellow-400">
                    {t('outcomes.cancelled.title')}
                  </h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  {t('outcomes.cancelled.description')}
                </p>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <ArrowDown className="h-3 w-3 text-yellow-400" />
                    {t('outcomes.cancelled.step1')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <CheckCircle2 className="h-3 w-3 text-yellow-400" />
                    {t('outcomes.cancelled.step2')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Risk Protection Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">
            {t('protection.title')}
          </h2>
          <p className="text-center text-white/40 text-sm max-w-xl mx-auto">
            {t('protection.subtitle')}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROTECTION_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.key}
                  className="bg-[#111318] border-white/[0.06] hover:border-white/10 transition-colors"
                >
                  <CardContent className="pt-5 pb-5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${feature.color}`} />
                      <h4 className="text-sm font-medium text-white">
                        {t(`protection.${feature.key}.title`)}
                      </h4>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                      {t(`protection.${feature.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Money Flow Diagram */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">
            {t('moneyFlow.title')}
          </h2>

          <Card className="bg-[#111318] border-white/[0.06] overflow-hidden">
            <CardContent className="pt-6 space-y-6">
              {/* Backing Phase */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-400" />
                  {t('moneyFlow.backingPhase')}
                </h4>
                <div className="flex items-center gap-3 text-xs text-white/50 pl-4">
                  <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-purple-400">
                    {t('moneyFlow.backer')}
                  </span>
                  <ArrowDown className="h-3 w-3 rotate-[-90deg] text-white/20" />
                  <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 text-cyan-400">
                    {t('moneyFlow.escrow')}
                  </span>
                  <span className="text-white/30 text-[10px]">{t('moneyFlow.backingNote')}</span>
                </div>
              </div>

              <div className="border-t border-white/[0.04]" />

              {/* Release Phase */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  {t('moneyFlow.releasePhase')}
                </h4>
                <div className="flex items-center gap-3 text-xs text-white/50 pl-4">
                  <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 text-cyan-400">
                    {t('moneyFlow.escrow')}
                  </span>
                  <ArrowDown className="h-3 w-3 rotate-[-90deg] text-white/20" />
                  <span className="rounded bg-green-500/10 border border-green-500/20 px-2 py-1 text-green-400">
                    {t('moneyFlow.playerWallet')}
                  </span>
                  <span className="text-white/30 text-[10px]">{t('moneyFlow.releaseNote')}</span>
                </div>
              </div>

              <div className="border-t border-white/[0.04]" />

              {/* Settlement Phase (Win) */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gold-500" />
                  {t('moneyFlow.settlementPhase')}
                </h4>
                <div className="flex items-center gap-3 text-xs text-white/50 pl-4 flex-wrap">
                  <span className="rounded bg-green-500/10 border border-green-500/20 px-2 py-1 text-green-400">
                    {t('moneyFlow.player')}
                  </span>
                  <ArrowDown className="h-3 w-3 rotate-[-90deg] text-white/20" />
                  <span className="rounded bg-gold-500/10 border border-gold-500/20 px-2 py-1 text-gold-500">
                    {t('moneyFlow.platform')}
                  </span>
                  <ArrowDown className="h-3 w-3 rotate-[-90deg] text-white/20" />
                  <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-purple-400">
                    {t('moneyFlow.backers')}
                  </span>
                </div>
                <p className="text-[10px] text-white/30 pl-4">
                  {t('moneyFlow.settlementNote')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pb-8">
          <h2 className="text-2xl font-bold text-white">{t('cta.title')}</h2>
          <p className="text-white/40 text-sm">{t('cta.subtitle')}</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              render={<Link href="/marketplace" />}
              className="bg-gold-500 text-black font-semibold hover:bg-gold-400 px-6"
            >
              {t('cta.browse')}
            </Button>
            <Button
              render={<Link href="/signup" />}
              className="bg-white/[0.06] text-white border border-white/10 hover:bg-white/10 px-6"
            >
              {t('cta.signup')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
