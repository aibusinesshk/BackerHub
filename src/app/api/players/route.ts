import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');
  const verified = searchParams.get('verified');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort'); // 'top' = sort by performance
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);

  const supabase = await createClient();

  let query = (supabase.from('profiles') as any)
    .select('*', { count: 'exact' })
    .in('role', ['player', 'both']);

  if (region && region !== 'all') {
    query = query.eq('region', region);
  }
  if (verified === 'true') {
    query = query.eq('is_verified', true);
  }
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,display_name_zh.ilike.%${search}%`);
  }

  // When sorting by top performance, fetch via player_stats join
  if (sort === 'top') {
    const statsQuery = (supabase.from('player_stats') as any)
      .select('*, profiles!inner(*)', { count: 'exact' })
      .gt('total_tournaments', 0);

    // Apply profile-level filters on the joined profiles table
    let sq = statsQuery.in('profiles.role', ['player', 'both']);
    if (verified === 'true') sq = sq.eq('profiles.is_verified', true);
    if (region && region !== 'all') sq = sq.eq('profiles.region', region);
    if (search) sq = sq.or(`profiles.display_name.ilike.%${search}%,profiles.display_name_zh.ilike.%${search}%`);

    const { data: statsRows, count: statsCount, error: statsError } = await sq
      .order('biggest_win', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statsError) {
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }
    if (!statsRows || statsRows.length === 0) {
      return NextResponse.json({ players: [], total: 0 });
    }

    const players = statsRows.map((row: any) => {
      const p = row.profiles;
      let avatarUrl = p.avatar_url || '';
      if (avatarUrl && avatarUrl.includes('supabase.co/storage')) {
        avatarUrl = `/api/avatar/${p.id}?t=${Date.now()}`;
      }
      return {
        id: p.id,
        displayName: p.display_name,
        displayNameZh: p.display_name_zh,
        avatarUrl,
        region: p.region,
        isVerified: p.is_verified,
        memberSince: p.member_since,
        bio: p.bio || '',
        bioZh: p.bio_zh,
        hendonMobUrl: p.hendon_mob_url || null,
        colorTone: p.color_tone || null,
        stats: {
          lifetimeROI: Number(row.lifetime_roi),
          totalTournaments: row.total_tournaments,
          cashRate: Number(row.cash_rate),
          totalStakedValue: Number(row.total_staked_value),
          avgFinish: row.avg_finish,
          biggestWin: Number(row.biggest_win),
          monthlyROI: [],
          reliabilityScore: Number(row.reliability_score ?? 100),
          tournamentsSettledOnTime: row.tournaments_settled_on_time || 0,
          tournamentsDefaulted: row.tournaments_defaulted || 0,
        },
      };
    });

    return NextResponse.json({ players, total: statsCount });
  }

  const { data: profiles, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ players: [], total: 0 });
  }

  // Fetch player stats for all profiles
  const playerIds = profiles.map((p: any) => p.id);
  const { data: allStats } = await (supabase.from('player_stats') as any)
    .select('*').in('player_id', playerIds);
  const statsMap = new Map<string, any>((allStats || []).map((s: any) => [s.player_id, s]));

  const players = profiles.map((p: any) => {
    const stats = statsMap.get(p.id);
    // Normalize avatar URL: convert old Supabase Storage URLs to API proxy
    let avatarUrl = p.avatar_url || '';
    if (avatarUrl && avatarUrl.includes('supabase.co/storage')) {
      avatarUrl = `/api/avatar/${p.id}?t=${Date.now()}`;
    }
    return {
      id: p.id,
      displayName: p.display_name,
      displayNameZh: p.display_name_zh,
      avatarUrl,
      region: p.region,
      isVerified: p.is_verified,
      memberSince: p.member_since,
      bio: p.bio || '',
      bioZh: p.bio_zh,
      hendonMobUrl: p.hendon_mob_url || null,
      colorTone: p.color_tone || null,
      stats: stats ? {
        lifetimeROI: Number(stats.lifetime_roi),
        totalTournaments: stats.total_tournaments,
        cashRate: Number(stats.cash_rate),
        totalStakedValue: Number(stats.total_staked_value),
        avgFinish: stats.avg_finish,
        biggestWin: Number(stats.biggest_win),
        monthlyROI: [],
        reliabilityScore: Number(stats.reliability_score ?? 100),
        tournamentsSettledOnTime: stats.tournaments_settled_on_time || 0,
        tournamentsDefaulted: stats.tournaments_defaulted || 0,
      } : { lifetimeROI: 0, totalTournaments: 0, cashRate: 0, totalStakedValue: 0, avgFinish: 'N/A', biggestWin: 0, monthlyROI: [], reliabilityScore: 100, tournamentsSettledOnTime: 0, tournamentsDefaulted: 0 },
    };
  });

  return NextResponse.json({ players, total: count });
}
