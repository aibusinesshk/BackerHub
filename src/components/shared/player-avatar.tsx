'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface PlayerAvatarProps {
  src?: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Reusable player avatar component.
 * Shows the player's photo if available, otherwise falls back to initials.
 * To replace a placeholder with a real photo, drop a JPG/PNG at the same path
 * in public/images/players/ (e.g., sparrow-cheung.jpg).
 */
export function PlayerAvatar({ src, name, className, fallbackClassName }: PlayerAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar className={className}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback className={fallbackClassName || 'bg-gold-500/10 text-gold-400 font-semibold'}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
