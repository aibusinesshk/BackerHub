import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createPackageSchema = z.object({
  festivalName: z.string().min(1, 'Festival name required'),
  festivalNameZh: z.string().optional(),
  festivalBrand: z.string().min(1, 'Brand required'),
  venue: z.string().min(1, 'Venue required'),
  venueZh: z.string().optional(),
  region: z.enum(['TW', 'HK', 'OTHER']),
  festivalStart: z.string().min(1, 'Start date required'),
  festivalEnd: z.string().min(1, 'End date required'),
  markup: z.number().min(1, 'Markup must be at least 1.0').max(2, 'Markup cannot exceed 2.0'),
  totalActionOffered: z.number().int().min(1).max(100, 'Max 100% action'),
  minThreshold: z.number().int().min(0).max(100).optional().default(0),
  budgetMin: z.number().min(1, 'Minimum budget required'),
  budgetMax: z.number().min(1, 'Maximum budget required'),
  plannedEventsMin: z.number().int().min(1).optional().default(1),
  plannedEventsMax: z.number().int().min(1).optional().default(10),
  notes: z.string().optional(),
  notesZh: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const playerId = searchParams.get('playerId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = await createClient();

  let query = (supabase.from('listing_packages') as any)
    .select('*', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (playerId) {
    query = query.eq('player_id', playerId);
  }

  const { data: packages, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!packages || packages.length === 0) {
    return NextResponse.json({ packages: [], total: 0 });
  }

  // Get unique player IDs and package IDs
  const playerIds = [...new Set(packages.map((p: any) => p.player_id))] as string[];
  const packageIds = packages.map((p: any) => p.id) as string[];

  // Fetch related data in parallel
  const [{ data: profiles }, { data: playerStats }, { data: entries }] = await Promise.all([
    (supabase.from('profiles') as any).select('*').in('id', playerIds),
    (supabase.from('player_stats') as any).select('*').in('player_id', playerIds),
    (supabase.from('package_entries') as any).select('*').in('package_id', packageIds).order('created_at', { ascending: true }),
  ]);

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  const statsMap = new Map<string, any>((playerStats || []).map((s: any) => [s.player_id, s]));
  const entriesByPackage = new Map<string, any[]>();
  for (const e of (entries || [])) {
    const list = entriesByPackage.get(e.package_id) || [];
    list.push(e);
    entriesByPackage.set(e.package_id, list);
  }

  // Join into frontend-friendly shape
  const joined = packages.map((pkg: any) => {
    const profile = profileMap.get(pkg.player_id);
    const stats = statsMap.get(pkg.player_id);
    let playerAvatarUrl = profile?.avatar_url || '';
    if (playerAvatarUrl && playerAvatarUrl.includes('supabase.co/storage')) {
      playerAvatarUrl = `/api/avatar/${profile.id}?t=${Date.now()}`;
    }
    const pkgEntries = (entriesByPackage.get(pkg.id) || []).map((e: any) => ({
      id: e.id,
      packageId: e.package_id,
      tournamentId: e.tournament_id,
      eventName: e.event_name,
      eventNameZh: e.event_name_zh,
      buyIn: Number(e.buy_in),
      bulletNumber: e.bullet_number,
      result: e.result,
      prizeAmount: Number(e.prize_amount),
      finishPosition: e.finish_position,
      totalEntries: e.total_entries,
      proofUrl: e.proof_url,
      playedAt: e.played_at,
      createdAt: e.created_at,
    }));

    return {
      id: pkg.id,
      playerId: pkg.player_id,
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
        colorTone: profile.color_tone || null,
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
      festivalName: pkg.festival_name,
      festivalNameZh: pkg.festival_name_zh,
      festivalBrand: pkg.festival_brand,
      venue: pkg.venue,
      venueZh: pkg.venue_zh,
      region: pkg.region,
      festivalStart: pkg.festival_start,
      festivalEnd: pkg.festival_end,
      markup: Number(pkg.markup),
      totalActionOffered: Number(pkg.total_action_offered),
      actionSold: Number(pkg.action_sold),
      minThreshold: Number(pkg.min_threshold),
      budgetMin: Number(pkg.budget_min),
      budgetMax: Number(pkg.budget_max),
      plannedEventsMin: pkg.planned_events_min,
      plannedEventsMax: pkg.planned_events_max,
      notes: pkg.notes,
      notesZh: pkg.notes_zh,
      status: pkg.status,
      entries: pkgEntries,
      createdAt: pkg.created_at,
    };
  });

  return NextResponse.json({ packages: joined, total: count });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('kyc_status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.kyc_status !== 'approved') {
    return NextResponse.json(
      { error: 'KYC verification required.' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createPackageSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: msg || 'Invalid input' }, { status: 400 });
  }

  const d = parsed.data;

  const { data: pkg, error } = await (supabase.from('listing_packages') as any)
    .insert({
      player_id: user.id,
      festival_name: d.festivalName,
      festival_name_zh: d.festivalNameZh || null,
      festival_brand: d.festivalBrand,
      venue: d.venue,
      venue_zh: d.venueZh || null,
      region: d.region,
      festival_start: d.festivalStart,
      festival_end: d.festivalEnd,
      markup: d.markup,
      total_action_offered: d.totalActionOffered,
      min_threshold: d.minThreshold,
      budget_min: d.budgetMin,
      budget_max: d.budgetMax,
      planned_events_min: d.plannedEventsMin,
      planned_events_max: d.plannedEventsMax,
      notes: d.notes || null,
      notes_zh: d.notesZh || null,
    })
    .select('*')
    .single();

  if (error) {
    logger.apiError('/api/packages', 'POST', error, user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info('Package listing created', { userId: user.id, action: 'create_package', packageId: pkg!.id });
  return NextResponse.json({ package: pkg }, { status: 201 });
}
