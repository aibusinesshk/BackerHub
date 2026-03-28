'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Loader2,
  Search,
  Sparkles,
  ExternalLink,
  Globe,
  FileText,
  Tag,
  Lightbulb,
} from 'lucide-react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhub.com';

interface PageInfo {
  key: string;
  path: string;
  title: string;
  description: string;
}

interface SeoSuggestion {
  suggestedTitle: string;
  suggestedDescription: string;
  keywords: string[];
  improvements: string[];
}

const PAGES: PageInfo[] = [
  {
    key: 'homepage',
    path: '/',
    title: "BackerHub \u2014 Back Players. Share Victories.",
    description:
      "Asia's premier poker tournament staking platform. Invest in verified players, share tournament winnings.",
  },
  {
    key: 'marketplace',
    path: '/marketplace',
    title: 'Marketplace | BackerHub',
    description:
      'Browse active tournament staking listings. Back verified poker players and share in their victories.',
  },
  {
    key: 'players',
    path: '/players',
    title: 'Players | BackerHub',
    description:
      'Discover verified poker players seeking backing. View stats, ROI history, and active listings.',
  },
  {
    key: 'about',
    path: '/about',
    title: 'About | BackerHub',
    description:
      "Learn about BackerHub \u2014 Asia's first poker tournament staking platform connecting backers and players.",
  },
  {
    key: 'pricing',
    path: '/pricing',
    title: 'Pricing | BackerHub',
    description:
      'Transparent pricing with zero platform fees. See how BackerHub keeps costs low for backers and players.',
  },
  {
    key: 'howItWorks',
    path: '/how-it-works',
    title: 'How It Works | BackerHub',
    description:
      'Learn how poker staking works on BackerHub. Simple 3-step process for backers and players.',
  },
];

export default function AdminSeoPage() {
  const t = useTranslations('seo');
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    Record<string, SeoSuggestion>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerate = async (page: PageInfo) => {
    setLoading(page.key);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[page.key];
      return next;
    });

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${SITE_URL}/en${page.path === '/' ? '' : page.path}`,
          currentTitle: page.title,
          currentDescription: page.description,
        }),
      });

      if (res.status === 403) {
        setErrors((prev) => ({
          ...prev,
          [page.key]: t('forbidden'),
        }));
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors((prev) => ({
          ...prev,
          [page.key]: data.error || t('generateFailed'),
        }));
        return;
      }

      const data: SeoSuggestion = await res.json();
      setSuggestions((prev) => ({ ...prev, [page.key]: data }));
    } catch {
      setErrors((prev) => ({
        ...prev,
        [page.key]: t('networkError'),
      }));
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateAll = async () => {
    for (const page of PAGES) {
      await handleGenerate(page);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/50">{t('loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="h-6 w-6 text-gold-400" />
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-white/50">{t('subtitle')}</p>
        </div>
        <Button
          onClick={handleGenerateAll}
          disabled={loading !== null}
          className="bg-gold-500 text-black font-semibold hover:bg-gold-400"
        >
          {loading !== null && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Sparkles className="mr-2 h-4 w-4" />
          {t('generateAll')}
        </Button>
      </div>

      {/* Page Cards */}
      <div className="space-y-4">
        {PAGES.map((page) => {
          const suggestion = suggestions[page.key];
          const error = errors[page.key];

          return (
            <Card
              key={page.key}
              className="border-white/[0.06] bg-[#111318]"
            >
              <CardContent className="pt-6 space-y-4">
                {/* Page Info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-gold-400 shrink-0" />
                      <h3 className="text-sm font-semibold text-white truncate">
                        {page.title}
                      </h3>
                    </div>
                    <p className="text-xs text-white/40 mb-1">
                      {page.description}
                    </p>
                    <a
                      href={`${SITE_URL}/en${page.path === '/' ? '' : page.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-gold-400/70 hover:text-gold-400 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {SITE_URL}/en
                      {page.path === '/' ? '' : page.path}
                    </a>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold-500/30 text-gold-400 hover:bg-gold-500/10 shrink-0"
                    onClick={() => handleGenerate(page)}
                    disabled={loading === page.key}
                  >
                    {loading === page.key ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    {t('generate')}
                  </Button>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                {/* Suggestions */}
                {suggestion && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-300">
                        {t('aiSuggestions')}
                      </span>
                    </div>

                    {/* Suggested Title */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-white/30" />
                        <span className="text-[10px] font-medium text-white/50">
                          {t('suggestedTitle')}
                        </span>
                      </div>
                      <p className="text-sm text-white bg-white/[0.03] rounded-lg px-3 py-2">
                        {suggestion.suggestedTitle}
                      </p>
                    </div>

                    {/* Suggested Description */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-white/30" />
                        <span className="text-[10px] font-medium text-white/50">
                          {t('suggestedDescription')}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 bg-white/[0.03] rounded-lg px-3 py-2">
                        {suggestion.suggestedDescription}
                      </p>
                    </div>

                    {/* Keywords */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-white/30" />
                        <span className="text-[10px] font-medium text-white/50">
                          {t('keywords')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestion.keywords.map((kw, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="border-gold-500/20 text-gold-400/80 text-[10px]"
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Improvements */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-white/30" />
                        <span className="text-[10px] font-medium text-white/50">
                          {t('improvements')}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {suggestion.improvements.map((imp, i) => (
                          <li
                            key={i}
                            className="text-xs text-white/60 bg-white/[0.03] rounded-lg px-3 py-2 flex items-start gap-2"
                          >
                            <span className="text-gold-400 font-bold mt-0.5 shrink-0">
                              {i + 1}.
                            </span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
