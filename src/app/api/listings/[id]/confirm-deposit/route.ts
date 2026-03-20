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

// POST — Admin confirms prize deposit and triggers settlement to backers
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;

  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { depositAmount } = body;

  if (depositAmount == null || typeof depositAmount !== 'number' || depositAmount <= 0) {
    return NextResponse.json({ error: 'Invalid depositAmount' }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  // 1. Fetch listing and verify status is 'pending_deposit'
  const { data: listing } = await adminClient
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }
  if (listing.status !== 'pending_deposit') {
    return NextResponse.json(
      { error: `Listing status must be 'pending_deposit', got '${listing.status}'` },
      { status: 400 }
    );
  }

  // 2. Get the tournament_result record for this listing
  const { data: tournamentResult } = await adminClient
    .from('tournament_results')
    .select('*')
    .eq('listing_id', listingId)
    .single();

  if (!tournamentResult) {
    return NextResponse.json({ error: 'Tournament result not found for this listing' }, { status: 404 });
  }
  if (tournamentResult.status !== 'approved') {
    return NextResponse.json(
      { error: `Tournament result must be 'approved', got '${tournamentResult.status}'` },
      { status: 400 }
    );
  }

  // 3. Calculate expected backer pool and verify deposit amount
  const prizeAmount = Number(tournamentResult.prize_amount);
  const totalSharesSold = Number(listing.shares_sold);
  const expectedBackerPool = prizeAmount * (totalSharesSold / 100);

  if (depositAmount < expectedBackerPool - 0.01) {
    return NextResponse.json(
      {
        error: 'Deposit amount is less than expected backer pool',
        expected: expectedBackerPool,
        received: depositAmount,
      },
      { status: 400 }
    );
  }

  // 4. Fetch all confirmed investments for this listing
  const { data: investmentRaw } = await adminClient
    .from('investments')
    .select('*')
    .eq('listing_id', listingId)
    .eq('status', 'confirmed');
  const investments = investmentRaw || [];

  // 5. Distribute to backers
  const distributions: Array<{
    investorId: string;
    investmentId: string;
    sharePercent: number;
    amount: number;
  }> = [];

  // Process all investor distributions in parallel
  await Promise.all(investments.map(async (inv: any) => {
    const investorShare = (Number(inv.shares_purchased) / totalSharesSold) * depositAmount;

    // Credit wallet, create payout tx, and settle investment in parallel
    await Promise.all([
      adminClient.rpc('adjust_wallet_balance', {
        p_user_id: inv.investor_id,
        p_amount: investorShare,
      }),
      adminClient.from('transactions').insert({
        user_id: inv.investor_id,
        type: 'payout' as const,
        investment_id: inv.id,
        listing_id: listingId,
        amount: investorShare,
        currency: inv.currency,
        status: 'completed' as const,
        description: `Prize distribution: ${inv.shares_purchased}% of $${prizeAmount} prize (deposit confirmed)`,
      }),
      adminClient.from('investments').update({ status: 'settled' as const }).eq('id', inv.id),
    ]);

    distributions.push({
      investorId: inv.investor_id,
      investmentId: inv.id,
      sharePercent: Number(inv.shares_purchased),
      amount: investorShare,
    });
  }));

  // 6. Create prize_deposit transaction for the player (recording what they deposited)
  await adminClient.from('transactions').insert({
    user_id: listing.player_id,
    type: 'deposit' as const,
    listing_id: listingId,
    amount: depositAmount,
    currency: 'USD',
    status: 'completed' as const,
    description: `Prize deposit: player deposited $${depositAmount} for backer settlement`,
  });

  // 7. Update listing
  await adminClient
    .from('listings')
    .update({
      prize_deposit_confirmed: true,
      prize_deposit_confirmed_at: new Date().toISOString(),
      prize_deposit_amount: depositAmount,
      status: 'settled' as any,
    } as any)
    .eq('id', listingId);

  // 8. Update escrow
  await adminClient
    .from('escrow')
    .update({
      status: 'settled' as const,
      settled_at: new Date().toISOString(),
    })
    .eq('listing_id', listingId);

  // 9. Update player stats (same recalculation as existing escrow settlement code)
  const { data: settledListings } = await adminClient
    .from('listings')
    .select('*')
    .eq('player_id', listing.player_id)
    .eq('status', 'settled');

  if (settledListings?.length) {
    const { data: escrowRecords } = await adminClient
      .from('escrow')
      .select('*')
      .in('listing_id', settledListings.map((l: any) => l.id));

    // Batch fetch all tournament buy-ins instead of N+1
    const settledTournamentIds = [...new Set(settledListings.map((l: any) => l.tournament_id))];
    const { data: settledTournaments } = await adminClient.from('tournaments').select('id, buy_in').in('id', settledTournamentIds);
    const buyInMap = new Map<string, number>((settledTournaments || []).map((t: any) => [t.id, Number(t.buy_in)]));

    let totalBuyIns = 0;
    let totalPrize = 0;
    let cashedCount = 0;

    for (const sl of settledListings) {
      totalBuyIns += buyInMap.get(sl.tournament_id) || 0;
      const esc = (escrowRecords || []).find((e: any) => e.listing_id === sl.id);
      if (esc && esc.tournament_result === 'win') {
        totalPrize += Number(esc.prize_amount || 0);
        cashedCount++;
      }
    }

    const roi = totalBuyIns > 0 ? ((totalPrize - totalBuyIns) / totalBuyIns) * 100 : 0;
    const cashRate = settledListings.length > 0 ? (cashedCount / settledListings.length) * 100 : 0;

    // Fetch existing stats for tournaments_settled_on_time
    const { data: existingStats } = await adminClient
      .from('player_stats')
      .select('*')
      .eq('player_id', listing.player_id)
      .single();

    const tournamentsSettledOnTime = ((existingStats as any)?.tournaments_settled_on_time || 0) + 1;
    const reliabilityScore = settledListings.length > 0
      ? Math.round((tournamentsSettledOnTime / settledListings.length) * 100 * 100) / 100
      : 0;

    await adminClient.from('player_stats').upsert({
      player_id: listing.player_id,
      lifetime_roi: Math.round(roi * 100) / 100,
      total_tournaments: settledListings.length,
      cash_rate: Math.round(cashRate * 100) / 100,
      biggest_win: totalPrize,
      tournaments_settled_on_time: tournamentsSettledOnTime,
      reliability_score: reliabilityScore,
      updated_at: new Date().toISOString(),
    } as any);
  }

  return NextResponse.json({
    success: true,
    depositAmount,
    expectedBackerPool,
    totalDistributed: distributions.reduce((sum, d) => sum + d.amount, 0),
    distributions,
    backerCount: distributions.length,
  });
}
