import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { MIN_DEPOSIT, MAX_DEPOSIT, PLATFORM_BANK_DETAILS } from '@/lib/constants';
import { buildPaymentForm } from '@/lib/payments/ecpay';

function generateReferenceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEP-${date}-${rand}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { amount, paymentMethod, currency = 'USD' } = body;

  if (!amount || !paymentMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < MIN_DEPOSIT || numAmount > MAX_DEPOSIT) {
    return NextResponse.json({
      error: `Amount must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT}`,
    }, { status: 400 });
  }

  const referenceNumber = generateReferenceNumber();

  // Create pending deposit transaction
  const { data: transaction, error: txError } = await (supabase.from('transactions') as any)
    .insert({
      user_id: user.id,
      type: 'deposit',
      amount: Math.round(numAmount * 100) / 100,
      currency,
      payment_method: paymentMethod,
      status: 'pending',
      reference_number: referenceNumber,
      description: `Deposit via ${paymentMethod}`,
      description_zh: `透過 ${paymentMethod} 儲值`,
    })
    .select()
    .single();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  if (paymentMethod === 'bank-tw') {
    return NextResponse.json({
      transactionId: transaction.id,
      referenceNumber,
      bankDetails: PLATFORM_BANK_DETAILS,
      status: 'pending',
      message: 'Please transfer to the bank account and include the reference number in the memo.',
    });
  }

  if (paymentMethod === 'ecpay') {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3001';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const { actionUrl, params } = buildPaymentForm(
      numAmount,
      referenceNumber,
      `${baseUrl}/api/wallet/deposit/ecpay-callback`,
      `${baseUrl}/en/dashboard/investor`,
    );

    return NextResponse.json({
      transactionId: transaction.id,
      referenceNumber,
      paymentMethod: 'ecpay',
      status: 'pending',
      ecpayFormData: { actionUrl, params },
    });
  }

  return NextResponse.json({
    transactionId: transaction.id,
    referenceNumber,
    status: 'pending',
  });
}
