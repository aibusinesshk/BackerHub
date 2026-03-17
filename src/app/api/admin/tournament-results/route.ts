import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/types';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
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
  const listingIds = [...new Set(allResults.map((r: any) => r.listing_id))];
  if (listingIds.length === 0) {
    return NextResponse.json({ pending: [], history: [] });
  }

  const { data: listings } = await adminClient
    .from('listings')
    .select('*')
    .in('id', listingIds);

  const tournamentIds = [...new Set((listings || []).map((l: any) => l.tournament_id))];
  const playerIds = [...new Set((listings || []).map((l: any) => l.player_id))];

  const [{ data: tournaments }, { data: players }, { data: investments }] = await Promise.all([
    adminClient.from('tournaments').select('*').in('id', tournamentIds),
    adminClient.from('profiles').select('id, display_name, display_name_zh, avatar_url').in('id', playerIds),
    adminClient.from('investments').select('*').in('listing_id', listingIds).eq('status', 'confirmed'),
  ]);

  const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));
  const tournamentMap = new Map((tournaments || []).map((t: any) => [t.id, t]));
  const playerMap = new Map((players || []).map((p: any) => [p.id, p]));

  // Group investments by listing
  const investmentsByListing = new Map<string, any[]>();
  for (const inv of (investments || [])) {
    const list = investmentsByListing.get(inv.listing_id) || [];
    list.push(inv);
    investmentsByListing.set(inv.listing_id, list);
  }

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

  const pending = enriched.filter((r: any) => r.status === 'pending_review');
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

  const adminClient = await createAdminClient();

  // Fetch the result
  const { data: result } = await adminClient
    .from('tournament_results')
    .select('*')
    .eq('id', resultId)
    .single();

  if (!result) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  if (result.status !== 'pending_review') {
    return NextResponse.json({ error: 'Result is not pending review' }, { status: 400 });
  }

  if (action === 'reject') {
    // Reject: update result status, revert listing status
    await adminClient
      .from('tournament_results')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: rejectionReason || null,
      })
      .eq('id', resultId);

    // Revert listing status so player can resubmit
    await adminClient
      .from('listings')
      .update({ status: 'registered' })
      .eq('id', result.listing_id);

    return NextResponse.json({ success: true, action: 'rejected' });
  }

  // Approve: different flow based on result type
  const listingId = result.listing_id;
  const tournamentResult = result.tournament_result;
  const prizeAmount = Number(result.prize_amount);

  // Fetch listing
  const { data: listing } = await adminClient
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Fetch confirmed investments
  const { data: investmentRaw } = await adminClient
    .from('investments')
    .select('*')
    .eq('listing_id', listingId)
    .eq('status', 'confirmed');
  const investments = investmentRaw || [];

  // Update tournament result record as approved
  await adminClient
    .from('tournament_results')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', resultId);

  if (tournamentResult === 'win' && prizeAmount > 0) {
    // ═══════════════════════════════════════════════
    // WIN: Move to pending_deposit — player must deposit the backer share
    // Settlement happens AFTER player deposits via /api/listings/[id]/confirm-deposit
    // ═══════════════════════════════════════════════
    const totalSharesSold = Number(listing.shares_sold);
    const expectedDeposit = prizeAmount * (totalSharesSold / 100);

    // Set 10 business day deadline for prize deposit
    const depositDeadline = new Date();
    depositDeadline.setDate(depositDeadline.getDate() + 14); // ~10 business days

    await adminClient.from('listings').update({
      status: 'pending_deposit',
      deadline_deposit: depositDeadline.toISOString(),
    }).eq('id', listingId);

    // Update escrow with result info (but NOT settled yet)
    await adminClient.from('escrow').update({
      tournament_result: tournamentResult,
      prize_amount: prizeAmount,
    }).eq('listing_id', listingId);

    return NextResponse.json({
      success: true,
      action: 'approved',
      nextStep: 'pending_deposit',
      expectedDeposit,
      depositDeadline: depositDeadline.toISOString(),
    });

  } else if (tournamentResult === 'loss') {
    // ═══════════════════════════════════════════════
    // LOSS: Settle immediately — backers lose their stake, no money moves
    // ═══════════════════════════════════════════════
    for (const inv of investments) {
      await adminClient.from('investments').update({ status: 'settled' as const }).eq('id', inv.id);
      await adminClient.from('transactions').insert({
        user_id: inv.investor_id,
        type: 'payout' as const,
        investment_id: inv.id,
        listing_id: listingId,
        amount: 0,
        currency: inv.currency,
        status: 'completed' as const,
        description: 'Tournament result: no cash',
      });
    }

    await adminClient.from('escrow').update({
      status: 'settled' as 'settled',
      tournament_result: tournamentResult,
      prize_amount: 0,
      settled_at: new Date().toISOString(),
    }).eq('listing_id', listingId);

    await adminClient.from('listings').update({ status: 'settled' as const }).eq('id', listingId);

    // Update player stats
    await updatePlayerStats(adminClient, listing.player_id);

    return NextResponse.json({ success: true, action: 'approved', nextStep: 'settled' });

  } else if (tournamentResult === 'cancelled') {
    // ═══════════════════════════════════════════════
    // CANCELLED: Full refund to backers from escrow
    // ═══════════════════════════════════════════════
    for (const inv of investments) {
      await adminClient.rpc('adjust_wallet_balance', {
        p_user_id: inv.investor_id,
        p_amount: Number(inv.amount_paid),
      });

      await adminClient.from('investments').update({ status: 'refunded' as const }).eq('id', inv.id);
      await adminClient.from('transactions').insert({
        user_id: inv.investor_id,
        type: 'refund' as const,
        investment_id: inv.id,
        listing_id: listingId,
        amount: Number(inv.amount_paid),
        currency: inv.currency,
        status: 'completed' as const,
        description: 'Tournament cancelled: full refund',
      });
    }

    await adminClient.from('escrow').update({
      status: 'refunded' as 'refunded',
      tournament_result: tournamentResult,
      prize_amount: 0,
      settled_at: new Date().toISOString(),
    }).eq('listing_id', listingId);

    await adminClient.from('listings').update({ status: 'cancelled' as const }).eq('id', listingId);

    return NextResponse.json({ success: true, action: 'approved', nextStep: 'refunded' });
  }

  return NextResponse.json({ success: true, action: 'approved' });
}

// ═══════════════════════════════════════════════
// Helper: recalculate player stats after settlement
// ═══════════════════════════════════════════════
async function updatePlayerStats(adminClient: any, playerId: string) {
  const { data: settledListings } = await adminClient
    .from('listings')
    .select('*')
    .eq('player_id', playerId)
    .eq('status', 'settled');

  if (!settledListings?.length) return;

  const { data: escrowRecords } = await adminClient
    .from('escrow')
    .select('*')
    .in('listing_id', settledListings.map((l: any) => l.id));

  let totalBuyIns = 0;
  let totalPrize = 0;
  let cashedCount = 0;

  for (const sl of settledListings) {
    const { data: t } = await adminClient.from('tournaments').select('buy_in').eq('id', sl.tournament_id).single();
    if (t) totalBuyIns += Number(t.buy_in);
    const esc = (escrowRecords || []).find((e: any) => e.listing_id === sl.id);
    if (esc && esc.tournament_result === 'win') {
      totalPrize += Number(esc.prize_amount || 0);
      cashedCount++;
    }
  }

  const roi = totalBuyIns > 0 ? ((totalPrize - totalBuyIns) / totalBuyIns) * 100 : 0;
  const cashRate = settledListings.length > 0 ? (cashedCount / settledListings.length) * 100 : 0;

  // Get current stats for reliability tracking
  const { data: currentStats } = await adminClient
    .from('player_stats')
    .select('tournaments_settled_on_time, tournaments_defaulted')
    .eq('player_id', playerId)
    .single();

  const onTime = (currentStats?.tournaments_settled_on_time || 0) + 1;
  const defaulted = currentStats?.tournaments_defaulted || 0;
  const reliability = onTime + defaulted > 0 ? (onTime / (onTime + defaulted)) * 100 : 100;

  await adminClient.from('player_stats').upsert({
    player_id: playerId,
    lifetime_roi: Math.round(roi * 100) / 100,
    total_tournaments: settledListings.length,
    cash_rate: Math.round(cashRate * 100) / 100,
    biggest_win: Math.max(totalPrize, 0),
    tournaments_settled_on_time: onTime,
    tournaments_defaulted: defaulted,
    reliability_score: Math.round(reliability * 100) / 100,
    updated_at: new Date().toISOString(),
  });
}
