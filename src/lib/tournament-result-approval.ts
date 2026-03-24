import { createAdminClient } from '@/lib/supabase/server';

/**
 * Approve a tournament result — shared logic used by admin route and AI auto-approve.
 * Returns { success, nextStep?, error? }
 */
export async function approveTournamentResult(
  resultId: string,
  reviewedBy: string,
) {
  const adminClient = await createAdminClient();

  // Fetch the result
  const { data: result } = await adminClient
    .from('tournament_results')
    .select('*')
    .eq('id', resultId)
    .single();

  if (!result) return { success: false, error: 'Result not found' };
  if (result.status !== 'pending_review') {
    return { success: false, error: 'Result is not pending review' };
  }

  const listingId = result.listing_id;
  const tournamentResult = result.tournament_result;
  const prizeAmount = Number(result.prize_amount);

  // Fetch listing
  const { data: listing } = await adminClient
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();
  if (!listing) return { success: false, error: 'Listing not found' };

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
      reviewed_by: reviewedBy,
    })
    .eq('id', resultId);

  if (tournamentResult === 'win' && prizeAmount > 0) {
    const totalSharesSold = Number(listing.shares_sold);
    const expectedDeposit = prizeAmount * (totalSharesSold / 100);

    const depositDeadline = new Date();
    depositDeadline.setDate(depositDeadline.getDate() + 14);

    await adminClient.from('listings').update({
      status: 'pending_deposit',
      deadline_deposit: depositDeadline.toISOString(),
    }).eq('id', listingId);

    await adminClient.from('escrow').update({
      tournament_result: tournamentResult,
      prize_amount: prizeAmount,
    }).eq('listing_id', listingId);

    return {
      success: true,
      nextStep: 'pending_deposit',
      expectedDeposit,
      depositDeadline: depositDeadline.toISOString(),
    };

  } else if (tournamentResult === 'loss') {
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

    await updatePlayerStats(adminClient, listing.player_id);

    return { success: true, nextStep: 'settled' };

  } else if (tournamentResult === 'cancelled') {
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

    return { success: true, nextStep: 'refunded' };
  }

  return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .in('listing_id', settledListings.map((l: any) => l.id));

  let totalBuyIns = 0;
  let totalPrize = 0;
  let cashedCount = 0;

  for (const sl of settledListings) {
    const { data: t } = await adminClient.from('tournaments').select('buy_in').eq('id', sl.tournament_id).single();
    if (t) totalBuyIns += Number(t.buy_in);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const esc = (escrowRecords || []).find((e: any) => e.listing_id === sl.id);
    if (esc && esc.tournament_result === 'win') {
      totalPrize += Number(esc.prize_amount || 0);
      cashedCount++;
    }
  }

  const roi = totalBuyIns > 0 ? ((totalPrize - totalBuyIns) / totalBuyIns) * 100 : 0;
  const cashRate = settledListings.length > 0 ? (cashedCount / settledListings.length) * 100 : 0;

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
