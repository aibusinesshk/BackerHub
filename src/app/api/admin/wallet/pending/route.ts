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

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await checkAdmin(supabase);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'deposit' | 'withdrawal' | null (both)

  const adminClient = await createAdminClient();
  let query = adminClient
    .from('transactions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (type === 'deposit' || type === 'withdrawal') {
    query = query.eq('type', type);
  } else {
    query = query.in('type', ['deposit', 'withdrawal']);
  }

  const { data: transactions, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Join with profile display names
  const userIds = [...new Set((transactions || []).map((t: any) => t.user_id))] as string[];
  let profileMap = new Map<string, any>();
  if (userIds.length > 0) {
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, display_name, display_name_zh, email, region')
      .in('id', userIds);
    profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  }

  const result = (transactions || []).map((t: any) => {
    const profile = profileMap.get(t.user_id);
    return {
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      paymentMethod: t.payment_method,
      referenceNumber: t.reference_number,
      bankAccountInfo: t.bank_account_info,
      status: t.status,
      description: t.description,
      createdAt: t.created_at,
      user: profile ? {
        id: profile.id,
        displayName: profile.display_name,
        displayNameZh: profile.display_name_zh,
        email: profile.email,
        region: profile.region,
      } : null,
    };
  });

  return NextResponse.json({ transactions: result });
}
