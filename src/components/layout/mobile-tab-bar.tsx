'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Store, Users, Spade, Plus, LayoutDashboard, UserCircle } from 'lucide-react';

export function MobileTabBar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { user } = useAuth();

  const isPlayer = user?.role === 'player';
  const dashboardHref = isPlayer
    ? '/dashboard/player' as const
    : '/dashboard/investor' as const;

  // Center button: "Sell Action" for players, "Home" for others
  const centerTab = isPlayer
    ? { href: '/create-listing' as any, label: t('sellAction'), icon: Plus }
    : { href: '/' as const, label: 'Home', icon: Spade };

  const tabs = [
    { href: '/marketplace' as const, label: t('marketplace'), icon: Store },
    { href: '/players' as const, label: t('players'), icon: Users },
    { ...centerTab, isCenter: true },
    { href: dashboardHref, label: t('dashboard'), icon: LayoutDashboard },
    { href: '/profile' as any, label: t('profile'), icon: UserCircle },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Top edge line with notch cutout */}
      <div className="relative h-px bg-gold-500/30">
        <div className="absolute left-1/2 -translate-x-1/2 -top-5 w-16 h-6 bg-[#111318] rounded-t-full" />
      </div>

      <nav className="relative bg-[#111318] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-end">
          {tabs.map((tab, i) => {
            const isActive = tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            if ('isCenter' in tab && tab.isCenter) {
              return (
                <Link
                  key="center"
                  href={tab.href}
                  className="flex-1 relative -mt-5 flex flex-col items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500 shadow-[0_0_20px_rgba(245,184,28,0.3)] transition-transform active:scale-95">
                    <Icon className="h-6 w-6 text-black" />
                  </div>
                  <span className={`mt-1 text-[10px] font-medium ${isActive ? 'text-gold-400' : 'text-white/50'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center py-2"
              >
                <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-gold-400' : 'text-white/40'}`} />
                <span className={`mt-1 text-[10px] font-medium transition-colors ${isActive ? 'text-gold-400' : 'text-white/40'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
