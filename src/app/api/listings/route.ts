import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const playerId = searchParams.get('playerId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = await createClient();

  let query = (supabase.from('listings') as any)
    .select('*', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (playerId) {
    query = query.eq('player_id', playerId);
  }

  const { data: listings, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!listings || listings.length === 0) {
    return NextResponse.json({ listings: [], total: 0 });
  }

  // Get unique player and tournament IDs
  const playerIds = [...new Set(listings.map((l: any) => l.player_id))] as string[];
  const tournamentIds = [...new Set(listings.map((l: any) => l.tournament_id))] as string[];

  // Fetch related data in parallel
  const [{ data: profiles }, { data: playerStats }, { data: tournaments }] = await Promise.all([
    (supabase.from('profiles') as any).select('*').in('id', playerIds),
    (supabase.from('player_stats') as any).select('*').in('player_id', playerIds),
    (supabase.from('tournaments') as any).select('*').in('id', tournamentIds),
  ]);

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  const statsMap = new Map<string, any>((playerStats || []).map((s: any) => [s.player_id, s]));
  const tournamentMap = new Map<string, any>((tournaments || []).map((t: any) => [t.id, t]));

  // Join into frontend-friendly shape matching StakingListing type
  const joined = listings.map((l: any) => {
    const profile = profileMap.get(l.player_id);
    const stats = statsMap.get(l.player_id);
    const tournament = tournamentMap.get(l.tournament_id);
    return {
      id: l.id,
      playerId: l.player_id,
      player: profile ? {
        id: profile.id,
        displayName: profile.display_name,
        displayNameZh: profile.display_name_zh,
        avatarUrl: profile.avatar_url || '',
        region: profile.region,
        isVerified: profile.is_verified,
        memberSince: profile.member_since,
        bio: profile.bio || '',
        bioZh: profile.bio_zh,
        stats: stats ? {
          lifetimeROI: Number(stats.lifetime_roi),
          totalTournaments: stats.total_tournaments,
          cashRate: Number(stats.cash_rate),
          totalStakedValue: Number(stats.total_staked_value),
          avgFinish: stats.avg_finish,
          biggestWin: Number(stats.biggest_win),
          monthlyROI: [],
        } : { lifetimeROI: 0, totalTournaments: 0, cashRate: 0, totalStakedValue: 0, avgFinish: 'N/A', biggestWin: 0, monthlyROI: [] },
      } : null,
      tournament: tournament ? {
        id: tournament.id, name: tournament.name, nameZh: tournament.name_zh,
        venue: tournament.venue, venueZh: tournament.venue_zh, date: tournament.date,
        buyIn: Number(tournament.buy_in), guaranteedPool: Number(tournament.guaranteed_pool),
        type: tournament.type, game: tournament.game, region: tournament.region,
      } : null,
      markup: Number(l.markup),
      totalActionOffered: Number(l.total_shares_offered),
      actionSold: Number(l.shares_sold),
      minThreshold: Number(l.min_threshold),
      status: l.status,
      createdAt: l.created_at,
    };
  });

  return NextResponse.json({ listings: joined, total: count });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tournamentId, markup, totalSharesOffered, minThreshold } = body;

  // Validate
  if (!tournamentId || !markup || !totalSharesOffered) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: listing, error } = await (supabase
    .from('listings') as any)
    .insert({
      player_id: user.id,
      tournament_id: tournamentId,
      markup,
      total_shares_offered: totalSharesOffered,
      min_threshold: minThreshold || 0,
    })
    .select('*')
    .single() as { data: any | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create escrow record for this listing
  await (supabase.from('escrow') as any).insert({ listing_id: listing!.id });

  return NextResponse.json({ listing }, { status: 201 });
}
