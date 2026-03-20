'use client';

import { Spade, Trophy, Star, Zap } from 'lucide-react';

/**
 * Maps tournament name prefixes to brand visual configs.
 * Each brand gets a unique gradient, accent color, and logo treatment.
 */
const BRAND_CONFIG: Record<string, {
  gradient: string;
  accent: string;
  textColor: string;
  logo: string;
  pattern: string;
}> = {
  APT: {
    gradient: 'from-red-900/90 via-red-800/70 to-black/80',
    accent: 'text-red-400',
    textColor: 'text-white',
    logo: 'APT',
    pattern: 'radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(239,68,68,0.1) 0%, transparent 50%)',
  },
  TMT: {
    gradient: 'from-blue-900/90 via-blue-800/70 to-black/80',
    accent: 'text-blue-400',
    textColor: 'text-white',
    logo: 'TMT',
    pattern: 'radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)',
  },
  WPT: {
    gradient: 'from-emerald-900/90 via-emerald-800/70 to-black/80',
    accent: 'text-emerald-400',
    textColor: 'text-white',
    logo: 'WPT',
    pattern: 'radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(16,185,129,0.1) 0%, transparent 50%)',
  },
  WSOP: {
    gradient: 'from-yellow-900/90 via-amber-800/70 to-black/80',
    accent: 'text-yellow-400',
    textColor: 'text-white',
    logo: 'WSOP',
    pattern: 'radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(245,158,11,0.1) 0%, transparent 50%)',
  },
  CTP: {
    gradient: 'from-orange-900/90 via-orange-800/70 to-black/80',
    accent: 'text-orange-400',
    textColor: 'text-white',
    logo: 'CTP',
    pattern: 'radial-gradient(ellipse at 80% 20%, rgba(251,146,60,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(251,146,60,0.1) 0%, transparent 50%)',
  },
  CPPT: {
    gradient: 'from-cyan-900/90 via-cyan-800/70 to-black/80',
    accent: 'text-cyan-400',
    textColor: 'text-white',
    logo: 'CPPT',
    pattern: 'radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(34,211,238,0.1) 0%, transparent 50%)',
  },
  Zodiac: {
    gradient: 'from-purple-900/90 via-purple-800/70 to-black/80',
    accent: 'text-purple-400',
    textColor: 'text-white',
    logo: 'ZODIAC',
    pattern: 'radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(168,85,247,0.1) 0%, transparent 50%)',
  },
};

const DEFAULT_BRAND = {
  gradient: 'from-gold-500/20 via-amber-900/40 to-black/80',
  accent: 'text-gold-400',
  textColor: 'text-white',
  logo: 'POKER',
  pattern: 'radial-gradient(ellipse at 80% 20%, rgba(245,184,28,0.1) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(245,184,28,0.08) 0%, transparent 50%)',
};

function detectBrand(tournamentName: string) {
  const upper = tournamentName.toUpperCase();
  for (const [key, config] of Object.entries(BRAND_CONFIG)) {
    if (upper.startsWith(key.toUpperCase()) || upper.includes(key.toUpperCase())) {
      return config;
    }
  }
  return DEFAULT_BRAND;
}

interface TournamentBrandBannerProps {
  tournamentName: string;
  venue?: string;
  buyIn: number;
  guaranteedPool?: number;
  type: string;
}

export function TournamentBrandBanner({
  tournamentName,
  venue,
  buyIn,
  type,
}: TournamentBrandBannerProps) {
  const brand = detectBrand(tournamentName);

  // Pick icon based on brand
  const BrandIcon = brand.logo === 'APT' ? Spade
    : brand.logo === 'TMT' ? Trophy
    : brand.logo === 'WPT' ? Star
    : brand.logo === 'WSOP' ? Trophy
    : brand.logo === 'CTP' ? Zap
    : brand.logo === 'CPPT' ? Star
    : brand.logo === 'ZODIAC' ? Star
    : Zap;

  return (
    <div
      className={`relative h-28 bg-gradient-to-br ${brand.gradient} overflow-hidden`}
      style={{ backgroundImage: brand.pattern }}
    >
      {/* Decorative poker elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large faded brand icon */}
        <BrandIcon
          className={`absolute -right-3 -top-3 h-24 w-24 ${brand.accent} opacity-[0.07]`}
          strokeWidth={1}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-3.5">
        <div className="flex items-center justify-between">
          {/* Brand badge */}
          <div className={`flex items-center gap-1.5 rounded-md bg-black/30 backdrop-blur-sm px-2 py-1`}>
            <BrandIcon className={`h-3.5 w-3.5 ${brand.accent}`} strokeWidth={2.5} />
            <span className={`text-[11px] font-bold tracking-wider ${brand.accent}`}>
              {brand.logo}
            </span>
          </div>
          <span className="text-[10px] text-white/40 bg-black/20 rounded px-1.5 py-0.5">
            {type}
          </span>
        </div>

        <div>
          {venue && (
            <p className="text-[10px] text-white/30 truncate mb-0.5">
              {venue}
            </p>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-white/40">GTD</span>
            <span className={`text-sm font-bold ${brand.accent}`}>
              ${buyIn >= 10000 ? `${(buyIn / 1000).toFixed(0)}K` : buyIn.toLocaleString()}
            </span>
            <span className="text-[10px] text-white/30">buy-in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
