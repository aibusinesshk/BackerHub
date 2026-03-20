import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MIN_DEPOSIT, MAX_DEPOSIT, PLATFORM_WALLET } from '@/lib/constants';
import { financialRateLimit } from '@/lib/rate-limit';
import { createPayment } from '@/lib/nowpayments';

function generateReferenceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEP-${date}-${rand}`;
}

function getBaseUrl(): string {
  // In production, use the deployed URL; in dev, fallback to localhost
  return process.env.NEXT_PUBLIC_SITE_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || 'http://localhost:3000';
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success: rlOk } = financialRateLimit(user.id);
  if (!rlOk) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
  }

  const body = await request.json();
  const { amount, paymentMethod } = body;
  const currency = 'USD';

  if (!amount || !paymentMethod) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validCoins = ['usdt', 'usdc', 'btc', 'eth'];
  if (!validCoins.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < MIN_DEPOSIT || numAmount > MAX_DEPOSIT) {
    return NextResponse.json({
      error: `Amount must be between ${MIN_DEPOSIT} and ${MAX_DEPOSIT}`,
    }, { status: 400 });
  }

  const referenceNumber = generateReferenceNumber();
  const coinName = paymentMethod.toUpperCase();

  // Try NOWPayments integration first, fallback to manual if not configured
  const nowpaymentsKey = process.env.NOWPAYMENTS_API_KEY;
  let paymentData: {
    walletAddress: string;
    network: string;
    paymentId?: string;
    payAmount?: number;
    payCurrency?: string;
    expiresAt?: string;
    mode: 'auto' | 'manual';
  };

  if (nowpaymentsKey) {
    // === AUTOMATED MODE: Create NOWPayments invoice ===
    try {
      const baseUrl = getBaseUrl();
      const payment = await createPayment({
        priceAmount: numAmount,
        payCurrency: paymentMethod,
        orderId: referenceNumber,
        orderDescription: `BackerHub deposit $${numAmount} via ${coinName}`,
        ipnCallbackUrl: `${baseUrl}/api/wallet/deposit/nowpayments-webhook`,
      });

      paymentData = {
        walletAddress: payment.pay_address,
        network: payment.pay_currency,
        paymentId: payment.payment_id,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
        expiresAt: payment.expiration_estimate_date,
        mode: 'auto',
      };
    } catch (err) {
      console.error('NOWPayments error, falling back to manual:', err);
      // Fallback to manual mode
      paymentData = {
        walletAddress: PLATFORM_WALLET.address,
        network: PLATFORM_WALLET.networkShort,
        mode: 'manual',
      };
    }
  } else {
    // === MANUAL MODE: Show platform wallet (legacy) ===
    paymentData = {
      walletAddress: PLATFORM_WALLET.address,
      network: PLATFORM_WALLET.networkShort,
      mode: 'manual',
    };
  }

  // Create transaction record
  const { data: transaction, error: txError } = await (supabase.from('transactions') as any)
    .insert({
      user_id: user.id,
      type: 'deposit',
      amount: Math.round(numAmount * 100) / 100,
      currency,
      payment_method: paymentMethod,
      status: 'pending',
      reference_number: referenceNumber,
      description: `Deposit via ${coinName}${paymentData.mode === 'auto' ? ' (auto)' : ''}`,
      description_zh: `透過 ${coinName} 儲值${paymentData.mode === 'auto' ? ' (自動)' : ''}`,
      // Store NOWPayments metadata in bank_account_info JSONB field
      bank_account_info: paymentData.paymentId ? {
        nowpayments_id: paymentData.paymentId,
        pay_address: paymentData.walletAddress,
        pay_amount: paymentData.payAmount,
        pay_currency: paymentData.payCurrency,
        expires_at: paymentData.expiresAt,
        mode: paymentData.mode,
      } : {
        mode: 'manual',
        platform_address: PLATFORM_WALLET.address,
      },
    })
    .select()
    .single();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  return NextResponse.json({
    transactionId: transaction.id,
    referenceNumber,
    walletAddress: paymentData.walletAddress,
    network: paymentData.network,
    coin: paymentMethod,
    payAmount: paymentData.payAmount,
    payCurrency: paymentData.payCurrency,
    expiresAt: paymentData.expiresAt,
    paymentId: paymentData.paymentId,
    mode: paymentData.mode,
    status: 'pending',
  });
}
