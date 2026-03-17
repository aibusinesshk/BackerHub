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

// GET all escrow records (admin only)
export async function GET() {
  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminClient = await createAdminClient();
  const { data: escrows, error } = await adminClient
    .from('escrow')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ escrows: escrows || [] });
}

// PUT — settle a tournament (admin only)
export async function PUT(request: Request) {
  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { listingId, tournamentResult, prizeAmount } = body;

  if (!listingId || !tournamentResult) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  // Fetch listing
  const { data: listing } = await adminClient
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Fetch investments
  const { data: investmentRaw } = await adminClient
    .from('investments')
    .select('*')
    .eq('listing_id', listingId)
    .eq('status', 'confirmed');
  const investments = investmentRaw || [];

  if (tournamentResult === 'win' && prizeAmount > 0) {
    const totalSharesSold = Number(listing.shares_sold);
    const playerKeepsPercent = 100 - totalSharesSold;
    const investorPool = prizeAmount * (totalSharesSold / 100);

    for (const inv of investments) {
      const investorShare = (Number(inv.shares_purchased) / totalSharesSold) * investorPool;

      // Credit investor wallet
      await adminClient.rpc('adjust_wallet_balance', {
        p_user_id: inv.investor_id,
        p_amount: investorShare,
      });

      await adminClient.from('transactions').insert({
        user_id: inv.investor_id,
        type: 'payout' as const,
        investment_id: inv.id,
        listing_id: listingId,
        amount: investorShare,
        currency: inv.currency,
        status: 'completed' as const,
        description: `Prize distribution: ${inv.shares_purchased}% of $${prizeAmount} prize`,
      });

      await adminClient.from('investments').update({ status: 'settled' as const }).eq('id', inv.id);
    }

    // Credit player wallet
    const playerPayout = prizeAmount * (playerKeepsPercent / 100);
    await adminClient.rpc('adjust_wallet_balance', {
      p_user_id: listing.player_id,
      p_amount: playerPayout,
    });

    await adminClient.from('transactions').insert({
      user_id: listing.player_id,
      type: 'payout' as const,
      listing_id: listingId,
      amount: playerPayout,
      currency: 'USD',
      status: 'completed' as const,
      description: `Player prize: ${playerKeepsPercent}% of $${prizeAmount} prize`,
    });
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
  } else if (tournamentResult === 'cancelled') {
    for (const inv of investments) {
      // Refund investor wallet
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
  }

  // Update escrow
  await adminClient.from('escrow').update({
    status: (tournamentResult === 'cancelled' ? 'refunded' : 'settled') as 'refunded' | 'settled',
    tournament_result: tournamentResult,
    prize_amount: prizeAmount || 0,
    settled_at: new Date().toISOString(),
  }).eq('listing_id', listingId);

  // Update listing status
  await adminClient.from('listings').update({ status: 'settled' as const }).eq('id', listingId);

  // Update player stats
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

    await adminClient.from('player_stats').upsert({
      player_id: listing.player_id,
      lifetime_roi: Math.round(roi * 100) / 100,
      total_tournaments: settledListings.length,
      cash_rate: Math.round(cashRate * 100) / 100,
      biggest_win: totalPrize,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}
