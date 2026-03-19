'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/providers/auth-provider';

interface Notification {
  id: string;
  type: string;
  title: string;
  titleZh: string;
  message: string;
  messageZh: string;
  listingId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative rounded-lg p-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors outline-none cursor-pointer">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-[#111318] border-white/[0.06]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
          <span className="text-sm font-medium text-white">{t('title')}</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-gold-400 hover:underline">
              {t('markAllRead')}
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-white/30">{t('noNotifications')}</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {notifications.slice(0, 10).map((n) => (
              <DropdownMenuItem key={n.id} className={`flex flex-col items-start gap-1 px-3 py-2.5 cursor-default ${!n.isRead ? 'bg-gold-500/5' : ''}`}>
                <div className="flex items-center gap-2 w-full">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-gold-400' : 'bg-transparent'}`} />
                  <span className="text-xs font-medium text-white truncate flex-1">
                    {locale === 'zh-TW' ? n.titleZh || n.title : n.title}
                  </span>
                  <span className="text-[10px] text-white/20 shrink-0">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 pl-3.5 line-clamp-2">
                  {locale === 'zh-TW' ? n.messageZh || n.message : n.message}
                </p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
