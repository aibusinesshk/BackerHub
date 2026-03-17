'use client';

import { useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('legal');

  const sections = [
    { title: 'aboutPlatform', content: 'platformDescription' },
    { title: 'natureOfService', content: 'natureOfServiceDesc' },
    { title: 'mttOnly', content: 'mttOnlyDesc' },
    { title: 'userResponsibilities', content: 'userResponsibilitiesDesc' },
    { title: 'riskDisclosure', content: 'riskDisclosureDesc' },
    { title: 'escrowTerms', content: 'escrowTermsDesc' },
    { title: 'governingLaw', content: 'governingLawDesc' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="h-6 w-6 text-gold-400" />
        <h1 className="text-2xl font-bold text-white">{t('termsTitle')}</h1>
      </div>
      <p className="text-sm text-white/40 mb-8">{t('termsLastUpdated')}</p>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border border-white/[0.06] bg-[#111318] p-6">
            <h2 className="text-lg font-semibold text-white mb-3">{t(section.title)}</h2>
            <p className="text-sm text-white/60 leading-relaxed">{t(section.content)}</p>
          </div>
        ))}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm text-amber-200/70 leading-relaxed">{t('riskDisclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
