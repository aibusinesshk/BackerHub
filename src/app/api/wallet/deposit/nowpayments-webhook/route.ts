import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyIpnSignature, isPaymentComplete, PAYMENT_STATUSES } from '@/lib/nowpayments';

/**
 * NOWPayments IPN (Instant Payment Notification) webhook.
 *
 * Called by NOWPayments when a payment status changes.
 * On "finished" status → auto-credits the user's wallet balance.
 *
 * Security:
 *  - Verifies HMAC-SHA512 signature using IPN secret
 *  - Uses admin client (service role) to bypass RLS
 *  - Idempotent: checks transaction is still pending before crediting
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-nowpayments-sig') || '';

  // Verify webhook signature
  if (!signature) {
    console.error('[NOWPayments Webhook] Missing signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  try {
    const valid = await verifyIpnSignature(rawBody, signature);
    if (!valid) {
      console.error('[NOWPayments Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch (err) {
    console.error('[NOWPayments Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const {
    payment_id,
    payment_status,
    order_id,        // Our reference_number (DEP-YYYYMMDD-XXXX)
    price_amount,    // Original USD amount
    actually_paid,
    pay_currency,
    outcome_amount,
  } = payload;

  console.log(`[NOWPayments Webhook] payment_id=${payment_id} status=${payment_status} order=${order_id} paid=${actually_paid}`);

  const adminClient = await createAdminClient();

  // Find the matching pending transaction by reference_number
  const { data: transaction, error: findError } = await adminClient
    .from('transactions')
    .select('*')
    .eq('reference_number', order_id)
    .eq('type', 'deposit')
    .single();

  if (findError || !transaction) {
    console.error(`[NOWPayments Webhook] Transaction not found for order_id=${order_id}`, findError);
    // Return 200 so NOWPayments doesn't retry forever
    return NextResponse.json({ ok: true, message: 'Transaction not found' });
  }

  // Update the stored NOWPayments metadata
  const existingMeta = (transaction.bank_account_info as Record<string, unknown>) || {};
  const updatedMeta = {
    ...existingMeta,
    nowpayments_id: payment_id,
    payment_status,
    actually_paid,
    pay_currency,
    outcome_amount,
    last_webhook_at: new Date().toISOString(),
  };

  // If payment is complete and transaction is still pending → credit wallet
  if (isPaymentComplete(payment_status) && transaction.status === 'pending') {
    const creditAmount = Number(price_amount) || Number(transaction.amount);

    // Credit the user's wallet
    const { error: rpcError } = await adminClient.rpc('adjust_wallet_balance', {
      p_user_id: transaction.user_id,
      p_amount: creditAmount,
    });

    if (rpcError) {
      console.error(`[NOWPayments Webhook] Failed to credit wallet for user=${transaction.user_id}:`, rpcError);
      // Update transaction with error note but don't mark completed
      await adminClient.from('transactions').update({
        bank_account_info: {
          ...updatedMeta,
          credit_error: rpcError.message,
        },
      }).eq('id', transaction.id);

      return NextResponse.json({ ok: false, error: 'Failed to credit wallet' }, { status: 500 });
    }

    // Mark transaction as completed
    await adminClient.from('transactions').update({
      status: 'completed',
      bank_account_info: updatedMeta,
      admin_note: `Auto-approved via NOWPayments. Payment ID: ${payment_id}. Paid: ${actually_paid} ${pay_currency}`,
      reviewed_at: new Date().toISOString(),
    }).eq('id', transaction.id);

    console.log(`[NOWPayments Webhook] Auto-credited $${creditAmount} to user=${transaction.user_id}`);
    return NextResponse.json({ ok: true, action: 'credited' });
  }

  // Handle failed/expired payments
  if (
    payment_status === PAYMENT_STATUSES.FAILED ||
    payment_status === PAYMENT_STATUSES.EXPIRED ||
    payment_status === PAYMENT_STATUSES.REFUNDED
  ) {
    if (transaction.status === 'pending') {
      await adminClient.from('transactions').update({
        status: 'failed',
        bank_account_info: updatedMeta,
        admin_note: `Payment ${payment_status} via NOWPayments. Payment ID: ${payment_id}`,
        reviewed_at: new Date().toISOString(),
      }).eq('id', transaction.id);

      console.log(`[NOWPayments Webhook] Marked deposit as failed: ${payment_status}`);
    }
    return NextResponse.json({ ok: true, action: 'failed' });
  }

  // For intermediate statuses (waiting, confirming, confirmed, sending), just update metadata
  await adminClient.from('transactions').update({
    bank_account_info: updatedMeta,
  }).eq('id', transaction.id);

  return NextResponse.json({ ok: true, action: 'updated' });
}
