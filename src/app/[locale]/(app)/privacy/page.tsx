'use client';

import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const sections = [
    { title: 'infoCollected', content: 'infoCollectedDesc' },
    { title: 'howWeUse', content: 'howWeUseDesc' },
    { title: 'dataSharing', content: 'dataSharingDesc' },
    { title: 'dataSecurity', content: 'dataSecurityDesc' },
    { title: 'cookies', content: 'cookiesDesc' },
    { title: 'yourRights', content: 'yourRightsDesc' },
    { title: 'contactUs', content: 'contactUsDesc' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-2">
        <Lock className="h-6 w-6 text-gold-400" />
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      </div>
      <p className="text-sm text-white/40 mb-8">{t('lastUpdated')}</p>

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border border-white/[0.06] bg-[#111318] p-6">
            <h2 className="text-lg font-semibold text-white mb-3">{t(section.title)}</h2>
            <p className="text-sm text-white/60 leading-relaxed">{t(section.content)}</p>
          </div>
        ))}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm text-amber-200/70 leading-relaxed">{t('dataDisclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
