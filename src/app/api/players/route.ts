import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');
  const verified = searchParams.get('verified');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = await createClient();

  let query = (supabase.from('profiles') as any)
    .select('id, display_name, display_name_zh, avatar_url, region, is_verified, member_since, bio, bio_zh, hendon_mob_url, color_tone', { count: 'exact' })
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
    .select('player_id, lifetime_roi, total_tournaments, cash_rate, total_staked_value, avg_finish, biggest_win').in('player_id', playerIds);
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
      } : { lifetimeROI: 0, totalTournaments: 0, cashRate: 0, totalStakedValue: 0, avgFinish: 'N/A', biggestWin: 0, monthlyROI: [] },
    };
  });

  return NextResponse.json({ players, total: count }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
