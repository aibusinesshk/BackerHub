import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: investments }, { data: transactions }] = await Promise.all([
    (supabase.from('investments') as any).select('id, listing_id, investor_id, shares_purchased, amount_paid, platform_fee, status, payment_method, created_at').eq('investor_id', user.id).order('created_at', { ascending: false }),
    (supabase.from('transactions') as any).select('id, type, amount, currency, payment_method, status, description, description_zh, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ]);

  const allInvestments = investments || [];
  const totalInvested = allInvestments.reduce((sum: number, inv: any) => sum + Number(inv.amount_paid), 0);
  const activeInvestments = allInvestments.filter((inv: any) => inv.status === 'confirmed').length;
  const totalReturns = (transactions || [])
    .filter((t: any) => t.type === 'payout')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const roi = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0;

  // Join investments with listing/player/tournament data for portfolio view
  const listingIds = [...new Set(allInvestments.map((inv: any) => inv.listing_id))] as string[];
  let portfolioListings: any[] = [];
  if (listingIds.length > 0) {
    const { data: listings } = await (supabase.from('listings') as any).select('id, player_id, tournament_id, markup, status, total_shares_offered, shares_sold').in('id', listingIds);
    if (listings && listings.length > 0) {
      const playerIds = [...new Set(listings.map((l: any) => l.player_id))] as string[];
      const tournamentIds = [...new Set(listings.map((l: any) => l.tournament_id))] as string[];
      const [{ data: profiles }, { data: stats }, { data: tournaments }] = await Promise.all([
        (supabase.from('profiles') as any).select('id, display_name, display_name_zh, avatar_url, is_verified, region, color_tone').in('id', playerIds),
        (supabase.from('player_stats') as any).select('player_id, lifetime_roi').in('player_id', playerIds),
        (supabase.from('tournaments') as any).select('id, name, name_zh, venue, venue_zh, date, buy_in, type, game, region, guaranteed_pool').in('id', tournamentIds),
      ]);
      const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
      const statsMap = new Map<string, any>((stats || []).map((s: any) => [s.player_id, s]));
      const tournamentMap = new Map<string, any>((tournaments || []).map((t: any) => [t.id, t]));

      // Build investment lookup: listing_id -> aggregated investment details
      const investmentsByListing = new Map<string, { sharesPurchased: number; amountPaid: number; platformFee: number; investmentStatus: string; paymentMethod: string | null; investedAt: string }>();
      for (const inv of allInvestments) {
        const existing = investmentsByListing.get(inv.listing_id);
        if (existing) {
          existing.sharesPurchased += Number(inv.shares_purchased);
          existing.amountPaid += Number(inv.amount_paid);
          existing.platformFee += Number(inv.platform_fee);
        } else {
          investmentsByListing.set(inv.listing_id, {
            sharesPurchased: Number(inv.shares_purchased),
            amountPaid: Number(inv.amount_paid),
            platformFee: Number(inv.platform_fee),
            investmentStatus: inv.status,
            paymentMethod: inv.payment_method,
            investedAt: inv.created_at,
          });
        }
      }

      portfolioListings = listings.map((l: any) => {
        const profile = profileMap.get(l.player_id);
        const playerStat = statsMap.get(l.player_id);
        const tournament = tournamentMap.get(l.tournament_id);
        const inv = investmentsByListing.get(l.id);
        return {
          id: l.id,
          player: profile ? {
            id: profile.id,
            displayName: profile.display_name, displayNameZh: profile.display_name_zh,
            avatarUrl: profile.avatar_url || '',
            isVerified: profile.is_verified,
            region: profile.region,
            colorTone: profile.color_tone || null,
            stats: { lifetimeROI: playerStat ? Number(playerStat.lifetime_roi) : 0 },
          } : null,
          tournament: tournament ? {
            name: tournament.name, nameZh: tournament.name_zh,
            venue: tournament.venue, venueZh: tournament.venue_zh,
            buyIn: Number(tournament.buy_in), date: tournament.date,
            type: tournament.type, game: tournament.game, region: tournament.region,
            guaranteedPool: Number(tournament.guaranteed_pool),
          } : null,
          markup: Number(l.markup), status: l.status,
          totalSharesOffered: Number(l.total_shares_offered),
          sharesSold: Number(l.shares_sold),
          // Per-investor investment details
          investment: inv || null,
        };
      });
    }
  }

  return NextResponse.json({
    stats: {
      totalBacked: totalInvested, activeInvestments, totalReturns,
      roi: Math.round(roi * 10) / 10,
    },
    portfolio: portfolioListings,
    transactions: (transactions || []).map((t: any) => ({
      id: t.id, type: t.type, amount: Number(t.amount), currency: t.currency,
      paymentMethod: t.payment_method, status: t.status,
      description: t.description, descriptionZh: t.description_zh, createdAt: t.created_at,
    })),
  });
}
