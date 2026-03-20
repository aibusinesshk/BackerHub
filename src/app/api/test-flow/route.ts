import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/test-flow
 *
 * Creates a test tournament (tomorrow) + a listing for the current logged-in player,
 * optionally fast-forwarding the listing to a specific lifecycle stage.
 *
 * Body:
 *   stage?: 'active' | 'filled' | 'buy_in_released' | 'registered' | 'in_progress' | 'pending_result' | 'pending_deposit'
 *           (default: 'active')
 *   prizeAmount?: number  (used when stage is 'pending_deposit', default: 5000)
 *
 * Requirements:
 *   - User must be logged in with role 'player' or 'both'
 *   - Protected with x-seed-secret header
 *
 * Returns the created tournament, listing, and any test investments.
 */
export async function POST(request: Request) {
  const seedSecret = request.headers.get('x-seed-secret');
  if (!seedSecret || seedSecret !== (process.env.SEED_SECRET || 'backerhub-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized. Include x-seed-secret header.' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Must be logged in as a player' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const stage = body.stage || 'active';
  const prizeAmount = body.prizeAmount || 5000;

  const validStages = ['active', 'filled', 'buy_in_released', 'registered', 'in_progress', 'pending_result', 'pending_deposit'];
  if (!validStages.includes(stage)) {
    return NextResponse.json({ error: `Invalid stage. Use one of: ${validStages.join(', ')}` }, { status: 400 });
  }

  const admin = await createAdminClient();

  // 1. Create a test tournament dated tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tournamentDate = tomorrow.toISOString().split('T')[0];

  const { data: tournament, error: tError } = await admin.from('tournaments').insert({
    name: `Test Flow - MTT ${tournamentDate}`,
    name_zh: `測試流程 - MTT ${tournamentDate}`,
    venue: 'Test Venue, Taipei',
    venue_zh: '測試場地，台北',
    date: tournamentDate,
    buy_in: 1000,
    guaranteed_pool: 100000,
    type: 'MTT',
    game: 'NLHE',
    region: 'TW',
  }).select().single();

  if (tError || !tournament) {
    return NextResponse.json({ error: `Failed to create tournament: ${tError?.message}` }, { status: 500 });
  }

  // 2. Create a listing for the current user
  const { data: listing, error: lError } = await admin.from('listings').insert({
    player_id: user.id,
    tournament_id: tournament.id,
    markup: 1.15,
    total_shares_offered: 60,
    shares_sold: 0,
    min_threshold: 40,
    status: 'active',
  }).select().single();

  if (lError || !listing) {
    return NextResponse.json({ error: `Failed to create listing: ${lError?.message}` }, { status: 500 });
  }

  // 3. Create escrow record
  await admin.from('escrow').insert({ listing_id: listing.id });

  const result: any = { tournament, listing: { ...listing }, stage, investmentIds: [] };

  // 4. If stage > 'active', simulate backers filling the listing
  if (stage !== 'active') {
    // Fill the listing (set shares_sold = total_shares_offered)
    await admin.from('listings').update({
      shares_sold: listing.total_shares_offered,
      status: 'filled',
    }).eq('id', listing.id);
    result.listing.shares_sold = listing.total_shares_offered;
    result.listing.status = 'filled';

    // Create a fake test investor investment
    const totalCost = (1000 * (listing.total_shares_offered / 100) * listing.markup);
    const { data: investment } = await admin.from('investments').insert({
      listing_id: listing.id,
      investor_id: user.id, // self-invest for test (normally different user)
      shares_purchased: listing.total_shares_offered,
      amount_paid: totalCost,
      currency: 'USD',
      platform_fee: 0,
      status: 'confirmed',
      payment_method: 'wallet',
      payment_reference: 'test-flow',
    }).select().single();

    if (investment) result.investmentIds.push(investment.id);

    // Update escrow
    await admin.from('escrow').update({
      total_held: totalCost,
      status: 'holding',
    }).eq('listing_id', listing.id);
  }

  // 5. If stage > 'filled', release buy-in
  if (['buy_in_released', 'registered', 'in_progress', 'pending_result', 'pending_deposit'].includes(stage)) {
    const deadline48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    await admin.from('listings').update({
      status: 'buy_in_released',
      deadline_registration: deadline48h,
    }).eq('id', listing.id);
    result.listing.status = 'buy_in_released';
    result.listing.deadline_registration = deadline48h;
  }

  // 6. If stage > 'buy_in_released', confirm registration
  if (['registered', 'in_progress', 'pending_result', 'pending_deposit'].includes(stage)) {
    await admin.from('listings').update({
      status: 'registered',
      registration_proof_url: 'https://example.com/test-registration-proof.png',
      registration_confirmed_at: new Date().toISOString(),
    }).eq('id', listing.id);
    result.listing.status = 'registered';
  }

  // 7. If stage > 'registered', move to in_progress
  if (['in_progress', 'pending_result', 'pending_deposit'].includes(stage)) {
    const resultDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from('listings').update({
      status: 'in_progress',
      deadline_result: resultDeadline,
    }).eq('id', listing.id);
    result.listing.status = 'in_progress';
    result.listing.deadline_result = resultDeadline;
  }

  // 8. If stage > 'in_progress', move to pending_result
  if (['pending_result', 'pending_deposit'].includes(stage)) {
    await admin.from('listings').update({
      status: 'pending_result',
    }).eq('id', listing.id);
    result.listing.status = 'pending_result';
  }

  // 9. If stage === 'pending_deposit', simulate approved win result
  if (stage === 'pending_deposit') {
    // Create tournament_result
    await admin.from('tournament_results').insert({
      listing_id: listing.id,
      player_id: user.id,
      tournament_result: 'win',
      prize_amount: prizeAmount,
      finish_position: 3,
      total_entries: 250,
      status: 'approved',
      submitted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    });

    const depositDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from('listings').update({
      status: 'pending_deposit',
      deadline_deposit: depositDeadline,
    }).eq('id', listing.id);
    result.listing.status = 'pending_deposit';
    result.listing.deadline_deposit = depositDeadline;
    result.prizeAmount = prizeAmount;
    result.expectedDeposit = prizeAmount * (listing.total_shares_offered / 100);
  }

  return NextResponse.json({
    success: true,
    message: `Test listing created at stage: ${stage}`,
    ...result,
    howToTest: getTestInstructions(stage),
  });
}

/**
 * GET /api/test-flow — List all test tournaments/listings for cleanup
 */
export async function GET() {
  const admin = await createAdminClient();
  const { data: tournaments } = await admin.from('tournaments')
    .select('id, name, date')
    .like('name', 'Test Flow%')
    .order('date', { ascending: false });
  return NextResponse.json({ testTournaments: tournaments || [] });
}

/**
 * DELETE /api/test-flow — Clean up all test data
 */
export async function DELETE(request: Request) {
  const seedSecret = request.headers.get('x-seed-secret');
  if (!seedSecret || seedSecret !== (process.env.SEED_SECRET || 'backerhub-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await createAdminClient();

  // Find test tournament IDs
  const { data: testTournaments } = await admin.from('tournaments')
    .select('id')
    .like('name', 'Test Flow%');

  if (!testTournaments || testTournaments.length === 0) {
    return NextResponse.json({ message: 'No test data to clean up' });
  }

  const tournamentIds = testTournaments.map((t: any) => t.id);

  // Find listings for these tournaments
  const { data: testListings } = await admin.from('listings')
    .select('id')
    .in('tournament_id', tournamentIds);

  const listingIds = (testListings || []).map((l: any) => l.id);

  if (listingIds.length > 0) {
    // Clean up in dependency order
    await admin.from('tournament_results').delete().in('listing_id', listingIds);
    await admin.from('transactions').delete().in('listing_id', listingIds);
    await admin.from('investments').delete().in('listing_id', listingIds);
    await admin.from('escrow').delete().in('listing_id', listingIds);
    await admin.from('listings').delete().in('id', listingIds);
  }

  await admin.from('tournaments').delete().in('id', tournamentIds);

  return NextResponse.json({
    success: true,
    cleaned: { tournaments: tournamentIds.length, listings: listingIds.length },
  });
}

function getTestInstructions(stage: string): string[] {
  const instructions: Record<string, string[]> = {
    active: [
      '1. Go to /dashboard/player/listings — you should see the new listing as "Active"',
      '2. Click "Edit" to test editing markup/shares/threshold',
      '3. Try "Cancel Listing" to test cancellation flow',
      '4. Or manually advance: call POST /api/test-flow with stage="filled" to simulate backers',
    ],
    filled: [
      '1. Go to /dashboard/player/listings — listing shows as "Fully Backed"',
      '2. Wait for admin to release buy-in (or call POST with stage="buy_in_released")',
      '3. Note: in production, admin reviews and clicks "Release Buy-in" from /admin/results',
    ],
    buy_in_released: [
      '1. Go to /dashboard/player/listings — listing shows "Buy-in Released"',
      '2. You should see the registration proof upload prompt with 48h deadline',
      '3. Upload a proof URL to test the registration confirmation flow',
      '4. Or advance: POST with stage="registered"',
    ],
    registered: [
      '1. Go to /dashboard/player/listings — listing shows "Registration Confirmed"',
      '2. Status will auto-advance to "In Progress" when tournament starts',
      '3. Or advance: POST with stage="in_progress"',
    ],
    in_progress: [
      '1. Go to /dashboard/player/listings — listing shows "Tournament In Progress"',
      '2. Click "Submit Result" to test the result submission form',
      '3. Choose Win/Loss/Cancelled and fill in details',
      '4. Or advance: POST with stage="pending_result"',
    ],
    pending_result: [
      '1. Go to /dashboard/player/listings — listing shows "Awaiting Result"',
      '2. Click "Submit Result" to submit your tournament outcome',
      '3. After submitting, an admin reviews at /admin/results',
      '4. Or advance: POST with stage="pending_deposit" (simulates approved win)',
    ],
    pending_deposit: [
      '1. Go to /dashboard/player/listings — listing shows "Awaiting Prize Deposit"',
      '2. You should see the expected deposit amount and 14-day deadline',
      '3. Note the "Withdrawals locked" warning',
      '4. Admin confirms deposit at /admin/results to settle the listing',
    ],
  };
  return instructions[stage] || [];
}
