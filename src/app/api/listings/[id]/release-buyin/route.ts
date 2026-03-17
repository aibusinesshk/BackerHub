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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;

  // 1. Check admin auth
  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminClient = await createAdminClient();

  // 2. Get listing and verify status is 'filled'
  const { data: listing, error: listingError } = await adminClient
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (listing.status !== 'filled') {
    return NextResponse.json(
      { error: `Listing status must be 'filled', currently '${listing.status}'` },
      { status: 400 }
    );
  }

  // 3. Get the tournament for this listing
  const { data: tournament, error: tournamentError } = await adminClient
    .from('tournaments')
    .select('*')
    .eq('id', listing.tournament_id)
    .single();

  if (tournamentError || !tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // 4. Get all confirmed investments and calculate breakdown
  const { data: investmentRaw, error: investmentError } = await adminClient
    .from('investments')
    .select('*')
    .eq('listing_id', listingId)
    .eq('status', 'confirmed');

  if (investmentError) {
    return NextResponse.json({ error: investmentError.message }, { status: 500 });
  }

  const investments = investmentRaw || [];

  if (investments.length === 0) {
    return NextResponse.json({ error: 'No confirmed investments found' }, { status: 400 });
  }

  const totalAmountPaid = investments.reduce((sum: number, inv: any) => sum + Number(inv.amount_paid), 0);
  const totalPlatformFees = investments.reduce((sum: number, inv: any) => sum + Number(inv.platform_fee), 0);
  const totalBaseCost = Number(tournament.buy_in) * (Number(listing.shares_sold) / 100);
  const totalMarkup = totalAmountPaid - totalBaseCost - totalPlatformFees;
  const buyInToRelease = totalBaseCost;
  const markupToRelease = totalMarkup;
  const totalToRelease = buyInToRelease + markupToRelease;

  // 5. Credit player wallet: buy_in + markup
  const { error: walletError } = await adminClient.rpc('adjust_wallet_balance', {
    p_user_id: listing.player_id,
    p_amount: totalToRelease,
  });

  if (walletError) {
    return NextResponse.json({ error: `Failed to credit wallet: ${walletError.message}` }, { status: 500 });
  }

  // 6. Create transaction record
  await adminClient.from('transactions').insert({
    user_id: listing.player_id,
    type: 'buy_in_release' as any,
    listing_id: listingId,
    amount: totalToRelease,
    currency: 'USD',
    status: 'completed' as const,
    description: `Buy-in release: $${buyInToRelease.toFixed(2)} buy-in + $${markupToRelease.toFixed(2)} markup`,
  });

  // 7. Update escrow record
  await adminClient.from('escrow').update({
    buy_in_released: true,
    buy_in_released_at: new Date().toISOString(),
    buy_in_amount: buyInToRelease,
    markup_amount: markupToRelease,
    platform_fee_amount: totalPlatformFees,
  } as any).eq('listing_id', listingId);

  // 8. Update listing status to 'buy_in_released' and set deadline_registration
  const deadlineRegistration = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await adminClient.from('listings').update({
    status: 'buy_in_released' as any,
    deadline_registration: deadlineRegistration,
  } as any).eq('id', listingId);

  // 9. Return success with breakdown
  return NextResponse.json({
    success: true,
    breakdown: {
      totalAmountPaid,
      totalPlatformFees,
      totalBaseCost,
      totalMarkup,
      buyInReleased: buyInToRelease,
      markupReleased: markupToRelease,
      totalReleased: totalToRelease,
      deadlineRegistration,
    },
  });
}
