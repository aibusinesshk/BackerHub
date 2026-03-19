import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// POST /api/listings/[id]/cancel
// Allows a player to cancel their own listing (only if active and not yet filled)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch listing
  const admin = await createAdminClient();
  const { data: listing, error: listingError } = await admin
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // Only the listing owner can cancel
  if (listing.player_id !== user.id) {
    return NextResponse.json({ error: 'You can only cancel your own listings' }, { status: 403 });
  }

  // Can only cancel active listings (not yet filled or in progress)
  if (listing.status !== 'active') {
    return NextResponse.json({
      error: `Cannot cancel a listing with status "${listing.status}". Only active listings can be cancelled.`,
    }, { status: 400 });
  }

  // Refund all existing investments
  const { data: investments } = await admin
    .from('investments')
    .select('*')
    .eq('listing_id', id)
    .eq('status', 'active');

  if (investments && investments.length > 0) {
    for (const inv of investments) {
      // Refund each backer
      await admin.rpc('adjust_wallet_balance', {
        p_user_id: inv.user_id,
        p_amount: Number(inv.amount),
      });

      // Create refund transaction
      await admin.from('transactions').insert({
        user_id: inv.user_id,
        type: 'refund',
        amount: Number(inv.amount),
        currency: 'USD',
        payment_method: 'wallet',
        status: 'completed',
        listing_id: id,
        description: `Refund — listing cancelled by player`,
        description_zh: `退款 — 選手取消列表`,
      });

      // Mark investment as refunded
      await admin
        .from('investments')
        .update({ status: 'refunded' })
        .eq('id', inv.id);
    }
  }

  // Update escrow if exists
  await admin
    .from('escrow')
    .update({ settlement_status: 'refunded' })
    .eq('listing_id', id);

  // Cancel the listing
  await admin
    .from('listings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  return NextResponse.json({
    success: true,
    refundedInvestments: investments?.length || 0,
    message: 'Listing cancelled. All backers have been refunded.',
  });
}
