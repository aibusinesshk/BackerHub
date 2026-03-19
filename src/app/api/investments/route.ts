import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_FEE_PERCENT } from '@/lib/constants';
import { z } from 'zod';
import type { Investment, Listing, Tournament } from '@/lib/supabase/types';

const investmentSchema = z.object({
  listingId: z.string().uuid(),
  sharesPurchased: z.number().int().min(1).max(100),
});

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = (supabase
    .from('investments') as any)
    .select('*')
    .eq('investor_id', user.id);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false }) as { data: Investment[] | null; error: any };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ investments: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = investmentSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ');
    return NextResponse.json({ error: msg || 'Invalid input' }, { status: 400 });
  }
  const { listingId, sharesPurchased } = parsed.data;

  // Fetch the listing to calculate costs
  const { data: listing, error: listingError } = await (supabase
    .from('listings') as any)
    .select('*')
    .eq('id', listingId)
    .single() as { data: Listing | null; error: any };

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing is not active' }, { status: 400 });
  }

  // Prevent player from backing their own listing
  if (listing.player_id === user.id) {
    return NextResponse.json({ error: 'You cannot back your own listing' }, { status: 400 });
  }

  // Check shares availability
  const availableShares = listing.total_shares_offered - listing.shares_sold;
  if (sharesPurchased > availableShares) {
    return NextResponse.json({ error: 'Not enough shares available' }, { status: 400 });
  }

  // Fetch the tournament for buy-in calculation
  const { data: tournament, error: tournamentError } = await (supabase
    .from('tournaments') as any)
    .select('*')
    .eq('id', listing.tournament_id)
    .single() as { data: Tournament | null; error: any };

  if (tournamentError || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Calculate costs
  const baseCost = tournament.buy_in * (sharesPurchased / 100);
  const markupCost = baseCost * (listing.markup - 1);
  const platformFee = baseCost * (PLATFORM_FEE_PERCENT / 100);
  const totalAmount = baseCost + markupCost + platformFee;

  // Deduct from wallet balance
  const { error: walletError } = await (supabase as any).rpc('adjust_wallet_balance', {
    p_user_id: user.id,
    p_amount: -totalAmount,
  });

  if (walletError) {
    if (walletError.message?.includes('check') || walletError.message?.includes('violates')) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }
    return NextResponse.json({ error: walletError.message }, { status: 500 });
  }

  // Create investment (confirmed since wallet was deducted)
  const { data: investment, error: investError } = await (supabase
    .from('investments') as any)
    .insert({
      listing_id: listingId,
      investor_id: user.id,
      shares_purchased: sharesPurchased,
      amount_paid: totalAmount,
      currency: 'USD',
      platform_fee: platformFee,
      payment_method: 'wallet',
      status: 'confirmed',
    })
    .select()
    .single() as { data: Investment | null; error: any };

  if (investError) {
    // Refund wallet if investment creation fails
    await (supabase as any).rpc('adjust_wallet_balance', {
      p_user_id: user.id,
      p_amount: totalAmount,
    });
    return NextResponse.json({ error: investError.message }, { status: 500 });
  }

  // Create transaction record (completed since wallet was deducted)
  await (supabase.from('transactions') as any).insert({
    user_id: user.id,
    type: 'purchase',
    investment_id: investment!.id,
    listing_id: listingId,
    amount: totalAmount,
    currency: 'USD',
    payment_method: 'wallet',
    status: 'completed',
    description: `Backed ${sharesPurchased}% action`,
  });

  // Update listing shares_sold and check if fully filled
  const newSharesSold = listing.shares_sold + sharesPurchased;
  const newStatus = newSharesSold >= listing.total_shares_offered ? 'filled' : listing.status;
  await (supabase.from('listings') as any)
    .update({ shares_sold: newSharesSold, status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', listingId);

  // Update escrow
  await (supabase as any).rpc('increment_escrow', {
    p_listing_id: listingId,
    p_amount: totalAmount,
  }).catch(() => {
    return (supabase.from('escrow') as any)
      .update({ total_held: listing.shares_sold + totalAmount })
      .eq('listing_id', listingId);
  });

  return NextResponse.json({ investment }, { status: 201 });
}
