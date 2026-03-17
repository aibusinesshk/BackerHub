'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Spade, CreditCard, Shield, Wallet } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');

  const paymentIcons = [
    ...PAYMENT_METHODS.taiwan.map((p) => p.name),
    ...PAYMENT_METHODS.hongkong.map((p) => p.name),
    'Visa', 'Mastercard', 'JCB',
  ];

  return (
    <footer className="border-t border-white/[0.06] bg-[#080a0e]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-black">
                <Spade className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">
                Back<span className="text-gold-400">Hub</span>
              </span>
            </div>
            <p className="text-sm text-white/50 max-w-xs">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">{t('platform')}</h3>
            <ul className="space-y-2">
              <li><Link href="/marketplace" className="text-sm text-white/50 hover:text-gold-400 transition-colors">{t('marketplace')}</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-white/50 hover:text-gold-400 transition-colors">{t('howItWorks')}</Link></li>
              <li><Link href="/about" className="text-sm text-white/50 hover:text-gold-400 transition-colors">{t('about')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">{t('company')}</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-sm text-white/50 hover:text-gold-400 transition-colors">{t('support')}</Link></li>
              <li><Link href="/terms" className="text-sm text-white/50 hover:text-gold-400 transition-colors">{t('terms')}</Link></li>
              <li><span className="text-sm text-white/50">{t('privacy')}</span></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">{t('legal')}</h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 text-xs text-white/40">
                <Shield className="h-3 w-3" /> SSL Secured
              </div>
              <div className="flex items-center gap-1 text-xs text-white/40">
                <CreditCard className="h-3 w-3" /> PCI Compliant
              </div>
              <div className="flex items-center gap-1 text-xs text-white/40">
                <Wallet className="h-3 w-3" /> Escrow Protected
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {paymentIcons.map((name) => (
              <span key={name} className="rounded bg-white/5 px-2 py-1 text-[10px] font-medium text-white/40">
                {name}
              </span>
            ))}
          </div>
          <p className="text-xs text-white/30">&copy; {t('copyright')}</p>
          <p className="text-xs text-white/20 mt-2">{t('disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
