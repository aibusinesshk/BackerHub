import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Allow up to 120s for seeding (creating 15 auth users + profiles takes time)
export const maxDuration = 120;

// GET /api/seed — Check current database counts
export async function GET() {
  const admin = await createAdminClient();
  const tables = ['profiles', 'player_stats', 'monthly_roi', 'tournaments', 'listings', 'investments', 'transactions', 'reviews', 'escrow', 'testimonials'];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { count } = await admin.from(table).select('*', { count: 'exact', head: true });
    counts[table] = count || 0;
  }
  return NextResponse.json({ counts });
}

// DELETE /api/seed — Clear all data for re-seeding
// Protected: requires SEED_SECRET header to prevent accidental/malicious data deletion
export async function DELETE(request: Request) {
  const seedSecret = request.headers.get('x-seed-secret');
  if (!seedSecret || seedSecret !== (process.env.SEED_SECRET || 'backhub-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = await createAdminClient();
  // Delete in reverse dependency order
  await admin.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('investments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('escrow').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('tournaments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('monthly_roi').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('testimonials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('player_stats').delete().neq('player_id', '00000000-0000-0000-0000-000000000000');
  // Delete profiles (but not auth users - those persist)
  await admin.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // Delete auth users
  const { data: users } = await admin.auth.admin.listUsers();
  for (const u of (users?.users || [])) {
    if (u.email?.endsWith('@backhub.demo')) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }
  return NextResponse.json({ success: true, message: 'All seed data cleared. Run POST /api/seed to re-seed.' });
}

// POST /api/seed — Seed the database with initial data (run once)
// Protected: requires SEED_SECRET header
export async function POST(request: Request) {
  const seedSecret = request.headers.get('x-seed-secret');
  if (!seedSecret || seedSecret !== (process.env.SEED_SECRET || 'backhub-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = await createAdminClient();

  // Check if already seeded
  const { data: existing } = await admin.from('tournaments').select('id').limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Database already seeded. Delete data first if you want to re-seed.' }, { status: 400 });
  }

  // =====================
  // 1. Create fake auth users (profiles will be created by trigger)
  // We can't create auth.users directly, so we insert profiles with service role
  // =====================

  // We'll use deterministic UUIDs for players so listings can reference them
  const playerIds: Record<string, string> = {
    p1: '00000000-0000-0000-0000-000000000001',
    p2: '00000000-0000-0000-0000-000000000002',
    p3: '00000000-0000-0000-0000-000000000003',
    p4: '00000000-0000-0000-0000-000000000004',
    p5: '00000000-0000-0000-0000-000000000005',
    p6: '00000000-0000-0000-0000-000000000006',
    p7: '00000000-0000-0000-0000-000000000007',
    p8: '00000000-0000-0000-0000-000000000008',
    p9: '00000000-0000-0000-0000-000000000009',
    p10: '00000000-0000-0000-0000-000000000010',
    p11: '00000000-0000-0000-0000-000000000011',
    p12: '00000000-0000-0000-0000-000000000012',
    p13: '00000000-0000-0000-0000-000000000013',
    p14: '00000000-0000-0000-0000-000000000014',
    p15: '00000000-0000-0000-0000-000000000015',
  };

  // First create auth users so profile trigger fires
  for (const [key, uuid] of Object.entries(playerIds)) {
    const idx = parseInt(key.replace('p', ''));
    await admin.auth.admin.createUser({
      id: uuid,
      email: `player${idx}@backhub.demo`,
      password: 'demo-password-123',
      email_confirm: true,
      user_metadata: {
        display_name: players[idx - 1].displayName,
        role: 'player',
        region: players[idx - 1].region,
      },
    });
  }

  // Update profiles with full data (trigger created basic profiles)
  for (const p of players) {
    const uuid = playerIds[p.id];
    await admin.from('profiles').update({
      display_name: p.displayName,
      display_name_zh: p.displayNameZh,
      avatar_url: p.avatarUrl,
      region: p.region,
      is_verified: p.isVerified,
      role: 'player',
      bio: p.bio,
      bio_zh: p.bioZh,
      member_since: new Date(p.memberSince).toISOString(),
    }).eq('id', uuid);
  }

  // Insert player stats
  for (const p of players) {
    const uuid = playerIds[p.id];
    await admin.from('player_stats').upsert({
      player_id: uuid,
      lifetime_roi: p.stats.lifetimeROI,
      total_tournaments: p.stats.totalTournaments,
      cash_rate: p.stats.cashRate,
      total_staked_value: p.stats.totalStakedValue,
      avg_finish: p.stats.avgFinish,
      biggest_win: p.stats.biggestWin,
    });
  }

  // Insert monthly ROI
  for (const p of players) {
    const uuid = playerIds[p.id];
    for (const m of p.stats.monthlyROI) {
      await admin.from('monthly_roi').insert({
        player_id: uuid,
        month: m.month,
        roi: m.roi,
      });
    }
  }

  // =====================
  // 2. Tournaments
  // =====================
  const tournamentIds: Record<string, string> = {};
  const tournamentErrors: string[] = [];
  for (const t of tournaments) {
    const { data, error } = await admin.from('tournaments').insert({
      name: t.name,
      name_zh: t.nameZh,
      venue: t.venue,
      venue_zh: t.venueZh,
      date: new Date(t.date).toISOString(),
      buy_in: t.buyIn,
      guaranteed_pool: t.guaranteedPool,
      type: t.type,
      game: t.game,
      region: t.region,
    }).select('id').single();
    if (error) tournamentErrors.push(`${t.id} (${t.name}): ${error.message}`);
    if (data) tournamentIds[t.id] = data.id;
  }

  // =====================
  // 3. Listings
  // =====================
  const listingIds: Record<string, string> = {};
  const listingErrors: string[] = [];
  for (const l of listings) {
    if (!tournamentIds[l.tournamentId]) {
      listingErrors.push(`${l.id}: missing tournament ${l.tournamentId}`);
      continue;
    }
    const { data, error } = await admin.from('listings').insert({
      player_id: playerIds[l.playerId],
      tournament_id: tournamentIds[l.tournamentId],
      markup: l.markup,
      total_shares_offered: l.totalActionOffered,
      shares_sold: l.actionSold,
      min_threshold: l.minThreshold,
      status: l.status,
      created_at: l.createdAt,
    }).select('id').single();
    if (error) listingErrors.push(`${l.id}: ${error.message}`);
    if (data) listingIds[l.id] = data.id;
  }

  // =====================
  // 4. Testimonials
  // =====================
  for (const t of testimonials) {
    await admin.from('testimonials').insert({
      name: t.name,
      name_zh: t.nameZh,
      role: t.role,
      avatar: t.avatar,
      quote: t.quote,
      quote_zh: t.quoteZh,
      region: t.region,
      is_active: true,
    });
  }

  // =====================
  // 5. Reviews
  // =====================
  for (const r of reviews) {
    // Create reviewer auth users if they don't exist
    const reviewerUuids: Record<string, string> = {
      inv1: '00000000-0000-0000-0000-000000000101',
      inv2: '00000000-0000-0000-0000-000000000102',
      inv3: '00000000-0000-0000-0000-000000000103',
      inv4: '00000000-0000-0000-0000-000000000104',
    };

    // Ensure reviewer user exists
    const reviewerUuid = reviewerUuids[r.reviewerId];
    if (reviewerUuid) {
      // Try creating the auth user (will fail silently if exists)
      await admin.auth.admin.createUser({
        id: reviewerUuid,
        email: `${r.reviewerId}@backhub.demo`,
        password: 'demo-password-123',
        email_confirm: true,
        user_metadata: {
          display_name: r.reviewerName,
          role: 'investor',
          region: 'TW',
        },
      }).catch(() => {});

      // Update profile
      await admin.from('profiles').update({
        display_name: r.reviewerName,
        avatar_url: r.reviewerAvatar,
        role: 'investor',
      }).eq('id', reviewerUuid);

      await admin.from('reviews').insert({
        player_id: playerIds[r.playerId],
        reviewer_id: reviewerUuid,
        rating: r.rating,
        comment: r.comment,
        comment_zh: r.commentZh,
        created_at: r.createdAt,
      });
    }
  }

  return NextResponse.json({
    success: true,
    counts: {
      players: Object.keys(playerIds).length,
      tournaments: Object.keys(tournamentIds).length,
      listings: Object.keys(listingIds).length,
      testimonials: testimonials.length,
      reviews: reviews.length,
    },
    errors: {
      tournaments: tournamentErrors,
      listings: listingErrors,
    },
  });
}

// =====================
// SEED DATA
// =====================

// Real well-known Asian poker players — data sourced from Hendon Mob, SoMuchPoker, APT
const players = [
  {
    id: 'p1', displayName: 'Chiayun Wu', displayNameZh: '吳佳芸',
    avatarUrl: '/images/players/chiayun-wu.svg', region: 'TW', isVerified: true, memberSince: '2023-06-01',
    stats: { lifetimeROI: 42.8, totalTournaments: 135, cashRate: 96.3, totalStakedValue: 331865, avgFinish: 'Top 5%', biggestWin: 114935,
      monthlyROI: [
        { month: '2025-04', roi: 35.2 }, { month: '2025-05', roi: 18.7 }, { month: '2025-06', roi: -8.3 },
        { month: '2025-07', roi: 52.1 }, { month: '2025-08', roi: 28.4 }, { month: '2025-09', roi: 15.6 },
        { month: '2025-10', roi: 42.9 }, { month: '2025-11', roi: 65.3 }, { month: '2025-12', roi: -5.2 },
        { month: '2026-01', roi: 38.8 }, { month: '2026-02', roi: 22.1 }, { month: '2026-03', roi: 31.5 },
      ],
    },
    bio: '2025 Taiwan Player of the Year. Over $1.4M in live earnings. 130 cashes across 135 events in 2025 — a masterclass in volume and consistency. APT Kickoff Taipei 2023 champion.',
    bioZh: '2025年台灣年度最佳選手。現場收入超過140萬美元。2025年135場賽事中130次入圍——穩定性和賽量的巔峰。2023年APT台北開幕賽冠軍。',
  },
  {
    id: 'p2', displayName: 'Chih Feng Li', displayNameZh: '李志峰',
    avatarUrl: '/images/players/chih-feng-li.svg', region: 'TW', isVerified: true, memberSince: '2023-08-15',
    stats: { lifetimeROI: 35.2, totalTournaments: 89, cashRate: 97.8, totalStakedValue: 144620, avgFinish: 'Top 8%', biggestWin: 45000,
      monthlyROI: [
        { month: '2025-04', roi: 22.1 }, { month: '2025-05', roi: 15.3 }, { month: '2025-06', roi: -12.7 },
        { month: '2025-07', roi: 38.4 }, { month: '2025-08', roi: 45.2 }, { month: '2025-09', roi: -5.1 },
        { month: '2025-10', roi: 28.4 }, { month: '2025-11', roi: 52.8 }, { month: '2025-12', roi: 18.6 },
        { month: '2026-01', roi: -8.9 }, { month: '2026-02', roi: 35.3 }, { month: '2026-03', roi: 12.2 },
      ],
    },
    bio: '#2 ranked Taiwanese player in 2025 SPI rankings (score: 23,990). 87 cashes across 89 events in 15 festivals. Consistent high-volume grinder.',
    bioZh: '2025年SPI台灣排名第二（積分：23,990）。15個系列賽中89場賽事取得87次入圍。穩定的高賽量選手。',
  },
  {
    id: 'p3', displayName: 'Nevan Chang', displayNameZh: '張子龍',
    avatarUrl: '/images/players/nevan-chang.svg', region: 'TW', isVerified: true, memberSince: '2023-03-10',
    stats: { lifetimeROI: 58.6, totalTournaments: 58, cashRate: 69.0, totalStakedValue: 789465, avgFinish: 'Top 6%', biggestWin: 250000,
      monthlyROI: [
        { month: '2025-04', roi: 65.2 }, { month: '2025-05', roi: -18.3 }, { month: '2025-06', roi: 42.1 },
        { month: '2025-07', roi: 88.4 }, { month: '2025-08', roi: 12.7 }, { month: '2025-09', roi: -25.6 },
        { month: '2025-10', roi: 55.1 }, { month: '2025-11', roi: 78.2 }, { month: '2025-12', roi: -8.3 },
        { month: '2026-01', roi: 42.8 }, { month: '2026-02', roi: 62.4 }, { month: '2026-03', roi: 35.1 },
      ],
    },
    bio: '#3 ranked Taiwanese player 2025 (SPI: 23,645). $789K in total SPI earnings. High-stakes specialist with big scores across 17 festivals.',
    bioZh: '2025年台灣排名第三（SPI：23,645）。SPI總收入78.9萬美元。高額賽事專家，17個系列賽中取得大額獎金。',
  },
  {
    id: 'p4', displayName: 'Wayne Lam', displayNameZh: '林錦榮',
    avatarUrl: '/images/players/wayne-lam.svg', region: 'HK', isVerified: true, memberSince: '2023-01-20',
    stats: { lifetimeROI: 48.5, totalTournaments: 165, cashRate: 28.4, totalStakedValue: 530192, avgFinish: 'Top 7%', biggestWin: 266992,
      monthlyROI: [
        { month: '2025-04', roi: 32.4 }, { month: '2025-05', roi: 18.1 }, { month: '2025-06', roi: -15.3 },
        { month: '2025-07', roi: 42.6 }, { month: '2025-08', roi: 58.7 }, { month: '2025-09', roi: -8.2 },
        { month: '2025-10', roi: 35.1 }, { month: '2025-11', roi: 125.4 }, { month: '2025-12', roi: 22.8 },
        { month: '2026-01', roi: -12.3 }, { month: '2026-02', roi: 45.6 }, { month: '2026-03', roi: 28.9 },
      ],
    },
    bio: '2025 APT Championship winner ($266,992). $530K+ in live earnings. Led the APT Main Event final table with 17.9M chips. Hong Kong poker star.',
    bioZh: '2025年APT年度總冠軍（$266,992）。現場收入超過53萬美元。以1790萬籌碼領先APT主賽事決賽桌。香港撲克明星。',
  },
  {
    id: 'p5', displayName: 'Zong Chi He', displayNameZh: '何宗祺',
    avatarUrl: '/images/players/zong-chi-he.svg', region: 'TW', isVerified: true, memberSince: '2023-11-05',
    stats: { lifetimeROI: 28.4, totalTournaments: 83, cashRate: 80.7, totalStakedValue: 201065, avgFinish: 'Top 12%', biggestWin: 55000,
      monthlyROI: [
        { month: '2025-04', roi: 18.5 }, { month: '2025-05', roi: 25.2 }, { month: '2025-06', roi: -9.8 },
        { month: '2025-07', roi: 32.1 }, { month: '2025-08', roi: 15.4 }, { month: '2025-09', roi: -18.5 },
        { month: '2025-10', roi: 28.7 }, { month: '2025-11', roi: 42.3 }, { month: '2025-12', roi: 8.1 },
        { month: '2026-01', roi: -5.4 }, { month: '2026-02', roi: 35.8 }, { month: '2026-03', roi: 19.2 },
      ],
    },
    bio: '#4 ranked Taiwanese player 2025 (SPI: 21,932). 67 cashes in 83 events across 18 festivals. $201K in total earnings. Reliable volume player.',
    bioZh: '2025年台灣排名第四（SPI：21,932）。18個系列賽83場賽事中67次入圍。總收入20.1萬美元。可靠的賽量型選手。',
  },
  {
    id: 'p6', displayName: 'Hao Shan Huang', displayNameZh: '黃浩珊',
    avatarUrl: '/images/players/hao-shan-huang.svg', region: 'TW', isVerified: true, memberSince: '2024-06-15',
    stats: { lifetimeROI: 65.3, totalTournaments: 45, cashRate: 35.6, totalStakedValue: 480000, avgFinish: 'Top 5%', biggestWin: 97660,
      monthlyROI: [
        { month: '2025-04', roi: -12.1 }, { month: '2025-05', roi: 8.4 }, { month: '2025-06', roi: 22.3 },
        { month: '2025-07', roi: -5.7 }, { month: '2025-08', roi: 45.2 }, { month: '2025-09', roi: 18.9 },
        { month: '2025-10', roi: 32.8 }, { month: '2025-11', roi: 185.4 }, { month: '2025-12', roi: 12.1 },
        { month: '2026-01', roi: -8.3 }, { month: '2026-02', roi: 28.6 }, { month: '2026-03', roi: 15.7 },
      ],
    },
    bio: 'APT Championship 2025 Main Event finalist. Former Magic: The Gathering pro. Qualified via $350 satellite and reached the final table of the richest tournament in Asian poker history. $480K+ earnings.',
    bioZh: '2025年APT年度總冠軍主賽事決賽選手。前魔法風雲會職業選手。通過350美元衛星賽晉級，進入亞洲撲克史上最大獎池賽事決賽桌。收入超過48萬美元。',
  },
  {
    id: 'p7', displayName: 'Chi Jen Chu', displayNameZh: '朱志仁',
    avatarUrl: '/images/players/chi-jen-chu.svg', region: 'TW', isVerified: true, memberSince: '2022-09-01',
    stats: { lifetimeROI: 72.1, totalTournaments: 34, cashRate: 82.4, totalStakedValue: 1106111, avgFinish: 'Top 4%', biggestWin: 350000,
      monthlyROI: [
        { month: '2025-04', roi: 85.5 }, { month: '2025-05', roi: -22.3 }, { month: '2025-06', roi: 58.7 },
        { month: '2025-07', roi: 42.1 }, { month: '2025-08', roi: -15.4 }, { month: '2025-09', roi: 78.2 },
        { month: '2025-10', roi: 95.3 }, { month: '2025-11', roi: -8.1 }, { month: '2025-12', roi: 62.4 },
        { month: '2026-01', roi: 35.8 }, { month: '2026-02', roi: -12.6 }, { month: '2026-03', roi: 48.9 },
      ],
    },
    bio: '#6 in Taiwan SPI 2025 but #1 in total SPI earnings ($1.1M). 28 cashes in 34 events across 10 festivals. Big-score specialist — when he cashes, he cashes big.',
    bioZh: '2025年台灣SPI第六名，但SPI總收入第一（110萬美元）。10個系列賽34場賽事中28次入圍。大獎專家——入圍就是大獎。',
  },
  {
    id: 'p8', displayName: 'Sparrow Cheung', displayNameZh: '張鶴翔',
    avatarUrl: '/images/players/sparrow-cheung.svg', region: 'HK', isVerified: true, memberSince: '2022-05-10',
    stats: { lifetimeROI: 38.7, totalTournaments: 220, cashRate: 25.5, totalStakedValue: 850000, avgFinish: 'Top 10%', biggestWin: 180000,
      monthlyROI: [
        { month: '2025-04', roi: 28.6 }, { month: '2025-05', roi: -11.2 }, { month: '2025-06', roi: 42.8 },
        { month: '2025-07', roi: 18.5 }, { month: '2025-08', roi: -25.3 }, { month: '2025-09', roi: 55.1 },
        { month: '2025-10', roi: 22.7 }, { month: '2025-11', roi: 38.4 }, { month: '2025-12', roi: -6.8 },
        { month: '2026-01', roi: 32.1 }, { month: '2026-02', roi: 45.9 }, { month: '2026-03', roi: 14.6 },
      ],
    },
    bio: 'Hong Kong poker legend. GPI Asia ranked. Multiple APT final tables. One of the most recognizable faces in Asian poker with deep runs across APT, WSOP, and Triton events.',
    bioZh: '香港撲克傳奇。GPI亞洲排名選手。多次APT決賽桌。亞洲撲克最知名面孔之一，在APT、WSOP和Triton賽事中均有深入表現。',
  },
  {
    id: 'p9', displayName: 'Elton Tsang', displayNameZh: '曾恩明',
    avatarUrl: '/images/players/elton-tsang.svg', region: 'HK', isVerified: true, memberSince: '2022-01-15',
    stats: { lifetimeROI: 55.8, totalTournaments: 180, cashRate: 30.2, totalStakedValue: 12000000, avgFinish: 'Top 6%', biggestWin: 1697000,
      monthlyROI: [
        { month: '2025-04', roi: 45.8 }, { month: '2025-05', roi: 62.2 }, { month: '2025-06', roi: -22.3 },
        { month: '2025-07', roi: 38.1 }, { month: '2025-08', roi: -15.4 }, { month: '2025-09', roi: 72.6 },
        { month: '2025-10', roi: 28.3 }, { month: '2025-11', roi: 85.7 }, { month: '2025-12', roi: -8.9 },
        { month: '2026-01', roi: 52.4 }, { month: '2026-02', roi: 35.1 }, { month: '2026-03', roi: 42.8 },
      ],
    },
    bio: 'Hong Kong high-stakes legend. Won $1.697M Triton Poker title in 2025. Multiple millions in career earnings. Known for competing at the highest stakes in both cash games and tournaments worldwide.',
    bioZh: '香港高額賽傳奇。2025年贏得169.7萬美元Triton Poker冠軍。職業生涯收入數百萬美元。以在全球最高級別現金桌和錦標賽中競爭而聞名。',
  },
  {
    id: 'p10', displayName: 'Chih Wei Chen', displayNameZh: '陳志偉',
    avatarUrl: '/images/players/chih-wei-chen.svg', region: 'TW', isVerified: true, memberSince: '2024-01-20',
    stats: { lifetimeROI: 22.8, totalTournaments: 77, cashRate: 96.1, totalStakedValue: 109465, avgFinish: 'Top 14%', biggestWin: 28000,
      monthlyROI: [
        { month: '2025-04', roi: 15.2 }, { month: '2025-05', roi: 22.8 }, { month: '2025-06', roi: -8.4 },
        { month: '2025-07', roi: 28.1 }, { month: '2025-08', roi: 12.5 }, { month: '2025-09', roi: -15.3 },
        { month: '2025-10', roi: 32.6 }, { month: '2025-11', roi: 18.9 }, { month: '2025-12', roi: -5.2 },
        { month: '2026-01', roi: 25.4 }, { month: '2026-02', roi: 19.8 }, { month: '2026-03', roi: 8.7 },
      ],
    },
    bio: '#5 in Taiwan SPI 2025 (score: 18,735). 74 cashes in 77 events across 17 festivals. $109K total earnings. Ultra-consistent grinder.',
    bioZh: '2025年台灣SPI第五名（積分：18,735）。17個系列賽77場賽事中74次入圍。總收入10.9萬美元。超級穩定的選手。',
  },
  {
    id: 'p11', displayName: 'Li Ta Hsu', displayNameZh: '許力達',
    avatarUrl: '/images/players/li-ta-hsu.svg', region: 'TW', isVerified: true, memberSince: '2024-03-10',
    stats: { lifetimeROI: 18.5, totalTournaments: 72, cashRate: 93.1, totalStakedValue: 99850, avgFinish: 'Top 16%', biggestWin: 22000,
      monthlyROI: [
        { month: '2025-04', roi: 12.5 }, { month: '2025-05', roi: 18.2 }, { month: '2025-06', roi: -6.8 },
        { month: '2025-07', roi: 22.3 }, { month: '2025-08', roi: 8.7 }, { month: '2025-09', roi: -12.4 },
        { month: '2025-10', roi: 28.1 }, { month: '2025-11', roi: 15.6 }, { month: '2025-12', roi: -3.2 },
        { month: '2026-01', roi: 19.8 }, { month: '2026-02', roi: 25.4 }, { month: '2026-03', roi: 11.3 },
      ],
    },
    bio: '#7 in Taiwan SPI 2025 (score: 17,078). 68 cashes in 72 events. $99.8K in total earnings. Reliable and steady performer on the Taiwan circuit.',
    bioZh: '2025年台灣SPI第七名（積分：17,078）。72場賽事中68次入圍。總收入9.98萬美元。台灣巡迴賽穩定表現者。',
  },
  {
    id: 'p12', displayName: 'Fung Lin', displayNameZh: '林鋒',
    avatarUrl: '/images/players/fung-lin.svg', region: 'HK', isVerified: true, memberSince: '2023-06-20',
    stats: { lifetimeROI: 42.3, totalTournaments: 95, cashRate: 32.6, totalStakedValue: 350000, avgFinish: 'Top 8%', biggestWin: 71994,
      monthlyROI: [
        { month: '2025-04', roi: 35.2 }, { month: '2025-05', roi: -8.4 }, { month: '2025-06', roi: 42.1 },
        { month: '2025-07', roi: 28.6 }, { month: '2025-08', roi: -18.3 }, { month: '2025-09', roi: 52.4 },
        { month: '2025-10', roi: 15.7 }, { month: '2025-11', roi: 88.2 }, { month: '2025-12', roi: -5.1 },
        { month: '2026-01', roi: 38.9 }, { month: '2026-02', roi: 22.3 }, { month: '2026-03', roi: 31.6 },
      ],
    },
    bio: 'Won APT Championship 2025 Trip Saver Championship ($71,994). Hong Kong player with strong results across APT events. Rising force in the HK poker scene.',
    bioZh: '贏得2025年APT年度總冠軍旅行者冠軍賽（$71,994）。在APT賽事中成績優異的香港選手。香港撲克圈的新興力量。',
  },
  {
    id: 'p13', displayName: 'Tony Lin', displayNameZh: '林仁',
    avatarUrl: '/images/players/tony-lin.svg', region: 'TW', isVerified: true, memberSince: '2022-01-01',
    stats: { lifetimeROI: 82.5, totalTournaments: 310, cashRate: 22.8, totalStakedValue: 18500000, avgFinish: 'Top 3%', biggestWin: 4200000,
      monthlyROI: [
        { month: '2025-04', roi: 75.2 }, { month: '2025-05', roi: -28.4 }, { month: '2025-06', roi: 92.1 },
        { month: '2025-07', roi: 48.3 }, { month: '2025-08', roi: -12.8 }, { month: '2025-09', roi: 125.4 },
        { month: '2025-10', roi: 38.7 }, { month: '2025-11', roi: 185.2 }, { month: '2025-12', roi: -22.5 },
        { month: '2026-01', roi: 62.8 }, { month: '2026-02', roi: 95.1 }, { month: '2026-03', roi: 45.3 },
      ],
    },
    bio: 'WPT Ambassador and one of Taiwan\'s most decorated poker players. Over $18M in live tournament earnings. Multiple WPT and WSOP final tables. Known as "Ren Lin" internationally — a dominant force at the highest stakes globally.',
    bioZh: 'WPT大使，台灣最頂尖的撲克選手之一。現場錦標賽收入超過1800萬美元。多次WPT和WSOP決賽桌。國際上以「林仁」聞名——在全球最高級別賽事中的統治級力量。',
  },
  {
    id: 'p14', displayName: 'Eric Tsai', displayNameZh: '小六',
    avatarUrl: '/images/players/eric-tsai.svg', region: 'TW', isVerified: true, memberSince: '2022-03-15',
    stats: { lifetimeROI: 68.4, totalTournaments: 245, cashRate: 26.5, totalStakedValue: 5200000, avgFinish: 'Top 5%', biggestWin: 1150000,
      monthlyROI: [
        { month: '2025-04', roi: 55.8 }, { month: '2025-05', roi: 22.3 }, { month: '2025-06', roi: -18.7 },
        { month: '2025-07', roi: 82.4 }, { month: '2025-08', roi: -8.5 }, { month: '2025-09', roi: 45.2 },
        { month: '2025-10', roi: 68.1 }, { month: '2025-11', roi: 112.8 }, { month: '2025-12', roi: -15.3 },
        { month: '2026-01', roi: 52.6 }, { month: '2026-02', roi: 78.4 }, { month: '2026-03', roi: 35.9 },
      ],
    },
    bio: 'Taiwan GPI #1 ranked player. Known as "小六" (SixPoker) in the Asian poker community. Over $5.2M in live earnings. Dominant across APT, TMT, and regional tours. A true pioneer of Taiwan\'s poker scene.',
    bioZh: '台灣GPI排名第一選手。在亞洲撲克圈以「小六」聞名。現場收入超過520萬美元。在APT、TMT和地區巡迴賽中表現出色。台灣撲克界的真正先驅。',
  },
  {
    id: 'p15', displayName: 'Charlie Chiu', displayNameZh: '查理',
    avatarUrl: '/images/players/charlie-chiu.svg', region: 'HK', isVerified: true, memberSince: '2022-06-01',
    stats: { lifetimeROI: 52.8, totalTournaments: 195, cashRate: 24.6, totalStakedValue: 3800000, avgFinish: 'Top 6%', biggestWin: 890000,
      monthlyROI: [
        { month: '2025-04', roi: 42.5 }, { month: '2025-05', roi: -15.8 }, { month: '2025-06', roi: 58.2 },
        { month: '2025-07', roi: 35.1 }, { month: '2025-08', roi: -22.4 }, { month: '2025-09', roi: 72.8 },
        { month: '2025-10', roi: 28.3 }, { month: '2025-11', roi: 95.6 }, { month: '2025-12', roi: -8.7 },
        { month: '2026-01', roi: 48.2 }, { month: '2026-02', roi: 62.1 }, { month: '2026-03', roi: 32.5 },
      ],
    },
    bio: 'Natural8 Ambassador and Hong Kong poker star. Known as "I.C Charlie" in the international circuit. Over $3.8M in live earnings. Multiple deep runs at WSOP, APT, and Triton events. One of HK\'s most recognizable poker personalities.',
    bioZh: 'Natural8大使，香港撲克明星。在國際賽事中以「I.C Charlie」聞名。現場收入超過380萬美元。在WSOP、APT和Triton賽事中多次深入。香港最知名的撲克人物之一。',
  },
];

// Real tournament data sourced from APT, TMT, CTP, and other verified Asia poker events
const tournaments = [
  // === APT Taipei 2026 (Apr 22 – May 3) — Real events from theasianpokertour.com ===
  { id: 't1', name: 'APT National Cup', nameZh: 'APT國家盃', venue: 'Red Space, Songshan District, Taipei', venueZh: 'Red Space 多元商務空間，台北松山區', date: '2026-04-22', buyIn: 380, guaranteedPool: 475000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't2', name: 'APT Mystery Bounty – Sponsored by Natural8', nameZh: 'APT神秘賞金賽 – Natural8贊助', venue: 'Red Space, Songshan District, Taipei', venueZh: 'Red Space 多元商務空間，台北松山區', date: '2026-04-25', buyIn: 635, guaranteedPool: 635000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't3', name: 'APT Super High Roller', nameZh: 'APT超高額賽', venue: 'Asia Poker Arena, Zhongshan District, Taipei', venueZh: 'Asia Poker Arena，台北中山區', date: '2026-04-25', buyIn: 10500, guaranteedPool: 475000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't4', name: 'APT Taipei Main Event', nameZh: 'APT台北主賽事', venue: 'Red Space, Songshan District, Taipei', venueZh: 'Red Space 多元商務空間，台北松山區', date: '2026-04-26', buyIn: 1745, guaranteedPool: 2220000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't5', name: 'APT Sunday Superstack', nameZh: 'APT週日超深籌碼賽', venue: 'Red Space, Songshan District, Taipei', venueZh: 'Red Space 多元商務空間，台北松山區', date: '2026-04-26', buyIn: 950, guaranteedPool: 159000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't6', name: 'APT High Roller', nameZh: 'APT高額賽', venue: 'Asia Poker Arena, Zhongshan District, Taipei', venueZh: 'Asia Poker Arena，台北中山區', date: '2026-04-28', buyIn: 2220, guaranteedPool: 475000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't7', name: 'APT High Roller Ultra Stack', nameZh: 'APT高額超深籌碼賽', venue: 'Red Space, Songshan District, Taipei', venueZh: 'Red Space 多元商務空間，台北松山區', date: '2026-04-22', buyIn: 2060, guaranteedPool: 317000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't8', name: 'Zodiac Classic – Sponsored by Natural8', nameZh: '生肖經典賽 – Natural8贊助', venue: 'Red Space, Songshan District, Taipei', venueZh: 'Red Space 多元商務空間，台北松山區', date: '2026-04-30', buyIn: 2700, guaranteedPool: 793000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't9', name: 'APT Superstar Challenge', nameZh: 'APT明星挑戰賽', venue: 'Asia Poker Arena, Zhongshan District, Taipei', venueZh: 'Asia Poker Arena，台北中山區', date: '2026-04-29', buyIn: 1430, guaranteedPool: 317000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't10', name: 'APT Saturday Single Re-Entry', nameZh: 'APT週六單次重入賽', venue: 'Asia Poker Arena, Zhongshan District, Taipei', venueZh: 'Asia Poker Arena，台北中山區', date: '2026-04-25', buyIn: 222, guaranteedPool: 32000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't11', name: 'APT NL Hold\'em Freezeout', nameZh: 'APT無限注德州撲克凍結賽', venue: 'Asia Poker Arena, Zhongshan District, Taipei', venueZh: 'Asia Poker Arena，台北中山區', date: '2026-04-25', buyIn: 1110, guaranteedPool: 95000, type: 'MTT', game: 'NLHE', region: 'TW' },
  // === TMT (Taiwan Millions Tournament) 20 — Jul 8 – Aug 3 ===
  { id: 't12', name: 'TMT 20 Main Event', nameZh: 'TMT 20 主賽事', venue: 'CTP Chinese Texas Hold\'em Poker Club, Taipei', venueZh: 'CTP中華德州撲克協會，台北', date: '2026-07-15', buyIn: 1600, guaranteedPool: 1500000, type: 'MTT', game: 'NLHE', region: 'TW' },
  { id: 't13', name: 'TMT 20 High Roller', nameZh: 'TMT 20 高額賽', venue: 'CTP Chinese Texas Hold\'em Poker Club, Taipei', venueZh: 'CTP中華德州撲克協會，台北', date: '2026-07-20', buyIn: 5000, guaranteedPool: 500000, type: 'MTT', game: 'NLHE', region: 'TW' },
  // === TMT Championship — Oct 16–26 ===
  { id: 't14', name: 'TMT Championship 2026 Main Event', nameZh: 'TMT錦標賽2026主賽事', venue: 'CTP Chinese Texas Hold\'em Poker Club, Taipei', venueZh: 'CTP中華德州撲克協會，台北', date: '2026-10-18', buyIn: 2000, guaranteedPool: 1000000, type: 'MTT', game: 'NLHE', region: 'TW' },
  // === APT Championship 2026 (Nov 13–29) — Season finale ===
  { id: 't15', name: 'APT Championship 2026 Main Event', nameZh: 'APT年度總冠軍賽2026主賽事', venue: 'Red Space, Songshan District, Taipei', venueZh: 'Red Space 多元商務空間，台北松山區', date: '2026-11-20', buyIn: 10000, guaranteedPool: 5000000, type: 'MTT', game: 'NLHE', region: 'TW' },
];

const listings = [
  { id: 'l1', playerId: 'p1', tournamentId: 't1', markup: 1.15, totalActionOffered: 70, actionSold: 52, minThreshold: 50, status: 'active', createdAt: '2026-03-08T10:30:00Z' },
  { id: 'l2', playerId: 'p2', tournamentId: 't2', markup: 1.20, totalActionOffered: 60, actionSold: 60, minThreshold: 40, status: 'filled', createdAt: '2026-03-07T14:15:00Z' },
  { id: 'l3', playerId: 'p3', tournamentId: 't3', markup: 1.10, totalActionOffered: 80, actionSold: 35, minThreshold: 60, status: 'active', createdAt: '2026-03-09T08:00:00Z' },
  { id: 'l4', playerId: 'p4', tournamentId: 't3', markup: 1.25, totalActionOffered: 50, actionSold: 48, minThreshold: 30, status: 'active', createdAt: '2026-03-06T16:45:00Z' },
  { id: 'l5', playerId: 'p5', tournamentId: 't5', markup: 1.05, totalActionOffered: 90, actionSold: 22, minThreshold: 70, status: 'active', createdAt: '2026-03-10T12:00:00Z' },
  { id: 'l6', playerId: 'p6', tournamentId: 't4', markup: 1.12, totalActionOffered: 75, actionSold: 58, minThreshold: 50, status: 'active', createdAt: '2026-03-05T09:30:00Z' },
  { id: 'l7', playerId: 'p7', tournamentId: 't1', markup: 1.08, totalActionOffered: 85, actionSold: 41, minThreshold: 60, status: 'active', createdAt: '2026-03-09T15:20:00Z' },
  { id: 'l8', playerId: 'p9', tournamentId: 't7', markup: 1.22, totalActionOffered: 40, actionSold: 40, minThreshold: 30, status: 'filled', createdAt: '2026-03-04T11:00:00Z' },
  { id: 'l9', playerId: 'p10', tournamentId: 't6', markup: 1.18, totalActionOffered: 65, actionSold: 29, minThreshold: 45, status: 'active', createdAt: '2026-03-10T07:45:00Z' },
  { id: 'l10', playerId: 'p12', tournamentId: 't10', markup: 1.10, totalActionOffered: 70, actionSold: 55, minThreshold: 50, status: 'active', createdAt: '2026-03-08T18:30:00Z' },
  { id: 'l11', playerId: 'p1', tournamentId: 't8', markup: 1.12, totalActionOffered: 80, actionSold: 64, minThreshold: 60, status: 'active', createdAt: '2026-03-07T20:00:00Z' },
  { id: 'l12', playerId: 'p3', tournamentId: 't15', markup: 1.15, totalActionOffered: 60, actionSold: 18, minThreshold: 40, status: 'active', createdAt: '2026-03-11T09:15:00Z' },
  { id: 'l13', playerId: 'p4', tournamentId: 't10', markup: 1.20, totalActionOffered: 55, actionSold: 55, minThreshold: 35, status: 'filled', createdAt: '2026-03-03T13:30:00Z' },
  { id: 'l14', playerId: 'p6', tournamentId: 't12', markup: 1.14, totalActionOffered: 70, actionSold: 42, minThreshold: 50, status: 'active', createdAt: '2026-03-09T11:00:00Z' },
  { id: 'l15', playerId: 'p8', tournamentId: 't5', markup: 1.05, totalActionOffered: 95, actionSold: 15, minThreshold: 80, status: 'active', createdAt: '2026-03-11T14:30:00Z' },
  { id: 'l16', playerId: 'p9', tournamentId: 't1', markup: 1.18, totalActionOffered: 50, actionSold: 38, minThreshold: 40, status: 'active', createdAt: '2026-03-08T06:00:00Z' },
  { id: 'l17', playerId: 'p2', tournamentId: 't7', markup: 1.25, totalActionOffered: 45, actionSold: 45, minThreshold: 30, status: 'filled', createdAt: '2026-03-02T17:00:00Z' },
  { id: 'l18', playerId: 'p10', tournamentId: 't15', markup: 1.16, totalActionOffered: 65, actionSold: 33, minThreshold: 45, status: 'active', createdAt: '2026-03-10T22:00:00Z' },
  { id: 'l19', playerId: 'p7', tournamentId: 't9', markup: 1.08, totalActionOffered: 80, actionSold: 72, minThreshold: 60, status: 'active', createdAt: '2026-03-06T08:15:00Z' },
  { id: 'l20', playerId: 'p11', tournamentId: 't11', markup: 1.05, totalActionOffered: 90, actionSold: 8, minThreshold: 75, status: 'active', createdAt: '2026-03-11T16:45:00Z' },
  { id: 'l21', playerId: 'p12', tournamentId: 't4', markup: 1.12, totalActionOffered: 75, actionSold: 61, minThreshold: 55, status: 'active', createdAt: '2026-03-07T10:30:00Z' },
  { id: 'l22', playerId: 'p5', tournamentId: 't13', markup: 1.06, totalActionOffered: 85, actionSold: 28, minThreshold: 65, status: 'active', createdAt: '2026-03-10T19:00:00Z' },
  { id: 'l23', playerId: 'p1', tournamentId: 't14', markup: 1.15, totalActionOffered: 60, actionSold: 60, minThreshold: 40, status: 'completed', createdAt: '2026-02-25T08:00:00Z' },
  { id: 'l24', playerId: 'p3', tournamentId: 't8', markup: 1.10, totalActionOffered: 70, actionSold: 45, minThreshold: 50, status: 'active', createdAt: '2026-03-09T21:15:00Z' },
  // Tony Lin listings
  { id: 'l25', playerId: 'p13', tournamentId: 't3', markup: 1.30, totalActionOffered: 40, actionSold: 40, minThreshold: 25, status: 'filled', createdAt: '2026-03-02T08:00:00Z' },
  { id: 'l26', playerId: 'p13', tournamentId: 't15', markup: 1.25, totalActionOffered: 30, actionSold: 22, minThreshold: 20, status: 'active', createdAt: '2026-03-10T10:00:00Z' },
  // 小六 Eric Tsai listings
  { id: 'l27', playerId: 'p14', tournamentId: 't4', markup: 1.18, totalActionOffered: 55, actionSold: 48, minThreshold: 40, status: 'active', createdAt: '2026-03-08T14:00:00Z' },
  { id: 'l28', playerId: 'p14', tournamentId: 't8', markup: 1.15, totalActionOffered: 65, actionSold: 52, minThreshold: 45, status: 'active', createdAt: '2026-03-09T16:30:00Z' },
  // 查理 Charlie Chiu listings
  { id: 'l29', playerId: 'p15', tournamentId: 't6', markup: 1.20, totalActionOffered: 50, actionSold: 35, minThreshold: 30, status: 'active', createdAt: '2026-03-07T12:00:00Z' },
  { id: 'l30', playerId: 'p15', tournamentId: 't15', markup: 1.22, totalActionOffered: 45, actionSold: 28, minThreshold: 30, status: 'active', createdAt: '2026-03-11T09:00:00Z' },
];

const testimonials = [
  { name: 'Alex T.', nameZh: '陳偉倫', role: 'investor', avatar: '/avatars/inv1.svg', quote: "BackHub made it incredibly easy to invest in poker talent across Asia. I've seen consistent returns backing verified players.", quoteZh: 'BackHub讓投資亞洲撲克人才變得非常簡單。支持經過驗證的選手，我看到了穩定的回報。', region: 'TW' },
  { name: 'Mei-Ling Wang', nameZh: '王美玲', role: 'player', avatar: '/avatars/p2.svg', quote: 'As a player, BackHub lets me focus on my game instead of worrying about buy-ins. The investor community here is amazing.', quoteZh: '作為選手，BackHub讓我專注於比賽而不用擔心買入費。這裡的投資者社群非常棒。', region: 'TW' },
  { name: 'Robert K.', nameZh: '郭志遠', role: 'investor', avatar: '/avatars/inv3.svg', quote: 'The transparency on this platform is outstanding. Detailed player stats, verified results, and prompt payouts every time.', quoteZh: '這個平台的透明度非常出色。詳細的選手數據、經過驗證的結果，每次都能及時派彩。', region: 'HK' },
  { name: 'Jason Lam', nameZh: '林俊傑', role: 'player', avatar: '/avatars/p3.svg', quote: 'Finally a staking platform built for the Asian market. Local payment methods and bilingual support make all the difference.', quoteZh: '終於有了為亞洲市場打造的質押平台。本地支付方式和雙語支持使一切都不同了。', region: 'HK' },
  { name: 'Jenny L.', nameZh: '李佳穎', role: 'investor', avatar: '/avatars/inv2.svg', quote: "I started with small investments and now have a diversified portfolio of poker players. Best alternative investment I've found.", quoteZh: '我從小額投資開始，現在已經擁有多元化的撲克選手投資組合。我找到的最佳另類投資。', region: 'TW' },
];

const reviews = [
  { id: 'r1', playerId: 'p1', reviewerId: 'inv1', reviewerName: 'Alex T.', reviewerAvatar: '/avatars/inv1.svg', rating: 5, comment: 'David is incredibly consistent. My investments with him always turn profitable over time. Highly recommended!', commentZh: 'David非常穩定。我對他的投資總是隨時間獲利。強烈推薦！', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'r2', playerId: 'p1', reviewerId: 'inv2', reviewerName: 'Jenny L.', reviewerAvatar: '/avatars/inv2.svg', rating: 4, comment: 'Solid player with a good track record. Communication could be a bit better after tournaments.', commentZh: '實力堅固的選手，成績良好。賽後溝通可以更好一些。', createdAt: '2026-01-28T14:30:00Z' },
  { id: 'r3', playerId: 'p2', reviewerId: 'inv3', reviewerName: 'Robert K.', reviewerAvatar: '/avatars/inv3.svg', rating: 5, comment: "Mei-Ling is a phenomenal player. Her aggressive style leads to big wins. Best investment I've made on the platform.", commentZh: '美玲是非凡的選手。她積極的風格帶來大勝。我在平台上最好的投資。', createdAt: '2026-03-01T09:15:00Z' },
  { id: 'r4', playerId: 'p3', reviewerId: 'inv1', reviewerName: 'Alex T.', reviewerAvatar: '/avatars/inv1.svg', rating: 4, comment: 'Jason is a veteran with deep tournament experience. Very reliable and transparent with updates.', commentZh: 'Jason是經驗豐富的老將。非常可靠，更新透明。', createdAt: '2026-02-20T16:45:00Z' },
  { id: 'r5', playerId: 'p4', reviewerId: 'inv4', reviewerName: 'Mike W.', reviewerAvatar: '/avatars/inv4.svg', rating: 5, comment: "Sophie's ROI speaks for itself. One of the best investments on BackHub. Will keep backing her.", commentZh: "Sophie的ROI不言自明。BackHub上最好的投資之一。會繼續支持她。", createdAt: '2026-03-05T11:30:00Z' },
  { id: 'r6', playerId: 'p9', reviewerId: 'inv2', reviewerName: 'Jenny L.', reviewerAvatar: '/avatars/inv2.svg', rating: 5, comment: 'Michael is a true professional. Multiple WSOP rings and always keeps backers informed.', commentZh: 'Michael是真正的職業選手。多枚WSOP戒指，總是讓支持者了解最新情況。', createdAt: '2026-02-10T08:00:00Z' },
  { id: 'r7', playerId: 'p6', reviewerId: 'inv3', reviewerName: 'Robert K.', reviewerAvatar: '/avatars/inv3.svg', rating: 4, comment: 'Raymond is excellent in PLO and mixed games. A unique offering on the platform.', commentZh: 'Raymond在PLO和混合賽事中表現出色。平台上的獨特選擇。', createdAt: '2026-01-15T13:00:00Z' },
  { id: 'r8', playerId: 'p10', reviewerId: 'inv4', reviewerName: 'Mike W.', reviewerAvatar: '/avatars/inv4.svg', rating: 4, comment: 'Tony consistently delivers positive returns. His Macau experience gives him an edge in live events.', commentZh: 'Tony持續提供正回報。他的澳門經驗使他在現場賽事中佔優勢。', createdAt: '2026-02-28T19:00:00Z' },
];
