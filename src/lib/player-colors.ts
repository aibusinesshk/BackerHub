import type { PlayerColorTone } from '@/types';

export interface ColorToneConfig {
  gradient: string;
  accent: string;
  accentBg: string;
  border: string;
  pattern: string;
  label: string;
  labelZh: string;
  /** Preview swatch color (hex) */
  swatch: string;
}

export const PLAYER_COLOR_TONES: Record<PlayerColorTone, ColorToneConfig> = {
  red: {
    gradient: 'from-red-900/80 via-red-800/50 to-transparent',
    accent: 'text-red-400',
    accentBg: 'bg-red-500/10',
    border: 'border-red-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(239,68,68,0.12) 0%, transparent 60%)',
    label: 'Red',
    labelZh: '紅色',
    swatch: '#ef4444',
  },
  blue: {
    gradient: 'from-blue-900/80 via-blue-800/50 to-transparent',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(59,130,246,0.12) 0%, transparent 60%)',
    label: 'Blue',
    labelZh: '藍色',
    swatch: '#3b82f6',
  },
  emerald: {
    gradient: 'from-emerald-900/80 via-emerald-800/50 to-transparent',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(16,185,129,0.12) 0%, transparent 60%)',
    label: 'Emerald',
    labelZh: '翡翠綠',
    swatch: '#10b981',
  },
  purple: {
    gradient: 'from-purple-900/80 via-purple-800/50 to-transparent',
    accent: 'text-purple-400',
    accentBg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(168,85,247,0.12) 0%, transparent 60%)',
    label: 'Purple',
    labelZh: '紫色',
    swatch: '#a855f7',
  },
  amber: {
    gradient: 'from-amber-900/80 via-amber-800/50 to-transparent',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(245,158,11,0.12) 0%, transparent 60%)',
    label: 'Amber',
    labelZh: '琥珀色',
    swatch: '#f59e0b',
  },
  cyan: {
    gradient: 'from-cyan-900/80 via-cyan-800/50 to-transparent',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(6,182,212,0.12) 0%, transparent 60%)',
    label: 'Cyan',
    labelZh: '青色',
    swatch: '#06b6d4',
  },
  rose: {
    gradient: 'from-rose-900/80 via-rose-800/50 to-transparent',
    accent: 'text-rose-400',
    accentBg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(244,63,94,0.12) 0%, transparent 60%)',
    label: 'Rose',
    labelZh: '玫瑰色',
    swatch: '#fb7185',
  },
  gold: {
    gradient: 'from-yellow-900/80 via-amber-800/50 to-transparent',
    accent: 'text-gold-400',
    accentBg: 'bg-gold-500/10',
    border: 'border-gold-500/20',
    pattern: 'radial-gradient(ellipse at 70% 30%, rgba(245,184,28,0.12) 0%, transparent 60%)',
    label: 'Gold',
    labelZh: '金色',
    swatch: '#f5b81c',
  },
};

const DEFAULT_TONE: ColorToneConfig = PLAYER_COLOR_TONES.gold;

export function getPlayerColorTone(colorTone?: string | null): ColorToneConfig {
  if (colorTone && colorTone in PLAYER_COLOR_TONES) {
    return PLAYER_COLOR_TONES[colorTone as PlayerColorTone];
  }
  return DEFAULT_TONE;
}

export const ALL_COLOR_TONES = Object.keys(PLAYER_COLOR_TONES) as PlayerColorTone[];
