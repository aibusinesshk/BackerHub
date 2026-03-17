import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyCallback } from '@/lib/payments/ecpay';

export async function POST(request: Request) {
  // ECPay sends form-urlencoded data
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });

  // Verify the callback is authentic
  if (!verifyCallback(params)) {
    return new Response('0|CheckMacValue verification failed', { status: 400 });
  }

  const merchantTradeNo = params.MerchantTradeNo;
  const rtnCode = params.RtnCode;

  if (!merchantTradeNo) {
    return new Response('0|Missing MerchantTradeNo', { status: 400 });
  }

  const adminClient = await createAdminClient();

  // Find the transaction by reference number (strip dashes to match MerchantTradeNo format)
  const { data: transactions } = await adminClient
    .from('transactions')
    .select('*')
    .eq('type', 'deposit')
    .eq('payment_method', 'ecpay')
    .like('reference_number', `%${merchantTradeNo.substring(3)}%`); // DEP prefix was stripped

  // Also try exact match on reference_number with dashes removed
  let transaction = (transactions || []).find(
    (t: any) => t.reference_number?.replace(/-/g, '').substring(0, 20) === merchantTradeNo
  );

  if (!transaction) {
    // Fallback: search by reference_number pattern
    const { data: fallback } = await adminClient
      .from('transactions')
      .select('*')
      .eq('type', 'deposit')
      .eq('payment_method', 'ecpay')
      .eq('status', 'pending');

    transaction = (fallback || []).find(
      (t: any) => t.reference_number?.replace(/-/g, '').substring(0, 20) === merchantTradeNo
    );
  }

  if (!transaction) {
    return new Response('0|Transaction not found', { status: 404 });
  }

  // Idempotency check — already processed
  if (transaction.status === 'completed') {
    return new Response('1|OK');
  }

  if (rtnCode === '1') {
    // Payment successful — credit wallet
    await adminClient.rpc('adjust_wallet_balance', {
      p_user_id: transaction.user_id,
      p_amount: Number(transaction.amount),
    });

    await adminClient.from('transactions').update({
      status: 'completed',
      admin_note: `ECPay confirmed: RtnCode=${rtnCode}, TradeNo=${params.TradeNo || ''}`,
      reviewed_at: new Date().toISOString(),
    }).eq('id', transaction.id);
  } else {
    // Payment failed
    await adminClient.from('transactions').update({
      status: 'failed',
      admin_note: `ECPay failed: RtnCode=${rtnCode}, RtnMsg=${params.RtnMsg || ''}`,
      reviewed_at: new Date().toISOString(),
    }).eq('id', transaction.id);
  }

  // ECPay requires "1|OK" response on success
  return new Response('1|OK');
}
