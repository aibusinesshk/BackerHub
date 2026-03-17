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

export async function PUT(request: Request) {
  const supabase = await createClient();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { transactionId, action, adminNote } = body;

  if (!transactionId || !action || !['complete', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  // Fetch the transaction
  const { data: transaction } = await adminClient
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('type', 'withdrawal')
    .eq('status', 'pending')
    .single();

  if (!transaction) {
    return NextResponse.json({ error: 'Pending withdrawal not found' }, { status: 404 });
  }

  if (action === 'complete') {
    // Balance was already deducted at request time — just mark complete
    await adminClient.from('transactions').update({
      status: 'completed',
      admin_note: adminNote || null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', transactionId);

    return NextResponse.json({ success: true, action: 'completed' });
  }

  // Reject — refund the balance
  const { error: rpcError } = await adminClient.rpc('adjust_wallet_balance', {
    p_user_id: transaction.user_id,
    p_amount: Number(transaction.amount), // positive = refund
  });

  if (rpcError) {
    return NextResponse.json({ error: `Failed to refund balance: ${rpcError.message}` }, { status: 500 });
  }

  await adminClient.from('transactions').update({
    status: 'failed',
    admin_note: adminNote || 'Withdrawal rejected by admin',
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', transactionId);

  return NextResponse.json({ success: true, action: 'rejected' });
}
