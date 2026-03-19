import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/cron/lifecycle
// Called by a cron job (e.g. Vercel Cron, external scheduler) to auto-transition listing statuses.
// Protected by CRON_SECRET header.
export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== (process.env.CRON_SECRET || 'backerhub-cron-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const now = new Date();
  const results: Record<string, number> = {};

  // 1. registered → in_progress: tournament date has passed
  const { data: registeredListings } = await admin
    .from('listings')
    .select('id, tournament_id')
    .eq('status', 'registered');

  if (registeredListings && registeredListings.length > 0) {
    const tournamentIds = [...new Set(registeredListings.map((l: any) => l.tournament_id))];
    const { data: tournaments } = await admin
      .from('tournaments')
      .select('id, date')
      .in('id', tournamentIds);

    const pastTournaments = new Set(
      (tournaments || [])
        .filter((t: any) => new Date(t.date) <= now)
        .map((t: any) => t.id)
    );

    const toInProgress = registeredListings
      .filter((l: any) => pastTournaments.has(l.tournament_id))
      .map((l: any) => l.id);

    if (toInProgress.length > 0) {
      await admin
        .from('listings')
        .update({ status: 'in_progress' })
        .in('id', toInProgress);
    }
    results.registered_to_in_progress = toInProgress.length;
  }

  // 2. in_progress → pending_result: tournament date + 1 day has passed (give time for tournament to end)
  // Only flag these — the player still needs to submit their result
  // We just track overdue ones for admin alerts
  const { data: inProgressListings } = await admin
    .from('listings')
    .select('id, player_id, tournament_id')
    .eq('status', 'in_progress');

  if (inProgressListings && inProgressListings.length > 0) {
    const tournamentIds = [...new Set(inProgressListings.map((l: any) => l.tournament_id))];
    const { data: tournaments } = await admin
      .from('tournaments')
      .select('id, date')
      .in('id', tournamentIds);

    const overdueDate = new Date(now);
    overdueDate.setDate(overdueDate.getDate() - 3); // 3 days after tournament

    const overdueTournaments = new Set(
      (tournaments || [])
        .filter((t: any) => new Date(t.date) <= overdueDate)
        .map((t: any) => t.id)
    );

    const overdueListings = inProgressListings
      .filter((l: any) => overdueTournaments.has(l.tournament_id))
      .map((l: any) => l.id);

    results.overdue_result_submissions = overdueListings.length;

    // Create notifications for overdue result submissions
    if (overdueListings.length > 0) {
      for (const listingId of overdueListings) {
        const listing = inProgressListings.find((l: any) => l.id === listingId);
        if (listing) {
          await admin.from('notifications').upsert({
            user_id: (listing as any).player_id,
            type: 'deadline_warning',
            title: 'Tournament result overdue',
            title_zh: '錦標賽結果逾期',
            message: 'Your tournament result submission is overdue. Please submit your result immediately.',
            message_zh: '您的錦標賽結果提交已逾期。請立即提交結果。',
            listing_id: listingId,
            is_read: false,
          }, { onConflict: 'user_id,listing_id,type', ignoreDuplicates: true });
        }
      }
    }
  }

  // 3. Check overdue registration proofs (buy_in_released for > 48 hours)
  const { data: awaitingRegistration } = await admin
    .from('listings')
    .select('id, player_id, deadline_registration')
    .eq('status', 'buy_in_released');

  let overdueRegistrations = 0;
  if (awaitingRegistration) {
    for (const l of awaitingRegistration as any[]) {
      if (l.deadline_registration && new Date(l.deadline_registration) < now) {
        overdueRegistrations++;
        // Notify admin about overdue registration
        await admin.from('notifications').upsert({
          user_id: l.player_id,
          type: 'deadline_warning',
          title: 'Registration proof overdue',
          title_zh: '報名證明逾期',
          message: 'Your registration proof upload deadline has passed. Please upload proof immediately or contact support.',
          message_zh: '您的報名證明上傳期限已過。請立即上傳證明或聯繫客服。',
          listing_id: l.id,
          is_read: false,
        }, { onConflict: 'user_id,listing_id,type', ignoreDuplicates: true });
      }
    }
  }
  results.overdue_registrations = overdueRegistrations;

  // 4. Check overdue prize deposits (pending_deposit past deadline)
  const { data: pendingDeposits } = await admin
    .from('listings')
    .select('id, player_id, deadline_deposit')
    .eq('status', 'pending_deposit');

  let overdueDeposits = 0;
  if (pendingDeposits) {
    for (const l of pendingDeposits as any[]) {
      if (l.deadline_deposit && new Date(l.deadline_deposit) < now) {
        overdueDeposits++;
        // Mark player as defaulted (increment default count)
        await admin.from('notifications').upsert({
          user_id: l.player_id,
          type: 'deadline_critical',
          title: 'Prize deposit overdue — action required',
          title_zh: '獎金入帳逾期 — 需要立即處理',
          message: 'Your prize deposit deadline has passed. Failure to deposit may result in account suspension and a default on your reliability score.',
          message_zh: '您的獎金入帳期限已過。未能入帳可能導致帳號停權和可靠度評分違約。',
          listing_id: l.id,
          is_read: false,
        }, { onConflict: 'user_id,listing_id,type', ignoreDuplicates: true });
      }
    }
  }
  results.overdue_deposits = overdueDeposits;

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    results,
  });
}
