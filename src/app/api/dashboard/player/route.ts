import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: profile }, { data: listings }, { data: transactions }] = await Promise.all([
    (supabase.from('profiles') as any).select('id,display_name,display_name_zh,avatar_url,region,is_verified,kyc_status,color_tone,wallet_balance').eq('id', user.id).single(),
    (supabase.from('listings') as any).select('id,player_id,tournament_id,markup,total_shares_offered,shares_sold,min_threshold,status,created_at,registration_proof_url,deadline_registration,deadline_deposit').eq('player_id', user.id).order('created_at', { ascending: false }),
    (supabase.from('transactions') as any).select('id,type,amount,currency,payment_method,status,description,description_zh,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);

  const allListings = listings || [];
  const activeListings = allListings.filter((l: any) => l.status === 'active').length;
  const totalSharesSold = allListings.reduce((sum: number, l: any) => sum + Number(l.shares_sold), 0);
  const totalEarnings = (transactions || [])
    .filter((t: any) => t.type === 'payout')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const avgMarkup = allListings.length > 0
    ? allListings.reduce((sum: number, l: any) => sum + Number(l.markup), 0) / allListings.length
    : 1.10;

  // Join listings with tournament data + result status — fetch in parallel
  const adminClient = await createAdminClient();
  const listingIds = allListings.map((l: any) => l.id) as string[];
  const tournamentIds = [...new Set(allListings.map((l: any) => l.tournament_id))] as string[];

  const [tournamentResults, resultResults] = await Promise.all([
    tournamentIds.length > 0
      ? (supabase.from('tournaments') as any).select('id,name,name_zh,venue,venue_zh,date,buy_in,guaranteed_pool,type,game,region').in('id', tournamentIds)
      : { data: [] },
    listingIds.length > 0
      ? adminClient.from('tournament_results').select('listing_id, status, tournament_result, prize_amount').in('listing_id', listingIds)
      : { data: [] },
  ]);

  const tournamentMap = new Map<string, any>(((tournamentResults as any).data || []).map((t: any) => [t.id, t]));
  const resultMap = new Map<string, any>(((resultResults as any).data || []).map((r: any) => [r.listing_id, r]));

  const joinedListings = allListings.map((l: any) => {
    const tournament = tournamentMap.get(l.tournament_id);
    const result = resultMap.get(l.id);

    // Calculate expected deposit for pending_deposit listings
    let expectedDeposit = 0;
    if (l.status === 'pending_deposit' && result?.tournament_result === 'win') {
      const prizeAmount = Number(result.prize_amount || 0);
      expectedDeposit = prizeAmount * (Number(l.shares_sold) / 100);
    }

    return {
      id: l.id, playerId: l.player_id,
      tournament: tournament ? {
        id: tournament.id, name: tournament.name, nameZh: tournament.name_zh,
        venue: tournament.venue, venueZh: tournament.venue_zh, date: tournament.date,
        buyIn: Number(tournament.buy_in), guaranteedPool: Number(tournament.guaranteed_pool),
        type: tournament.type, game: tournament.game, region: tournament.region,
      } : null,
      markup: Number(l.markup), totalActionOffered: Number(l.total_shares_offered),
      actionSold: Number(l.shares_sold), minThreshold: Number(l.min_threshold),
      status: l.status, createdAt: l.created_at,
      resultStatus: result?.status || null,
      tournamentResult: result?.tournament_result || null,
      // New lifecycle fields
      registrationProofUrl: l.registration_proof_url,
      deadlineRegistration: l.deadline_registration,
      deadlineDeposit: l.deadline_deposit,
      expectedDeposit,
    };
  });

  return NextResponse.json({
    profile,
    stats: { activeListings, totalListings: allListings.length, totalSharesSold, totalEarnings, avgMarkup: Math.round(avgMarkup * 100) / 100 },
    listings: joinedListings,
    transactions: (transactions || []).map((t: any) => ({
      id: t.id, type: t.type, amount: Number(t.amount), currency: t.currency,
      paymentMethod: t.payment_method, status: t.status,
      description: t.description, descriptionZh: t.description_zh, createdAt: t.created_at,
    })),
  });
}
