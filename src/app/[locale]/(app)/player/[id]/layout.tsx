import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { BreadcrumbJsonLd, PlayerProductJsonLd } from '@/components/seo/json-ld';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://backerhubasia.vercel.app';

async function getPlayerMeta(id: string) {
  try {
    const supabase = await createClient();
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('display_name, display_name_zh, bio, bio_zh, avatar_url, is_verified, region')
      .eq('id', id)
      .single();
    if (!profile) return null;

    const { data: stats } = await (supabase.from('player_stats') as any)
      .select('lifetime_roi, total_tournaments, cash_rate')
      .eq('player_id', id)
      .single();

    const { count: reviewCount } = await (supabase.from('reviews') as any)
      .select('*', { count: 'exact', head: true })
      .eq('player_id', id);

    return {
      displayName: profile.display_name || 'Player',
      displayNameZh: profile.display_name_zh || null,
      bio: profile.bio || '',
      bioZh: profile.bio_zh || null,
      avatarUrl: profile.avatar_url || null,
      isVerified: profile.is_verified || false,
      region: profile.region || '',
      lifetimeROI: stats ? Number(stats.lifetime_roi) : 0,
      totalTournaments: stats ? stats.total_tournaments : 0,
      cashRate: stats ? Number(stats.cash_rate) : 0,
      reviewCount: reviewCount || 0,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const player = await getPlayerMeta(id);

  if (!player) {
    return { title: 'Player Not Found' };
  }

  const name = locale === 'zh-TW' && player.displayNameZh
    ? player.displayNameZh
    : player.displayName;
  const description =
    locale === 'zh-TW' && player.bioZh
      ? player.bioZh
      : player.bio;

  const title = `${name} - Player Profile`;
  const metaDescription = description
    ? `${description.slice(0, 130)}...`
    : `${name} on BackerHub. ${player.totalTournaments} tournaments, ${player.cashRate}% cash rate. Back this player in Asia poker tournaments.`;

  const url = `${SITE_URL}/${locale}/player/${id}`;

  return {
    title,
    description: metaDescription,
    openGraph: {
      type: 'profile',
      title: `${title} | BackerHub`,
      description: metaDescription,
      url,
      siteName: 'BackerHub',
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${name} - BackerHub Player Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | BackerHub`,
      description: metaDescription,
      images: [`${SITE_URL}/opengraph-image`],
    },
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/player/${id}`,
        'zh-TW': `${SITE_URL}/zh-TW/player/${id}`,
      },
    },
  };
}

export default async function PlayerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const player = await getPlayerMeta(id);

  const name = player
    ? locale === 'zh-TW' && player.displayNameZh
      ? player.displayNameZh
      : player.displayName
    : 'Player';

  const playerUrl = `${SITE_URL}/${locale}/player/${id}`;
  const description = player
    ? `${name} on BackerHub. ${player.totalTournaments} tournaments played, ${player.cashRate}% cash rate, ${player.lifetimeROI}% lifetime ROI.`
    : '';

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: 'Home', href: '' },
          { name: locale === 'zh-TW' ? '選手' : 'Players', href: '/players' },
          { name, href: `/player/${id}` },
        ]}
      />
      {player && (
        <PlayerProductJsonLd
          playerName={name}
          playerUrl={playerUrl}
          description={description}
          imageUrl={player.avatarUrl || undefined}
          reviewCount={player.reviewCount}
        />
      )}
      {children}
    </>
  );
}
