'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from './language-switcher';
import { Menu, User, LayoutDashboard, LogOut, Spade, Shield } from 'lucide-react';

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = pathname === '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { href: '/marketplace' as const, label: t('nav.marketplace') },
    { href: '/players' as const, label: t('nav.players') },
    { href: '/how-it-works' as const, label: t('nav.howItWorks') },
    { href: '/about' as const, label: t('nav.about') },
    { href: '/contact' as const, label: t('nav.contact') },
  ];

  const dashboardHref = user?.role === 'player'
    ? '/dashboard/player' as const
    : '/dashboard/investor' as const;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? 'glass-card border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500 text-black">
            <Spade className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Backer<span className="text-gold-400">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-gold-400'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center rounded-full p-1 hover:bg-white/5 transition-colors outline-none cursor-pointer">
                  <Avatar className="h-8 w-8 border border-gold-500/30">
                    <AvatarFallback className="bg-gold-500/20 text-gold-400 text-xs">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem render={<Link href={dashboardHref} />} className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {t('nav.dashboard')}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href={'/profile' as any} />} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('nav.profile')}
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem render={<Link href={'/admin/kyc' as any} />} className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" render={<Link href="/login" />} className="text-white/70 hover:text-white">
                {t('common.login')}
              </Button>
              <Button
                size="sm"
                render={<Link href="/signup" />}
                className="bg-gold-500 text-black font-semibold hover:bg-gold-400 gold-glow"
              >
                {t('common.signup')}
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/5 transition-colors outline-none cursor-pointer">
                <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#111318] border-white/[0.06]">
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'bg-gold-500/10 text-gold-400'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      {t('nav.dashboard')}
                    </Link>
                    <Link
                      href={'/profile' as any}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      {t('nav.profile')}
                    </Link>
                    {user.isAdmin && (
                      <Link
                        href={'/admin/kyc' as any}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <div className="mt-4 flex flex-col gap-2 px-4">
                    <Button variant="outline" render={<Link href="/login" />} className="w-full" onClick={() => setMobileOpen(false)}>
                      {t('common.login')}
                    </Button>
                    <Button render={<Link href="/signup" />} className="w-full bg-gold-500 text-black hover:bg-gold-400" onClick={() => setMobileOpen(false)}>
                      {t('common.signup')}
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
