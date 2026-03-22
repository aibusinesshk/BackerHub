'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Search, ShoppingCart, Trophy, ChevronRight, Play, Clock, X } from 'lucide-react';

// ── Configuration ──────────────────────────────────────────────
// Set ONE of these to enable the video section:
//   YouTube → paste full URL or video ID
//   Self-hosted → put your mp4 in /public/videos/ and set the path
const YOUTUBE_URL = ''; // e.g. 'https://www.youtube.com/watch?v=XXXXX' or 'dQw4w9WgXcQ'
const VIDEO_SRC = '';   // e.g. '/videos/tutorial.mp4'
const POSTER_SRC = '/images/hero-poker.jpg'; // thumbnail before play

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // Already a bare ID (no slashes, no dots)
  if (/^[\w-]{11}$/.test(url)) return url;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^&?#]+)/);
  return m?.[1] ?? null;
}

function VideoPlayer() {
  const t = useTranslations('howItWorks');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytId = extractYouTubeId(YOUTUBE_URL);
  const hasVideo = !!(ytId || VIDEO_SRC);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    // Self-hosted: start playback
    if (VIDEO_SRC && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleClose = useCallback(() => {
    setPlaying(false);
    if (VIDEO_SRC && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  if (!hasVideo) return null;

  return (
    <ScrollReveal>
      <div className="mt-20 sm:mt-24">
        {/* Section heading */}
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">{t('videoTitle')}</h3>
          <p className="mt-3 text-base text-white/50 max-w-xl mx-auto">{t('videoSubtitle')}</p>
        </div>

        {/* Video container */}
        <div className="relative mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black aspect-video shadow-[0_0_60px_rgba(245,184,28,0.06)]">
            {/* YouTube embed */}
            {ytId && playing && (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                title="Tutorial video"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}

            {/* Self-hosted video */}
            {VIDEO_SRC && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src={VIDEO_SRC}
                poster={POSTER_SRC}
                playsInline
                controls={playing}
                preload="metadata"
                onEnded={handleClose}
              />
            )}

            {/* Poster / play overlay */}
            {!playing && (
              <div className="absolute inset-0 group cursor-pointer" onClick={handlePlay}>
                {/* Thumbnail */}
                {POSTER_SRC && (
                  <img
                    src={POSTER_SRC}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />

                {/* Play button */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-500 shadow-[0_0_40px_rgba(245,184,28,0.4)] transition-transform group-hover:scale-110">
                    <Play className="h-8 w-8 text-black ml-1" fill="currentColor" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{t('videoPlay')}</span>
                    <span className="flex items-center gap-1 text-xs text-white/50">
                      <Clock className="h-3 w-3" />
                      {t('videoDuration')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Close button when playing (YouTube only — native video has its own controls) */}
            {playing && ytId && (
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/80 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Decorative glow behind video */}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-b from-gold-500/[0.04] to-transparent blur-2xl" />
        </div>
      </div>
    </ScrollReveal>
  );
}

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      icon: Search,
      title: t('step1Title'),
      desc: t('step1Desc'),
      num: '01',
      iconBg: 'bg-gold-500/15 group-hover:bg-gold-500/25',
      glow: 'rgba(245,184,28,0.08)',
    },
    {
      icon: ShoppingCart,
      title: t('step2Title'),
      desc: t('step2Desc'),
      num: '02',
      iconBg: 'bg-gold-500/15 group-hover:bg-gold-500/25',
      glow: 'rgba(245,184,28,0.10)',
    },
    {
      icon: Trophy,
      title: t('step3Title'),
      desc: t('step3Desc'),
      num: '03',
      iconBg: 'bg-green-500/15 group-hover:bg-green-500/25',
      glow: 'rgba(34,197,94,0.08)',
    },
  ];

  return (
    <section className="relative py-24 bg-[#080a0e] overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,184,28,0.04)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,184,28,0.02)_0%,transparent_50%)]" />

      {/* Section divider at top */}
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16 sm:mb-20">
            <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-gold-400/80">
              {t('title')}
            </span>
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {t('subtitle')}
            </h2>
          </div>
        </ScrollReveal>

        {/* Desktop: horizontal timeline with connectors */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-0">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.2}>
                <div className="group relative flex flex-col items-center text-center px-6">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-10 left-[calc(50%+2.5rem)] right-0 flex items-center z-0 pointer-events-none">
                      <div className="flex-1 h-px bg-gradient-to-r from-gold-500/30 via-gold-500/15 to-transparent" />
                      <ChevronRight className="h-4 w-4 text-gold-500/30 -ml-1" />
                    </div>
                  )}

                  {/* Step icon */}
                  <div className="relative z-10 mb-6">
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-2xl ${step.iconBg} border border-white/[0.06] transition-all duration-300 group-hover:scale-110 group-hover:border-gold-500/20`}
                      style={{ boxShadow: `0 0 40px ${step.glow}` }}
                    >
                      <step.icon className="h-8 w-8 text-gold-400" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-black shadow-lg">
                      {i + 1}
                    </span>
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50 max-w-[280px]">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden space-y-0">
          {steps.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.15}>
              <div className="group relative flex gap-5">
                {/* Timeline rail */}
                <div className="flex flex-col items-center">
                  <div
                    className={`relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${step.iconBg} border border-white/[0.06] transition-all duration-300 group-hover:border-gold-500/20`}
                    style={{ boxShadow: `0 0 30px ${step.glow}` }}
                  >
                    <step.icon className="h-6 w-6 text-gold-400" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-black">
                      {i + 1}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 min-h-[2rem] bg-gradient-to-b from-gold-500/30 to-transparent my-2" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 ${i < steps.length - 1 ? 'pb-8' : 'pb-0'}`}>
                  <h3 className="text-lg font-bold text-white mt-2">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Video tutorial (renders only when YOUTUBE_URL or VIDEO_SRC is set) */}
        <VideoPlayer />
      </div>
    </section>
  );
}
