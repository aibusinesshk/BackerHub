import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await (supabase
    .from('listings') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // Fetch player profile, stats, and tournament in parallel
  const [{ data: profile }, { data: stats }, { data: tournament }] = await Promise.all([
    (supabase.from('profiles') as any).select('*').eq('id', listing.player_id).single(),
    (supabase.from('player_stats') as any).select('*').eq('player_id', listing.player_id).single(),
    (supabase.from('tournaments') as any).select('*').eq('id', listing.tournament_id).single(),
  ]);

  return NextResponse.json({
    listing: {
      id: listing.id,
      playerId: listing.player_id,
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
      markup: Number(listing.markup),
      totalActionOffered: Number(listing.total_shares_offered),
      actionSold: Number(listing.shares_sold),
      minThreshold: Number(listing.min_threshold),
      status: listing.status,
      createdAt: listing.created_at,
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data: listing, error } = await (supabase
    .from('listings') as any)
    .update(body)
    .eq('id', id)
    .eq('player_id', user.id) // Ensure user owns the listing
    .select()
    .single() as { data: any | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing });
}
