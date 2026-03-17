import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// POST — Player submits a tournament result
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { listingId, tournamentResult, prizeAmount, finishPosition, totalEntries, proofUrl, notes } = body;

  if (!listingId || !tournamentResult) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['win', 'loss', 'cancelled'].includes(tournamentResult)) {
    return NextResponse.json({ error: 'Invalid tournament result' }, { status: 400 });
  }

  if (tournamentResult === 'win' && (!prizeAmount || prizeAmount <= 0)) {
    return NextResponse.json({ error: 'Prize amount required for win result' }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  // Verify listing exists and belongs to this player
  const { data: listing } = await adminClient
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (listing.player_id !== user.id) {
    return NextResponse.json({ error: 'You can only submit results for your own listings' }, { status: 403 });
  }

  if (listing.status === 'settled') {
    return NextResponse.json({ error: 'This listing has already been settled' }, { status: 400 });
  }

  // Check for existing non-rejected result
  const { data: existingResult } = await adminClient
    .from('tournament_results')
    .select('*')
    .eq('listing_id', listingId)
    .neq('status', 'rejected')
    .maybeSingle();

  if (existingResult) {
    return NextResponse.json({ error: 'A result has already been submitted for this listing' }, { status: 400 });
  }

  // Delete any rejected results so we can resubmit (UNIQUE constraint on listing_id)
  await adminClient
    .from('tournament_results')
    .delete()
    .eq('listing_id', listingId)
    .eq('status', 'rejected');

  // Create the tournament result record
  const { data: result, error: insertError } = await adminClient
    .from('tournament_results')
    .insert({
      listing_id: listingId,
      player_id: user.id,
      tournament_result: tournamentResult,
      prize_amount: tournamentResult === 'win' ? prizeAmount : 0,
      finish_position: finishPosition || null,
      total_entries: totalEntries || null,
      proof_url: proofUrl || null,
      notes: notes || null,
      status: 'pending_review',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Update listing status to pending_result
  await adminClient
    .from('listings')
    .update({ status: 'pending_result' })
    .eq('id', listingId);

  return NextResponse.json({ result });
}

// GET — Player fetches their own results
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = await createAdminClient();

  const { data: results, error } = await adminClient
    .from('tournament_results')
    .select('*')
    .eq('player_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: results || [] });
}
