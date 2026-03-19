'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import {
  ShieldAlert,
  Ghost,
  EyeOff,
  UserX,
  Vault,
  Gavel,
  ClipboardCheck,
  Star,
  Receipt,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  Users,
  Gamepad2,
} from 'lucide-react';

const PROBLEMS = [
  { key: '1', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { key: '2', icon: Ghost, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { key: '3', icon: EyeOff, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { key: '4', icon: UserX, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
] as const;

const SOLUTIONS = [
  { key: '1', icon: Vault, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { key: '2', icon: Gavel, color: 'text-green-400', bg: 'bg-green-500/10' },
  { key: '3', icon: ClipboardCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: '4', icon: Star, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  { key: '5', icon: Receipt, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: '6', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
] as const;

const COMPARISONS = ['1', '2', '3', '4', '5', '6'] as const;

export default function WhyBackerHubPage() {
  const t = useTranslations('whyBackerHub');

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

      {/* Problems Section */}
      <div className="space-y-8">
        <ScrollReveal>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('problemTitle')}</h2>
            <p className="text-white/40">{t('problemSubtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {PROBLEMS.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <ScrollReveal key={problem.key} delay={i * 0.1}>
                <Card className={`h-full border-white/[0.06] bg-[#111318] hover:border-${problem.color.replace('text-', '')}/20 transition-colors`}>
                  <CardContent className="pt-6 pb-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${problem.bg} border ${problem.border}`}>
                        <Icon className={`h-5 w-5 ${problem.color}`} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {t(`problem${problem.key}Title`)}
                        </h3>
                        <p className="mt-2 text-sm text-white/50 leading-relaxed">
                          {t(`problem${problem.key}Desc`)}
                        </p>
                      </div>
                    </div>
                    <div className={`rounded-lg ${problem.bg} border ${problem.border} p-3`}>
                      <p className={`text-xs font-semibold ${problem.color} uppercase tracking-wider`}>
                        {t(`problem${problem.key}Stat`)}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {t(`problem${problem.key}StatLabel`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      {/* Solutions Section */}
      <div className="space-y-8">
        <ScrollReveal>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('solutionTitle')}</h2>
            <p className="text-white/40">{t('solutionSubtitle')}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((solution, i) => {
            const Icon = solution.icon;
            return (
              <ScrollReveal key={solution.key} delay={i * 0.08}>
                <Card className="h-full border-white/[0.06] bg-[#111318] hover:border-white/10 transition-colors">
                  <CardContent className="pt-6 pb-6 space-y-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${solution.bg}`}>
                      <Icon className={`h-5 w-5 ${solution.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {t(`solution${solution.key}Title`)}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {t(`solution${solution.key}Desc`)}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <ScrollReveal>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center sm:text-3xl">{t('comparisonTitle')}</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs text-white/30 font-medium py-3 px-4 w-1/4" />
                  <th className="text-left text-xs text-white/30 font-medium uppercase tracking-wider py-3 px-4 w-[37.5%]">
                    {t('comparisonTraditional')}
                  </th>
                  <th className="text-left text-xs text-gold-400/70 font-medium uppercase tracking-wider py-3 px-4 w-[37.5%]">
                    {t('comparisonBackerHub')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {COMPARISONS.map((key) => (
                  <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-white/70">
                      {t(`compare${key}Label`)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-400/60 shrink-0 mt-0.5" />
                        <span className="text-sm text-white/40">{t(`compare${key}Old`)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-white/70">{t(`compare${key}New`)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* For Players & Backers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal>
          <Card className="h-full border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-6 pb-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/20">
                  <Gamepad2 className="h-5 w-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('playerTitle')}</h3>
                  <p className="text-xs text-white/40">{t('playerSubtitle')}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {(['player1', 'player2', 'player3', 'player4', 'player5'] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-gold-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-white/60">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="h-full border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-6 pb-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('backerTitle')}</h3>
                  <p className="text-xs text-white/40">{t('backerSubtitle')}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {(['backer1', 'backer2', 'backer3', 'backer4', 'backer5'] as const).map((key) => (
                  <li key={key} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-white/60">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

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

            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-gold-400" />
              <span className="text-sm font-medium text-gold-400">{t('ctaFee')}</span>
            </div>

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
