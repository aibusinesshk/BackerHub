import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('wallet_balance, region')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const currencyMap: Record<string, string> = { TW: 'TWD', HK: 'HKD' };
  const currency = currencyMap[profile.region] || 'USD';

  return NextResponse.json({
    balance: Number(profile.wallet_balance),
    currency,
  });
}
