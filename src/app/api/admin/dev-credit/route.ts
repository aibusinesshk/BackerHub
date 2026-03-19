import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/admin/dev-credit — Add test funds to a user's wallet (dev only)
// Protected: requires SEED_SECRET header
// Accepts either { email, amount } or { userId, amount }
export async function POST(request: Request) {
  const seedSecret = request.headers.get('x-seed-secret');
  if (!seedSecret || seedSecret !== (process.env.SEED_SECRET || 'backerhub-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, userId: providedUserId, amount } = body;

  if ((!email && !providedUserId) || !amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Provide (email or userId) and a positive amount' }, { status: 400 });
  }

  const admin = await createAdminClient();
  let userId: string | null = providedUserId || null;

  if (!userId && email) {
    // Look up user by email in profiles table
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    userId = profile?.id || null;
  }

  if (!userId) {
    return NextResponse.json({
      error: `No user found with email: ${email}. If you just signed up, your profile may not exist yet. Try providing userId directly.`,
    }, { status: 404 });
  }

  // Ensure profile exists (in case trigger didn't fire)
  if (email) {
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      await admin.from('profiles').insert({
        id: userId,
        display_name: email.split('@')[0],
        email,
        role: 'investor',
        region: 'TW',
      });
    }
  }

  // Credit wallet
  const { data: newBalance, error: rpcError } = await admin.rpc('adjust_wallet_balance', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (rpcError) {
    return NextResponse.json({ error: `Failed to credit wallet: ${rpcError.message}` }, { status: 500 });
  }

  // Create a transaction record for audit trail
  await admin.from('transactions').insert({
    user_id: userId,
    type: 'deposit',
    amount,
    currency: 'USD',
    status: 'completed',
    payment_method: 'dev-credit',
    description: `Dev test credit of $${amount}`,
    description_zh: `開發測試充值 $${amount}`,
  });

  return NextResponse.json({
    success: true,
    email,
    userId,
    credited: amount,
    newBalance,
  });
}
