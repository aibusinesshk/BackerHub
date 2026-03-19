import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/admin/dev-credit — Add test funds to a user's wallet (dev only)
// Protected: requires SEED_SECRET header
export async function POST(request: Request) {
  // Only allow in development or with seed secret
  const seedSecret = request.headers.get('x-seed-secret');
  if (!seedSecret || seedSecret !== (process.env.SEED_SECRET || 'backerhub-admin-2026')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, amount } = body;

  if (!email || !amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Provide email and a positive amount' }, { status: 400 });
  }

  const admin = await createAdminClient();

  // Look up user by email
  const { data: usersData } = await admin.auth.admin.listUsers();
  const user = usersData?.users?.find((u) => u.email === email);

  if (!user) {
    return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
  }

  // Credit wallet
  const { data: newBalance, error: rpcError } = await admin.rpc('adjust_wallet_balance', {
    p_user_id: user.id,
    p_amount: amount,
  });

  if (rpcError) {
    return NextResponse.json({ error: `Failed to credit wallet: ${rpcError.message}` }, { status: 500 });
  }

  // Create a transaction record for audit trail
  await admin.from('transactions').insert({
    user_id: user.id,
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
    credited: amount,
    newBalance,
  });
}
