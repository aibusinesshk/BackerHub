import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MIN_WITHDRAWAL, MAX_WITHDRAWAL, MAX_PENDING_WITHDRAWALS } from '@/lib/constants';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { amount, coin, walletAddress } = body;

  if (!amount || !coin || !walletAddress) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validCoins = ['usdt', 'usdc'];
  if (!validCoins.includes(coin)) {
    return NextResponse.json({ error: 'Invalid coin. Use usdt or usdc.' }, { status: 400 });
  }

  if (!walletAddress || walletAddress.length < 10) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL || numAmount > MAX_WITHDRAWAL) {
    return NextResponse.json({
      error: `Amount must be between ${MIN_WITHDRAWAL} and ${MAX_WITHDRAWAL}`,
    }, { status: 400 });
  }

  // Check if player has pending prize deposits (withdrawal locked)
  const { data: pendingDeposits } = await (supabase.from('listings') as any)
    .select('id', { count: 'exact', head: true })
    .eq('player_id', user.id)
    .eq('status', 'pending_deposit');

  if (pendingDeposits && pendingDeposits.length > 0) {
    return NextResponse.json({
      error: 'Withdrawals are locked while you have pending prize deposits. Please complete your prize deposits first.',
    }, { status: 400 });
  }

  // Check pending withdrawal limit
  const { count } = await (supabase.from('transactions') as any)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'withdrawal')
    .eq('status', 'pending');

  if ((count || 0) >= MAX_PENDING_WITHDRAWALS) {
    return NextResponse.json({
      error: `Maximum ${MAX_PENDING_WITHDRAWALS} pending withdrawals allowed`,
    }, { status: 400 });
  }

  // Deduct balance immediately (prevents spending funds while withdrawal is pending)
  const { error: rpcError } = await (supabase as any).rpc('adjust_wallet_balance', {
    p_user_id: user.id,
    p_amount: -numAmount,
  });

  if (rpcError) {
    // CHECK constraint violation means insufficient funds
    if (rpcError.message?.includes('check') || rpcError.message?.includes('violates')) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  // Create pending withdrawal transaction
  const referenceNumber = `WD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const coinName = coin.toUpperCase();

  const { data: transaction, error: txError } = await (supabase.from('transactions') as any)
    .insert({
      user_id: user.id,
      type: 'withdrawal',
      amount: Math.round(numAmount * 100) / 100,
      currency: 'USD',
      payment_method: coin,
      status: 'pending',
      reference_number: referenceNumber,
      bank_account_info: { coin, walletAddress, network: 'TRC-20' },
      description: `Withdrawal via ${coinName} to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      description_zh: `透過 ${coinName} 提款至 ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    })
    .select()
    .single();

  if (txError) {
    // Refund balance if transaction creation fails
    await (supabase as any).rpc('adjust_wallet_balance', {
      p_user_id: user.id,
      p_amount: numAmount,
    });
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  return NextResponse.json({
    transactionId: transaction.id,
    referenceNumber,
    status: 'pending',
    message: 'Withdrawal request submitted. It will be processed within 1-3 business days.',
  });
}
