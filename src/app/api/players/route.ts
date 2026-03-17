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
    return {
      id: p.id,
      displayName: p.display_name,
      displayNameZh: p.display_name_zh,
      avatarUrl: p.avatar_url || '',
      region: p.region,
      isVerified: p.is_verified,
      memberSince: p.member_since,
      bio: p.bio || '',
      bioZh: p.bio_zh,
      hendonMobUrl: p.hendon_mob_url || null,
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

  return NextResponse.json({ players, total: count });
}
