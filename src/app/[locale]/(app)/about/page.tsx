'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Link } from '@/i18n/navigation';
import {
  TrendingUp,
  Gamepad2,
  Shield,
  Target,
  Users,
  Award,
  Briefcase,
  Cpu,
  ArrowRight,
  Mail,
} from 'lucide-react';

const TEAM_MEMBERS = [
  {
    key: 'member1',
    icon: Briefcase,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    key: 'member2',
    icon: Cpu,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
] as const;

const VALUES = [
  { key: 'transparency', icon: Shield, color: 'text-cyan-400' },
  { key: 'security', icon: Target, color: 'text-green-400' },
  { key: 'community', icon: Users, color: 'text-gold-500' },
  { key: 'excellence', icon: Award, color: 'text-purple-400' },
] as const;

export default function AboutPage() {
  const t = useTranslations('about');
  const team = useTranslations('aboutPage');
  const faq = useTranslations('faq');

  const faqItems = [
    { q: faq('q1'), a: faq('a1') },
    { q: faq('q2'), a: faq('a2') },
    { q: faq('q3'), a: faq('a3') },
    { q: faq('q4'), a: faq('a4') },
    { q: faq('q5'), a: faq('a5') },
    { q: faq('q6'), a: faq('a6') },
    { q: faq('q7'), a: faq('a7') },
    { q: faq('q8'), a: faq('a8') },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <ScrollReveal>
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-white/50">{t('subtitle')}</p>
        </div>
      </ScrollReveal>

      {/* Mission */}
      <ScrollReveal>
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('missionTitle')}</h2>
            <p className="text-white/60 leading-relaxed">{t('missionDesc')}</p>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* How Staking Works */}
      <ScrollReveal>
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-white mb-4">{t('howTitle')}</h2>
            <p className="text-white/60 leading-relaxed mb-6">{t('howDesc')}</p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
                    <TrendingUp className="h-5 w-5 text-gold-400" />
                  </div>
                  <h3 className="font-semibold text-white">{t('forInvestors')}</h3>
                </div>
                <p className="text-sm text-white/50">{t('forInvestorsDesc')}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
                    <Gamepad2 className="h-5 w-5 text-gold-400" />
                  </div>
                  <h3 className="font-semibold text-white">{t('forPlayers')}</h3>
                </div>
                <p className="text-sm text-white/50">{t('forPlayersDesc')}</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                render={<Link href="/how-it-works" />}
                className="bg-gold-500/10 text-gold-500 border border-gold-500/20 hover:bg-gold-500/20"
              >
                <span className="flex items-center gap-2">
                  {team('ctaHowItWorks')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Meet the Team */}
      <ScrollReveal>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">{team('teamTitle')}</h2>
            <p className="text-white/40 text-sm">{team('teamSubtitle')}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {TEAM_MEMBERS.map((member) => {
              const Icon = member.icon;
              return (
                <Card
                  key={member.key}
                  className="bg-[#111318] border-white/[0.06] hover:border-white/10 transition-all"
                >
                  <CardContent className="pt-8 pb-8 space-y-5">
                    {/* Avatar + Icon */}
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${member.bgColor} border ${member.borderColor}`}
                      >
                        <Icon className={`h-8 w-8 ${member.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {team(`team.${member.key}.name`)}
                        </h3>
                        <p className={`text-sm font-medium ${member.color}`}>
                          {team(`team.${member.key}.role`)}
                        </p>
                      </div>
                    </div>

                    {/* Background */}
                    <div className="space-y-3">
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5">
                          {team('backgroundLabel')}
                        </h4>
                        <p className="text-sm text-white/60 leading-relaxed">
                          {team(`team.${member.key}.background`)}
                        </p>
                      </div>

                      {/* Expertise Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {(team.raw(`team.${member.key}.expertise`) as string[]).map(
                          (skill: string) => (
                            <Badge
                              key={skill}
                              className={`${member.bgColor} ${member.color} border ${member.borderColor} text-[10px] px-2 py-0.5`}
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="border-l-2 border-white/10 pl-3">
                      <p className="text-xs text-white/40 italic leading-relaxed">
                        &ldquo;{team(`team.${member.key}.quote`)}&rdquo;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* Our Values */}
      <ScrollReveal>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">{team('valuesTitle')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <Card
                  key={value.key}
                  className="bg-[#111318] border-white/[0.06] hover:border-white/10 transition-colors"
                >
                  <CardContent className="pt-5 pb-5 flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${value.color} shrink-0 mt-0.5`} />
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        {team(`values.${value.key}.title`)}
                      </h4>
                      <p className="text-xs text-white/40 leading-relaxed mt-1">
                        {team(`values.${value.key}.description`)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal>
        <h2 className="text-xl font-bold text-white mb-6">{t('faqTitle')}</h2>
        <Accordion className="space-y-2">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-white/[0.06] rounded-xl bg-[#111318] px-4">
              <AccordionTrigger className="text-sm text-white hover:text-gold-400 py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-white/50 pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>

      {/* Contact CTA */}
      <ScrollReveal>
        <Card className="bg-[#111318] border-white/[0.06]">
          <CardContent className="pt-8 pb-8">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/20">
                <Mail className="h-6 w-6 text-gold-500" />
              </div>
              <h2 className="text-xl font-bold text-white">{team('contactCta')}</h2>
              <p className="text-white/50 text-sm">{team('contactCtaDesc')}</p>
              <Button
                render={<Link href="/contact" />}
                className="bg-gold-500 text-black font-semibold hover:bg-gold-400 px-6"
              >
                {team('ctaContact')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}
