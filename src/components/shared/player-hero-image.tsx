'use client';

import { useState } from 'react';

interface PlayerHeroImageProps {
  src?: string;
  alt: string;
  initials: string;
}

/**
 * Hero-style player image with error fallback.
 * Falls back to initials if the image fails to load or no src is provided.
 */
export function PlayerHeroImage({ src, alt, initials }: PlayerHeroImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-5xl font-bold text-gold-500/30">
          {initials.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || initials}
      className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
      onError={() => setFailed(true)}
    />
  );
}
