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

// GET — Admin fetches lifecycle data: filled listings, awaiting registration, pending deposits
export async function GET() {
  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminClient = await createAdminClient();

  // Fetch listings in various lifecycle states
  const [
    { data: filled },
    { data: buyInReleased },
    { data: pendingDeposit },
  ] = await Promise.all([
    adminClient.from('listings').select('*').eq('status', 'filled'),
    adminClient.from('listings').select('*').eq('status', 'buy_in_released'),
    adminClient.from('listings').select('*').eq('status', 'pending_deposit'),
  ]);

  const allListings = [...(filled || []), ...(buyInReleased || []), ...(pendingDeposit || [])];
  if (allListings.length === 0) {
    return NextResponse.json({ filledListings: [], awaitingRegistration: [], pendingDeposits: [] });
  }

  // Gather IDs for joins
  const tournamentIds = [...new Set(allListings.map((l: any) => l.tournament_id))];
  const playerIds = [...new Set(allListings.map((l: any) => l.player_id))];
  const listingIds = allListings.map((l: any) => l.id);

  const [{ data: tournaments }, { data: players }, { data: investments }, { data: escrows }, { data: results }, { data: playerStats }] = await Promise.all([
    adminClient.from('tournaments').select('*').in('id', tournamentIds),
    adminClient.from('profiles').select('id, display_name, display_name_zh, avatar_url').in('id', playerIds),
    adminClient.from('investments').select('*').in('listing_id', listingIds).eq('status', 'confirmed'),
    adminClient.from('escrow').select('*').in('listing_id', listingIds),
    adminClient.from('tournament_results').select('*').in('listing_id', listingIds),
    adminClient.from('player_stats').select('player_id, reliability_score').in('player_id', playerIds),
  ]);

  const tournamentMap = new Map((tournaments || []).map((t: any) => [t.id, t]));
  const playerMap = new Map((players || []).map((p: any) => [p.id, p]));
  const escrowMap = new Map((escrows || []).map((e: any) => [e.listing_id, e]));
  const resultMap = new Map((results || []).map((r: any) => [r.listing_id, r]));
  const statsMap = new Map((playerStats || []).map((s: any) => [s.player_id, s]));

  // Group investments by listing
  const investmentsByListing = new Map<string, any[]>();
  for (const inv of (investments || [])) {
    const list = investmentsByListing.get(inv.listing_id) || [];
    list.push(inv);
    investmentsByListing.set(inv.listing_id, list);
  }

  function enrichListing(l: any) {
    const tournament = tournamentMap.get(l.tournament_id);
    const player = playerMap.get(l.player_id);
    const stats = statsMap.get(l.player_id);
    const listingInvestments = investmentsByListing.get(l.id) || [];

    // Calculate buy-in breakdown
    const buyIn = tournament ? Number(tournament.buy_in) : 0;
    const sharesSold = Number(l.shares_sold);
    const baseCost = buyIn * (sharesSold / 100);
    const totalPaid = listingInvestments.reduce((sum: number, inv: any) => sum + Number(inv.amount_paid), 0);
    const platformFee = listingInvestments.reduce((sum: number, inv: any) => sum + Number(inv.platform_fee), 0);
    const markupTotal = totalPaid - baseCost - platformFee;
    const releaseToPlayer = baseCost + markupTotal;

    return {
      id: l.id,
      status: l.status,
      registrationProofUrl: l.registration_proof_url,
      deadlineRegistration: l.deadline_registration,
      deadlineDeposit: l.deadline_deposit,
      prizeDepositConfirmed: l.prize_deposit_confirmed,
      player: player ? {
        id: player.id,
        displayName: player.display_name,
        displayNameZh: player.display_name_zh,
      } : null,
      tournament: tournament ? {
        id: tournament.id,
        name: tournament.name,
        nameZh: tournament.name_zh,
        buyIn: Number(tournament.buy_in),
        date: tournament.date,
      } : null,
      reliability: stats?.reliability_score != null ? Number(stats.reliability_score) : undefined,
      breakdown: {
        baseCost,
        markupTotal: Math.max(markupTotal, 0),
        platformFee,
        releaseToPlayer,
        totalEscrowed: totalPaid,
      },
      backerCount: listingInvestments.length,
    };
  }

  // Enrich filled listings
  const filledListings = (filled || []).map(enrichListing);

  // Enrich buy_in_released listings (awaiting registration)
  const awaitingRegistration = (buyInReleased || []).map(enrichListing);

  // Enrich pending_deposit listings
  const pendingDeposits = (pendingDeposit || []).map((l: any) => {
    const enriched = enrichListing(l);
    const result = resultMap.get(l.id);
    const escrow = escrowMap.get(l.id);
    const prizeAmount = result ? Number(result.prize_amount) : (escrow ? Number(escrow.prize_amount) : 0);
    const sharesSold = Number(l.shares_sold);
    const expectedDeposit = prizeAmount * (sharesSold / 100);

    return {
      ...enriched,
      prizeAmount,
      expectedDeposit,
    };
  });

  return NextResponse.json({ filledListings, awaitingRegistration, pendingDeposits });
}
