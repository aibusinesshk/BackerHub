import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MIN_DEPOSIT, MAX_DEPOSIT, PLATFORM_WALLET } from '@/lib/constants';

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
  const { amount, paymentMethod } = body;
  const currency = 'USD';

  if (!amount || !paymentMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validCoins = ['usdt', 'usdc'];
  if (!validCoins.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method. Use usdt or usdc.' }, { status: 400 });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < MIN_DEPOSIT || numAmount > MAX_DEPOSIT) {
    return NextResponse.json({
      error: `Amount must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT}`,
    }, { status: 400 });
  }

  const referenceNumber = generateReferenceNumber();
  const coinName = paymentMethod.toUpperCase();

  const { data: transaction, error: txError } = await (supabase.from('transactions') as any)
    .insert({
      user_id: user.id,
      type: 'deposit',
      amount: Math.round(numAmount * 100) / 100,
      currency,
      payment_method: paymentMethod,
      status: 'pending',
      reference_number: referenceNumber,
      description: `Deposit via ${coinName} (TRC-20)`,
      description_zh: `透過 ${coinName} (TRC-20) 儲值`,
    })
    .select()
    .single();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  return NextResponse.json({
    transactionId: transaction.id,
    referenceNumber,
    walletAddress: PLATFORM_WALLET.address,
    network: PLATFORM_WALLET.networkShort,
    coin: paymentMethod,
    status: 'pending',
  });
}
