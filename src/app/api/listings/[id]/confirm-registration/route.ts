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

// POST - Player uploads registration proof
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get listing and verify ownership
  const { data: listing, error: listingError } = await (supabase
    .from('listings') as any)
    .select('*')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (listing.player_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (listing.status !== 'buy_in_released') {
    return NextResponse.json({ error: 'Listing status must be buy_in_released' }, { status: 400 });
  }

  const { registrationProofUrl } = await request.json();

  if (!registrationProofUrl) {
    return NextResponse.json({ error: 'registrationProofUrl is required' }, { status: 400 });
  }

  const { error: updateError } = await (supabase
    .from('listings') as any)
    .update({ registration_proof_url: registrationProofUrl })
    .eq('id', listingId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PUT - Admin confirms registration
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createClient();

  const admin = await checkAdmin(supabase);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = await createAdminClient();

  // Get listing and verify conditions
  const { data: listing, error: listingError } = await (adminClient
    .from('listings') as any)
    .select('*, tournaments(*)')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (listing.status !== 'buy_in_released') {
    return NextResponse.json({ error: 'Listing status must be buy_in_released' }, { status: 400 });
  }

  if (!listing.registration_proof_url) {
    return NextResponse.json({ error: 'Registration proof not uploaded yet' }, { status: 400 });
  }

  // Calculate deadline_result: tournament date + 3 days
  const tournamentDate = new Date(listing.tournaments?.date || listing.tournament_date);
  const deadlineResult = new Date(tournamentDate);
  deadlineResult.setDate(deadlineResult.getDate() + 3);

  const { error: updateError } = await (adminClient
    .from('listings') as any)
    .update({
      status: 'registered',
      registration_confirmed_at: new Date().toISOString(),
      deadline_result: deadlineResult.toISOString(),
    })
    .eq('id', listingId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
