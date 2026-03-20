import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: profile, error: profileError },
    { data: stats },
    { data: monthlyRoi },
    { data: listings },
  ] = await Promise.all([
    (supabase.from('profiles') as any).select('*').eq('id', id).single(),
    (supabase.from('player_stats') as any).select('*').eq('player_id', id).single(),
    (supabase.from('monthly_roi') as any).select('*').eq('player_id', id).order('month', { ascending: true }),
    (supabase.from('listings') as any).select('*').eq('player_id', id).order('created_at', { ascending: false }),
  ]);

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  const allListings = listings || [];
  const tournamentIds = [...new Set(allListings.map((l: any) => l.tournament_id))] as string[];
  let tournamentMap = new Map<string, any>();
  if (tournamentIds.length > 0) {
    const { data: tournaments } = await (supabase.from('tournaments') as any)
      .select('*').in('id', tournamentIds);
    tournamentMap = new Map<string, any>((tournaments || []).map((t: any) => [t.id, t]));
  }

  // Normalize avatar URL: convert old Supabase Storage URLs to API proxy
  let avatarUrl = profile.avatar_url || '';
  if (avatarUrl && avatarUrl.includes('supabase.co/storage')) {
    avatarUrl = `/api/avatar/${profile.id}?t=${Date.now()}`;
  }

  const player = {
    id: profile.id,
    displayName: profile.display_name,
    displayNameZh: profile.display_name_zh,
    avatarUrl,
    region: profile.region,
    isVerified: profile.is_verified,
    memberSince: profile.member_since,
    bio: profile.bio || '',
    bioZh: profile.bio_zh,
    hendonMobUrl: profile.hendon_mob_url || null,
    colorTone: profile.color_tone || null,
    stats: {
      lifetimeROI: stats ? Number(stats.lifetime_roi) : 0,
      totalTournaments: stats ? stats.total_tournaments : 0,
      cashRate: stats ? Number(stats.cash_rate) : 0,
      totalStakedValue: stats ? Number(stats.total_staked_value) : 0,
      avgFinish: stats ? stats.avg_finish : 'N/A',
      biggestWin: stats ? Number(stats.biggest_win) : 0,
      monthlyROI: (monthlyRoi || []).map((m: any) => ({ month: m.month, roi: Number(m.roi) })),
    },
  };

  const joinedListings = allListings.map((l: any) => {
    const tournament = tournamentMap.get(l.tournament_id);
    return {
      id: l.id, playerId: l.player_id, player,
      tournament: tournament ? {
        id: tournament.id, name: tournament.name, nameZh: tournament.name_zh,
        venue: tournament.venue, venueZh: tournament.venue_zh, date: tournament.date,
        buyIn: Number(tournament.buy_in), guaranteedPool: Number(tournament.guaranteed_pool),
        type: tournament.type, game: tournament.game, region: tournament.region,
      } : null,
      markup: Number(l.markup), totalActionOffered: Number(l.total_shares_offered),
      actionSold: Number(l.shares_sold), minThreshold: Number(l.min_threshold),
      status: l.status, createdAt: l.created_at,
    };
  });

  return NextResponse.json({ player, listings: joinedListings });
}
