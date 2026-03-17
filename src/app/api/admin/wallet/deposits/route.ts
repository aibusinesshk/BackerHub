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

  if (!transactionId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const adminClient = await createAdminClient();

  // Fetch the transaction
  const { data: transaction } = await adminClient
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('type', 'deposit')
    .eq('status', 'pending')
    .single();

  if (!transaction) {
    return NextResponse.json({ error: 'Pending deposit not found' }, { status: 404 });
  }

  if (action === 'approve') {
    // Credit wallet balance
    const { error: rpcError } = await adminClient.rpc('adjust_wallet_balance', {
      p_user_id: transaction.user_id,
      p_amount: Number(transaction.amount),
    });

    if (rpcError) {
      return NextResponse.json({ error: `Failed to credit balance: ${rpcError.message}` }, { status: 500 });
    }

    // Update transaction status
    await adminClient.from('transactions').update({
      status: 'completed',
      admin_note: adminNote || null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', transactionId);

    return NextResponse.json({ success: true, action: 'approved' });
  }

  // Reject
  await adminClient.from('transactions').update({
    status: 'failed',
    admin_note: adminNote || 'Deposit rejected by admin',
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', transactionId);

  return NextResponse.json({ success: true, action: 'rejected' });
}
