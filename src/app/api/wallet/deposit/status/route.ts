import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentStatus } from '@/lib/nowpayments';

/**
 * Poll the status of a pending deposit.
 *
 * GET /api/wallet/deposit/status?transactionId=xxx
 *
 * Returns the current status from both our DB and NOWPayments (if available).
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
  }

  // Fetch the transaction (RLS ensures user can only see their own)
  const { data: transaction, error: txError } = await (supabase.from('transactions') as any)
    .select('id, status, amount, reference_number, bank_account_info, created_at')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .eq('type', 'deposit')
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const meta = (transaction.bank_account_info as Record<string, unknown>) || {};
  const nowpaymentsId = meta.nowpayments_id as string | undefined;

  // If we have a NOWPayments ID and transaction is still pending,
  // optionally fetch fresh status from NOWPayments API
  let liveStatus: string | null = null;
  if (nowpaymentsId && transaction.status === 'pending') {
    try {
      const nps = await getPaymentStatus(nowpaymentsId);
      liveStatus = nps.payment_status;
    } catch {
      // Non-critical; user can still see DB status
    }
  }

  return NextResponse.json({
    transactionId: transaction.id,
    status: transaction.status,
    amount: transaction.amount,
    referenceNumber: transaction.reference_number,
    paymentStatus: liveStatus || meta.payment_status || null,
    payAddress: meta.pay_address || null,
    payAmount: meta.pay_amount || null,
    payCurrency: meta.pay_currency || null,
    mode: meta.mode || 'manual',
    createdAt: transaction.created_at,
  });
}
