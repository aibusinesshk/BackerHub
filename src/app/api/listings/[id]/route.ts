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

  // Normalize avatar URL: convert old Supabase Storage URLs to API proxy
  let playerAvatarUrl = profile?.avatar_url || '';
  if (playerAvatarUrl && playerAvatarUrl.includes('supabase.co/storage')) {
    playerAvatarUrl = `/api/avatar/${profile.id}?t=${Date.now()}`;
  }

  return NextResponse.json({
    listing: {
      id: listing.id,
      playerId: listing.player_id,
      player: profile ? {
        id: profile.id,
        displayName: profile.display_name,
        displayNameZh: profile.display_name_zh,
        avatarUrl: playerAvatarUrl,
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

  // Fetch listing first to validate it can be edited
  const { data: existing } = await (supabase
    .from('listings') as any)
    .select('*')
    .eq('id', id)
    .eq('player_id', user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (existing.status !== 'active') {
    return NextResponse.json({ error: 'Only active listings can be edited' }, { status: 400 });
  }

  if (Number(existing.shares_sold) > 0) {
    return NextResponse.json({ error: 'Cannot edit a listing that already has backers' }, { status: 400 });
  }

  // Only allow updating specific fields
  const body = await request.json();
  const updates: Record<string, any> = {};
  if (body.markup !== undefined) {
    const markup = Number(body.markup);
    if (markup < 1.0 || markup > 1.5) {
      return NextResponse.json({ error: 'Markup must be between 1.00 and 1.50' }, { status: 400 });
    }
    updates.markup = markup;
  }
  if (body.total_shares_offered !== undefined) {
    const shares = Number(body.total_shares_offered);
    if (shares < 10 || shares > 100) {
      return NextResponse.json({ error: 'Shares offered must be between 10 and 100' }, { status: 400 });
    }
    updates.total_shares_offered = shares;
  }
  if (body.min_threshold !== undefined) {
    const threshold = Number(body.min_threshold);
    if (threshold < 0 || threshold > 100) {
      return NextResponse.json({ error: 'Threshold must be between 0 and 100' }, { status: 400 });
    }
    updates.min_threshold = threshold;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: listing, error } = await (supabase
    .from('listings') as any)
    .update(updates)
    .eq('id', id)
    .eq('player_id', user.id)
    .select()
    .single() as { data: any | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing });
}
