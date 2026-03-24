import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { approveTournamentResult } from '@/lib/tournament-result-approval';
import type { Profile } from '@/lib/supabase/types';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single();
  const profile = data as Profile | null;
  if (!profile?.is_admin) return null;
  return user;
}

// GET — Admin lists tournament results (pending + history)
export async function GET() {
  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminClient = await createAdminClient();

  // Fetch all results
  const { data: results, error } = await adminClient
    .from('tournament_results')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allResults = results || [];

  // Gather listing IDs to join with listing + tournament + player data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listingIds = [...new Set(allResults.map((r: any) => r.listing_id))];
  if (listingIds.length === 0) {
    return NextResponse.json({ pending: [], history: [] });
  }

  const { data: listings } = await adminClient
    .from('listings')
    .select('*')
    .in('id', listingIds);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tournamentIds = [...new Set((listings || []).map((l: any) => l.tournament_id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerIds = [...new Set((listings || []).map((l: any) => l.player_id))];

  const [{ data: tournaments }, { data: players }, { data: investments }] = await Promise.all([
    adminClient.from('tournaments').select('*').in('id', tournamentIds),
    adminClient.from('profiles').select('id, display_name, display_name_zh, avatar_url').in('id', playerIds),
    adminClient.from('investments').select('*').in('listing_id', listingIds).eq('status', 'confirmed'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tournamentMap = new Map((tournaments || []).map((t: any) => [t.id, t]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerMap = new Map((players || []).map((p: any) => [p.id, p]));

  // Group investments by listing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const investmentsByListing = new Map<string, any[]>();
  for (const inv of (investments || [])) {
    const list = investmentsByListing.get(inv.listing_id) || [];
    list.push(inv);
    investmentsByListing.set(inv.listing_id, list);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = allResults.map((r: any) => {
    const listing = listingMap.get(r.listing_id);
    const tournament = listing ? tournamentMap.get(listing.tournament_id) : null;
    const player = playerMap.get(r.player_id);
    const listingInvestments = investmentsByListing.get(r.listing_id) || [];
    const totalSharesSold = listing ? Number(listing.shares_sold) : 0;

    // Calculate distribution preview
    let backerPool = 0;
    let playerKeeps = 0;
    if (r.tournament_result === 'win' && r.prize_amount > 0) {
      backerPool = r.prize_amount * (totalSharesSold / 100);
      playerKeeps = r.prize_amount - backerPool;
    }

    return {
      id: r.id,
      listingId: r.listing_id,
      playerId: r.player_id,
      tournamentResult: r.tournament_result,
      prizeAmount: Number(r.prize_amount),
      totalEntries: r.total_entries,
      finishPosition: r.finish_position,
      proofUrl: r.proof_url,
      notes: r.notes,
      status: r.status,
      submittedAt: r.submitted_at,
      reviewedAt: r.reviewed_at,
      rejectionReason: r.rejection_reason,
      player: player ? {
        id: player.id,
        displayName: player.display_name,
        displayNameZh: player.display_name_zh,
        avatarUrl: player.avatar_url,
      } : null,
      tournament: tournament ? {
        id: tournament.id,
        name: tournament.name,
        nameZh: tournament.name_zh,
        buyIn: Number(tournament.buy_in),
        date: tournament.date,
      } : null,
      listing: listing ? {
        totalSharesSold,
        totalSharesOffered: Number(listing.total_shares_offered),
      } : null,
      distribution: {
        backerPool,
        playerKeeps,
        backerCount: listingInvestments.length,
      },
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pending = enriched.filter((r: any) => r.status === 'pending_review');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history = enriched.filter((r: any) => r.status !== 'pending_review');

  return NextResponse.json({ pending, history });
}

// PUT — Admin approves or rejects a tournament result
export async function PUT(request: Request) {
  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { resultId, action, rejectionReason } = body;

  if (!resultId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  if (action === 'reject') {
    const adminClient = await createAdminClient();

    const { data: result } = await adminClient
      .from('tournament_results')
      .select('*')
      .eq('id', resultId)
      .single();

    if (!result) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    if (result.status !== 'pending_review') {
      return NextResponse.json({ error: 'Result is not pending review' }, { status: 400 });
    }

    await adminClient
      .from('tournament_results')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: rejectionReason || null,
      })
      .eq('id', resultId);

    await adminClient
      .from('listings')
      .update({ status: 'registered' })
      .eq('id', result.listing_id);

    return NextResponse.json({ success: true, action: 'rejected' });
  }

  // Approve via shared helper
  const approvalResult = await approveTournamentResult(resultId, user.id);

  if (!approvalResult.success) {
    return NextResponse.json({ error: approvalResult.error }, { status: 400 });
  }

  return NextResponse.json({ action: 'approved', ...approvalResult });
}
